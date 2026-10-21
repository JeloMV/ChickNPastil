document.addEventListener('DOMContentLoaded', () => {
    const sectionsContainer = document.getElementById('sectionsContainer');
    const sectionModal = document.getElementById('sectionModal');
    const productModal = document.getElementById('productModal');
    const editModal = document.getElementById('editModal');

    const btnOpenSectionModal = document.getElementById('btnOpenSectionModal');
    const sectionForm = document.getElementById('sectionForm');
    const productForm = document.getElementById('productForm');

    // 1. Fetch and Render Menu Sections and Tables
    function loadMenu() {
        fetch('/api/menu')
            .then(res => res.json())
            .then(menu => {
                const sections = menu.sections || menu;
                if (!sections || sections.length === 0) {
                    sectionsContainer.innerHTML = `
                        <div style="text-align: center; padding: 40px; background: white; border-radius: 10px;">
                            <p style="color: #666; font-size: 16px;">No sections created yet.</p>
                            <button onclick="document.getElementById('sectionModal').style.display='flex'" class="btn-main">+ Create First Section</button>
                        </div>
                    `;
                    return;
                }

                sectionsContainer.innerHTML = '';
                sections.forEach(sec => {
                    const block = document.createElement('div');
                    block.className = 'section-block';

                    let tableRows = '';
                    if (sec.items && sec.items.length > 0) {
                        sec.items.forEach(item => {
                            const qtyClass = item.allow_quantity ? 'enabled' : 'disabled';
                            const qtyText = item.allow_quantity ? 'Enabled' : 'Disabled';
                            const priceText = item.price > 0 ? `Php ${Number(item.price).toFixed(2)}` : 'None / 0.00';
                            const statusBadge = item.is_available
                                ? `<span class="badge-status badge-active">Available</span>`
                                : `<span class="badge-status badge-disabled">Disabled</span>`;
                            const imgThumb = item.image_url
                                ? `<img src="../${item.image_url}" class="item-thumb" onerror="this.src='../assets/logo.png'">`
                                : `<span style="color:#aaa; font-size:12px;">No Image</span>`;

                            tableRows += `
                                <tr>
                                    <td>${imgThumb}</td>
                                    <td><strong>${item.name}</strong> ${statusBadge}</td>
                                    <td>${priceText}</td>
                                    <td>
                                        <button class="btn-toggle ${qtyClass}" onclick="toggleQuantity(${item.product_id})">
                                            ${qtyText}
                                        </button>
                                    </td>
                                    <td>
                                        <button class="btn-modify" onclick='openEditModal(${JSON.stringify(item)})'>Modify</button>
                                    </td>
                                </tr>
                            `;
                        });
                    } else {
                        tableRows = `<tr><td colspan="5" style="color: #999; padding: 20px;">No items in this section yet. Click "+ Add Item" above.</td></tr>`;
                    }

                    block.innerHTML = `
                        <div class="section-header">
                            <div class="section-title">
                                <h3>Section Name: <u>${sec.name}</u></h3>
                                <button class="btn-action-small" onclick="renameSection(${sec.section_id}, '${sec.name}')">Rename</button>
                                <button class="btn-action-small" style="background:#dc3545;" onclick="deleteSection(${sec.section_id})">Delete Section</button>
                            </div>
                            <button class="btn-add-item" onclick="openAddProductModal(${sec.section_id}, '${sec.name}')">+ Add Item</button>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Item Name</th>
                                    <th>Value</th>
                                    <th>Qty Selector</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    `;
                    sectionsContainer.appendChild(block);
                });
            })
            .catch(err => {
                console.error(err);
                sectionsContainer.innerHTML = '<p style="color: red; text-align: center;">Error loading menu.</p>';
            });
    }

    // Initial Load
    loadMenu();

    // 2. Open Add Section Modal
    btnOpenSectionModal.addEventListener('click', () => {
        document.getElementById('newSectionName').value = '';
        sectionModal.style.display = 'flex';
    });

    // Handle Add Section Form Submit
    sectionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const sectionName = document.getElementById('newSectionName').value;

        fetch('/api/sections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ section_name: sectionName })
        })
        .then(res => res.json())
        .then(() => {
            closeModals();
            loadMenu();
        })
        .catch(err => alert('Failed to create section: ' + err.message));
    });

    // 3. Open Add Product Modal
    window.openAddProductModal = (sectionId, sectionName) => {
        document.getElementById('prodSectionId').value = sectionId;
        document.getElementById('productModalTitle').textContent = `Add Product to "${sectionName}"`;
        document.getElementById('prodName').value = '';
        document.getElementById('prodPrice').value = '0';
        document.getElementById('prodImageUrl').value = '';
        productModal.style.display = 'flex';
    };

    // Handle Add Product Submit
    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const sectionId = document.getElementById('prodSectionId').value;
        const name = document.getElementById('prodName').value;
        const price = document.getElementById('prodPrice').value;
        const allowQty = document.getElementById('prodAllowQty').value === "1";
        const imageUrl = document.getElementById('prodImageUrl').value;

        fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                section_id: sectionId,
                product_name: name,
                price: parseFloat(price) || 0,
                allow_quantity: allowQty,
                image_url: imageUrl
            })
        })
        .then(res => res.json())
        .then(() => {
            closeModals();
            loadMenu();
        })
        .catch(err => alert('Failed to add product: ' + err.message));
    });

    // 4. Quick Toggle Quantity Selector
    window.toggleQuantity = (productId) => {
        fetch(`/api/products/${productId}/toggle-qty`, { method: 'PATCH' })
            .then(res => res.json())
            .then(() => loadMenu());
    };

    // 5. Open Edit Modal
    window.openEditModal = (item) => {
        document.getElementById('editProdId').value = item.product_id;
        document.getElementById('editProdName').value = item.name;
        document.getElementById('editProdPrice').value = item.price;
        document.getElementById('editProdAllowQty').value = item.allow_quantity ? "1" : "0";
        document.getElementById('editProdAvailability').value = item.is_available ? "1" : "0";
        document.getElementById('editProdImageUrl').value = item.image_url || '';
        editModal.style.display = 'flex';
    };

    // Handle Save Edit
    document.getElementById('btnSaveEdit').addEventListener('click', () => {
        const prodId = document.getElementById('editProdId').value;
        const name = document.getElementById('editProdName').value;
        const price = document.getElementById('editProdPrice').value;
        const allowQty = document.getElementById('editProdAllowQty').value === "1";
        const isAvailable = document.getElementById('editProdAvailability').value === "1";
        const imageUrl = document.getElementById('editProdImageUrl').value;

        fetch(`/api/products/${prodId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_name: name,
                price: parseFloat(price) || 0,
                allow_quantity: allowQty,
                is_available: isAvailable,
                image_url: imageUrl
            })
        })
        .then(res => res.json())
        .then(() => {
            closeModals();
            loadMenu();
        });
    });

    // Handle Delete Product
    document.getElementById('btnDeleteProd').addEventListener('click', () => {
        const prodId = document.getElementById('editProdId').value;
        if (confirm('Are you sure you want to delete this product?')) {
            fetch(`/api/products/${prodId}`, { method: 'DELETE' })
                .then(res => res.json())
                .then(() => {
                    closeModals();
                    loadMenu();
                });
        }
    });

    // 6. Section Management (Rename & Delete)
    window.renameSection = (sectionId, currentName) => {
        const newName = prompt('Enter new section name:', currentName);
        if (newName && newName.trim()) {
            fetch(`/api/sections/${sectionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ section_name: newName.trim() })
            })
            .then(res => res.json())
            .then(() => loadMenu());
        }
    };

    window.deleteSection = (sectionId) => {
        if (confirm('Are you sure you want to delete this section and all items under it?')) {
            fetch(`/api/sections/${sectionId}`, { method: 'DELETE' })
                .then(res => res.json())
                .then(() => loadMenu());
        }
    };

    // Close all modals
    window.closeModals = () => {
        sectionModal.style.display = 'none';
        productModal.style.display = 'none';
        editModal.style.display = 'none';
    };
});
