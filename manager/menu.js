document.addEventListener('DOMContentLoaded', () => {
     const sectionSelect = document.getElementById('sectionSelect');
    const sectionForm = document.getElementById('addSectionForm');
    const productForm = document.getElementById('addProductForm');
    const tableContainer = document.getElementById('menuTableContainer');

    function loadMenu() {
        fetch('/api/menu')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Menu request failed: ${response.status}`);
                }
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

                    const heading = document.createElement('h4');
                    heading.textContent = section.name;
                    tableContainer.appendChild(heading);

                    const table = document.createElement('table');
                    table.innerHTML = `
                        <thead>
                            <tr><th>Product</th><th>Price</th><th>Quantity</th><th>Status</th></tr>
                        </thead>
                        <tbody></tbody>
                    `;
                    const body = table.querySelector('tbody');
                    (section.items || []).forEach(item => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${item.name}</td>
                            <td>Php ${Number(item.price).toFixed(2)}</td>
                            <td>${item.allow_quantity ? 'Enabled' : 'Disabled'}</td>
                            <td>${item.is_available ? 'Available' : 'Unavailable'}</td>
                        `;
                        body.appendChild(row);
                    });
                    tableContainer.appendChild(table);
                });
            })
            .catch(error => {
                tableContainer.textContent = `Unable to load menu. ${error.message}`;
                console.error(error);
            });
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
