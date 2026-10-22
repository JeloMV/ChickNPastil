document.addEventListener('DOMContentLoaded', () => {
     const sectionSelect = document.getElementById('sectionSelect');
    const sectionForm = document.getElementById('addSectionForm');
    const productForm = document.getElementById('addProductForm');
    const tableContainer = document.getElementById('menuTableContainer');

    function loadMenu() {
        fetch('/api/menu?manage=true')
            .then(response => {
                if (!response.ok) throw new Error(`Menu request failed: ${response.status}`);
                return response.json();
            })
            .then(sections => {
                sectionSelect.innerHTML = '<option value="">Select Section...</option>';
                tableContainer.replaceChildren();

                sections.forEach(section => {
                    const option = document.createElement('option');
                    option.value = section.section_id;
                    option.textContent = section.name;
                    sectionSelect.appendChild(option);

                    const sectionBlock = document.createElement('section');
                    sectionBlock.className = 'menu-table-section';
                    const headingRow = document.createElement('div');
                    headingRow.className = 'menu-table-heading';

                    const heading = document.createElement('h4');
                    heading.textContent = section.name;
                    headingRow.appendChild(heading);

                    const sectionStatus = document.createElement('span');
                    sectionStatus.className = `menu-section-status ${section.is_available ? 'is-active' : 'is-archived'}`;
                    sectionStatus.textContent = section.is_available ? 'Active' : 'Archived';
                    headingRow.appendChild(sectionStatus);

                    const modifyButton = document.createElement('button');
                    modifyButton.type = 'button';
                    modifyButton.className = 'menu-section-modify';
                    modifyButton.textContent = 'Modify';
                    headingRow.appendChild(modifyButton);

                    const archiveButton = document.createElement('button');
                    archiveButton.type = 'button';
                    archiveButton.className = `menu-section-modify ${section.is_available ? 'menu-archive-button' : 'menu-restore-button'}`;
                    archiveButton.textContent = section.is_available ? 'Archive' : 'Restore';
                    headingRow.appendChild(archiveButton);
                    sectionBlock.appendChild(headingRow);

                    const table = document.createElement('table');
                    table.innerHTML = `
                        <thead><tr><th>Product</th><th>Price</th><th>Quantity</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody></tbody>
                    `;
                    const body = table.querySelector('tbody');

                    (section.items || []).forEach(item => {
                        const row = document.createElement('tr');
                        row.innerHTML = '<td></td><td></td><td></td><td></td><td></td>';
                        row.cells[0].textContent = item.name;
                        row.cells[1].textContent = `Php ${Number(item.price).toFixed(2)}`;
                        addProductControls(row, item);
                        body.appendChild(row);
                    });

                    sectionBlock.appendChild(table);
                    tableContainer.appendChild(sectionBlock);

                    modifyButton.addEventListener('click', () => editSection(headingRow, section));
                    archiveButton.addEventListener('click', () => {
                        const action = section.is_available ? 'archive' : 'restore';
                        const message = section.is_available
                            ? `Archive "${section.name}"? Its products will be hidden from ordering.`
                            : `Restore "${section.name}" for ordering?`;
                        if (!window.confirm(message)) return;

                        fetch(`/api/sections/${section.section_id}/toggle-availability`, { method: 'PATCH' })
                            .then(response => {
                                if (!response.ok) throw new Error(`Section ${action} failed: ${response.status}`);
                                loadMenu();
                            })
                            .catch(error => {
                                alert(error.message);
                                console.error(error);
                            });
                    });
                });
            })
            .catch(error => {
                tableContainer.textContent = `Unable to load menu. ${error.message}`;
                console.error(error);
            });
    }

    function toggleProduct(productId, action) {
        fetch(`/api/products/${productId}/${action}`, { method: 'PATCH' })
            .then(response => {
                if (!response.ok) throw new Error(`Product update failed: ${response.status}`);
                loadMenu();
            })
            .catch(error => {
                alert(error.message);
                console.error(error);
            });
    }

    function addProductControls(row, item) {
        const quantityButton = createStatusButton(
            item.allow_quantity ? 'Enabled' : 'Disabled',
            item.allow_quantity,
            () => toggleProduct(item.product_id, 'toggle-qty')
        );
        const availabilityButton = createStatusButton(
            item.is_available ? 'Available' : 'Unavailable',
            item.is_available,
            () => toggleProduct(item.product_id, 'toggle-availability')
        );
        row.cells[2].appendChild(quantityButton);
        row.cells[3].appendChild(availabilityButton);

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'menu-row-edit';
        editButton.textContent = 'Modify';
        editButton.addEventListener('click', () => editProductRow(row, item));
        row.cells[4].appendChild(editButton);
    }

    function createStatusButton(label, enabled, onClick) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `menu-status-toggle ${enabled ? 'is-enabled' : 'is-disabled'}`;
        button.textContent = label;
        button.addEventListener('click', onClick);
        return button;
    }

    function editProductRow(row, item) {
        row.innerHTML = `
            <td><input class="menu-row-input" type="text" required></td>
            <td><input class="menu-row-input menu-row-price" type="number" min="0" step="0.01" required></td>
            <td></td><td></td><td></td>
        `;
        const nameInput = row.cells[0].querySelector('input');
        const priceInput = row.cells[1].querySelector('input');
        nameInput.value = item.name;
        priceInput.value = Number(item.price).toFixed(2);
        row.cells[2].appendChild(createStatusButton(item.allow_quantity ? 'Enabled' : 'Disabled', item.allow_quantity, () => toggleProduct(item.product_id, 'toggle-qty')));
        row.cells[3].appendChild(createStatusButton(item.is_available ? 'Available' : 'Unavailable', item.is_available, () => toggleProduct(item.product_id, 'toggle-availability')));

        const saveButton = document.createElement('button');
        saveButton.type = 'button';
        saveButton.className = 'menu-row-edit';
        saveButton.textContent = 'Save';
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'menu-row-cancel';
        cancelButton.textContent = 'Cancel';
        row.cells[4].append(saveButton, cancelButton);

        saveButton.addEventListener('click', () => {
            const productName = nameInput.value.trim();
            const price = Number(priceInput.value);
            if (!productName || !Number.isFinite(price)) {
                alert('Product name and a valid price are required.');
                return;
            }
            fetch(`/api/products/${item.product_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_name: productName,
                    description: item.description,
                    price,
                    is_available: item.is_available,
                    allow_quantity: item.allow_quantity,
                    image_url: item.image_url
                })
            })
                .then(response => {
                    if (!response.ok) throw new Error(`Product update failed: ${response.status}`);
                    loadMenu();
                })
                .catch(error => {
                    alert(error.message);
                    console.error(error);
                });
        });
        cancelButton.addEventListener('click', loadMenu);
        nameInput.focus();
        nameInput.select();
    }

    function editSection(headingRow, section) {
        const editor = document.createElement('form');
        editor.className = 'menu-section-editor';
        editor.innerHTML = `
            <input type="text" value="${section.name}" required>
            <button type="submit">Save</button>
            <button type="button" class="cancel-edit">Cancel</button>
        `;
        headingRow.replaceChildren(editor);
        editor.addEventListener('submit', event => {
            event.preventDefault();
            fetch(`/api/sections/${section.section_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ section_name: editor.querySelector('input').value.trim() })
            })
                .then(response => {
                    if (!response.ok) throw new Error(`Section update failed: ${response.status}`);
                    loadMenu();
                })
                .catch(error => {
                    alert(error.message);
                    console.error(error);
                });
        });
        editor.querySelector('.cancel-edit').addEventListener('click', loadMenu);
        editor.querySelector('input').focus();
        editor.querySelector('input').select();
    }

    sectionForm.addEventListener('submit', event => {
        event.preventDefault();
        const sectionName = document.getElementById('sectionName').value.trim();

        fetch('/api/sections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ section_name: sectionName })
        })
            .then(response => {
                if (!response.ok) throw new Error(`Section creation failed: ${response.status}`);
                return response.json();
            })
            .then(() => {
                sectionForm.reset();
                loadMenu();
            })
            .catch(error => alert(error.message));
    });

    productForm.addEventListener('submit', event => {
        event.preventDefault();
        fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                section_id: sectionSelect.value,
                product_name: document.getElementById('productName').value.trim(),
                price: Number(document.getElementById('productPrice').value),
                allow_quantity: true
            })
        })
            .then(response => {
                if (!response.ok) throw new Error(`Product creation failed: ${response.status}`);
                return response.json();
            })
            .then(() => {
                productForm.reset();
                loadMenu();
            })
            .catch(error => alert(error.message));
    });

    loadMenu();
})
