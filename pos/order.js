const selectedItems = new Map();

function adjustItemQuantity(itemId, change) {
    const item = selectedItems.get(itemId);
    if (!item) {
        return;
    }

    item.quantity += change;
    if (item.quantity <= 0) {
        selectedItems.delete(itemId);
    }
    updateAllMenuQuantities();
    renderOrderSummary();
}

function removeOneItem(itemId) {
    const item = selectedItems.get(itemId);
    if (!item) {
        return;
    }

    if (item.quantity <= 1) {
        selectedItems.delete(itemId);
    } else {
        item.quantity -= 1;
    }
    updateAllMenuQuantities();
    renderOrderSummary();
}

function renderOrderSummary() {
    const summaryItems = document.getElementById('summary-items');
    const totalElement = document.getElementById('summary-total-amount');
    const completeButton = document.getElementById('complete-order');
    summaryItems.replaceChildren();

    let total = 0;
    selectedItems.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;

        const row = document.createElement('div');
        row.className = 'summary-item';
        const options = item.options
            ? `<small>${item.options.flavor} flavor, ${item.options.rice} rice</small>`
            : '';
        row.innerHTML = `
            <button type="button" class="remove-item" aria-label="Remove ${item.name}">×</button>
            <strong>${item.name}${options}</strong>
            <div class="quantity-stepper">
                <button type="button" class="quantity-minus" aria-label="Decrease quantity">−</button>
                <output>${item.quantity}</output>
                <button type="button" class="quantity-plus" aria-label="Increase quantity">+</button>
            </div>
        `;

        row.querySelector('.remove-item').addEventListener('click', () => {
            selectedItems.delete(item.id);
            updateAllMenuQuantities();
            renderOrderSummary();
        });

        row.querySelector('.quantity-minus').addEventListener('click', () => {
            adjustItemQuantity(item.id, -1);
        });

        row.querySelector('.quantity-plus').addEventListener('click', () => {
            adjustItemQuantity(item.id, 1);
        });

        summaryItems.appendChild(row);
    });

    if (selectedItems.size === 0) {
        summaryItems.innerHTML = '<p class="empty-summary">No items selected.</p>';
    }

    totalElement.textContent = `Php ${total.toFixed(2)}`;
    completeButton.disabled = selectedItems.size === 0;
}

function updateMenuQuantity(productId, quantity) {
    const card = document.querySelector(`[data-product-id="${productId}"]`);
    if (card) {
        const quantityInput = card.querySelector('.qty-input');
        if (quantityInput) {
            quantityInput.value = quantity;
        }
    }
}

function updateAllMenuQuantities() {
    document.querySelectorAll('[data-product-id]').forEach(card => {
        const productId = card.dataset.productId;
        const quantity = [...selectedItems.values()]
            .filter(item => String(item.productId || item.id) === String(productId))
            .reduce((total, item) => total + item.quantity, 0);
        updateMenuQuantity(productId, quantity);
    });
}

function updatePastilSelection(item, previousOptions, options) {
    const productId = item.product_id || item.id;
    const previousId = `${productId}-${previousOptions.flavor}-${previousOptions.rice}`;
    const nextId = `${productId}-${options.flavor}-${options.rice}`;
    if (previousId === nextId) {
        return;
    }

    removeOneItem(previousId);
    addItem(item, 1, options);
    updateAllMenuQuantities();
}

function updatePastilCardQuantity(productId) {
    const quantity = [...selectedItems.values()]
        .filter(item => String(item.productId) === String(productId))
        .reduce((total, item) => total + item.quantity, 0);
    updateMenuQuantity(productId, quantity);
}

function addItem(item, quantity = 1, options = null) {
    const id = item.product_id || item.id;
    const variantId = options
        ? `${id}-${options.flavor}-${options.rice}`
        : String(id);
    const existing = selectedItems.get(variantId);
    selectedItems.set(variantId, {
        id: variantId,
        productId: id,
        name: item.name,
        price: Number(item.price) || 0,
        quantity: existing ? existing.quantity + quantity : quantity,
        options
    });
    if (!options) {
        updateMenuQuantity(id, selectedItems.get(variantId).quantity);
    } else {
        updatePastilCardQuantity(id);
    }
    renderOrderSummary();
}

function renderMenu(sections) {
    const page = document.querySelector('.menu');
    page.replaceChildren();

    sections.forEach(section => {
        const sectionBlock = document.createElement('section');
        sectionBlock.className = 'menu-section';

        const title = document.createElement('h3');
        title.className = 'menu-section-title';
        title.textContent = section.name;
        sectionBlock.appendChild(title);

        const items = document.createElement('div');
        items.className = 'menu-section-items';
        sectionBlock.appendChild(items);

        const isPastilSection = section.name.toLowerCase() === 'pastil size';

        (section.items || []).forEach(item => {
            const card = document.createElement('div');
            card.className = 'ordering-item';
            card.dataset.productId = item.product_id || item.id;

            // Check if quantity selector is enabled or disabled from the manager settings
            const actionButton = isPastilSection
                ? `
                <button type="button" class="configure-pastil">Select size</button>
                <div class="pastil-options" hidden>
                    <label>
                        Flavor
                        <select class="pastil-flavor">
                            <option value="Original">Original</option>
                            <option value="Spicy">Spicy</option>
                        </select>
                    </label>
                    <label>
                        Rice
                        <select class="pastil-rice">
                            <option value="Original">Original</option>
                            <option value="Garlic">Garlic</option>
                        </select>
                    </label>
                    
                </div>
                <div class="qty-selector">
                    <span>Quantity</span>
                    <div class="quantity-stepper">
                        <button type="button" class="card-minus" aria-label="Decrease quantity">−</button>
                        <output class="qty-input">0</output>
                        <button type="button" class="card-plus" aria-label="Increase quantity">+</button>
                    </div>
                </div>
                `
                : `
                <div class="qty-selector">
                    <span>Quantity</span>
                    <div class="quantity-stepper">
                        <button type="button" class="card-minus" aria-label="Decrease quantity">−</button>
                        <output class="qty-input">0</output>
                        <button type="button" class="card-plus" aria-label="Increase quantity">+</button>
                    </div>
                </div>
                `;

            // Only display price if greater than 0
            const priceDisplay = item.price > 0 ? `<p>Php ${item.price}</p>` : '';
            const imageTag = item.image_url
                ? `<img src="../${item.image_url}" alt="${item.name}">`
                : '';

            card.innerHTML = `
                ${imageTag}
                <h3>${item.name}</h3>
                ${priceDisplay}
                ${actionButton}
            `;

            let activeOptions = null;
            let configureButton = null;
            card.addEventListener('click', event => {
                if (event.target.closest('.qty-selector, .pastil-options, .configure-pastil')) {
                    return;
                }

                if (isPastilSection) {
                    if (activeOptions) {
                        addItem(item, 1, activeOptions);
                    }
                } else {
                    addItem(item);
                }
            });

            if (isPastilSection) {
                configureButton = card.querySelector('.configure-pastil');
                const optionsPanel = card.querySelector('.pastil-options');
                const flavorSelect = card.querySelector('.pastil-flavor');
                const riceSelect = card.querySelector('.pastil-rice');

                configureButton.addEventListener('click', () => {
                    if (!activeOptions) {
                        activeOptions = {
                            flavor: flavorSelect.value,
                            rice: riceSelect.value
                        };
                        addItem(item, 1, activeOptions);
                    }
                    optionsPanel.hidden = false;
                    configureButton.hidden = true;
                });

                [flavorSelect, riceSelect].forEach(select => {
                    select.addEventListener('change', () => {
                        const nextOptions = {
                            flavor: flavorSelect.value,
                            rice: riceSelect.value
                        };
                        if (activeOptions) {
                            updatePastilSelection(item, activeOptions, nextOptions);
                        }
                        activeOptions = nextOptions;
                    });
                });

                // card.querySelector('.cancel-pastil').addEventListener('click', () => {
                //     optionsPanel.hidden = true;
                //     configureButton.hidden = false;
                // });
            }

            card.querySelector('.card-plus').addEventListener('click', () => {
                if (isPastilSection && !activeOptions) {
                    configureButton.click();
                } else {
                    addItem(item, 1, isPastilSection ? activeOptions : null);
                }
            });

            card.querySelector('.card-minus').addEventListener('click', () => {
                if (isPastilSection) {
                    const options = activeOptions || { flavor: 'Original', rice: 'Original' };
                    adjustItemQuantity(
                        `${item.product_id || item.id}-${options.flavor}-${options.rice}`,
                        -1
                    );
                } else {
                    adjustItemQuantity(String(item.product_id || item.id), -1);
                }
            });

            items.appendChild(card);
        });

        page.appendChild(sectionBlock);
    });
}

fetch('/api/menu')
    .then(response => {
        if (!response.ok) {
            throw new Error(`Menu request failed: ${response.status}`);
        }
        return response.json();
    })
    .then(menu => renderMenu(menu.sections || menu))
    .catch(error => {
        document.querySelector('.menu').textContent =
            `Unable to load menu. ${error.message}`;
        console.error(error);
    });

renderOrderSummary();
document.getElementById('complete-order').addEventListener('click', () => {
    if (selectedItems.size === 0) return;
    sessionStorage.setItem('pendingOrder', JSON.stringify({
        items: [...selectedItems.values()]
    }));
    window.location.href = 'checkout.html';
});

document.getElementById('proceed-to-payment').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/paymongo/create-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: 15000, referenceNumber: "POS-" + Date.now() }) // example ₱150.00
        });

        const data = await response.json();
        if (data.checkout_url) {
            window.location.href = data.checkout_url; // Redirects user to PayMongo GCash page
        } else {
            alert(data.error || 'Checkout failed');
        }
    } catch (err) {
        console.error(err);
    }
});
