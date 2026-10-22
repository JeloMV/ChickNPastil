const pendingOrder = JSON.parse(sessionStorage.getItem('pendingOrder') || 'null');
const form = document.getElementById('checkout-form');
const paymentForm = document.getElementById('payment-form');
const itemList = document.getElementById('checkout-items');
const totalElement = document.getElementById('checkout-total');
const paymentTotal = document.getElementById('payment-order-total');
const amountInput = document.getElementById('amountPaid');
const changeAmount = document.getElementById('change-amount');
const errorElement = document.getElementById('payment-error');
const transactionModal = document.getElementById('transaction-modal');
const receiptDetails = document.getElementById('receipt-details');
const printReceipt = document.getElementById('print-receipt');
const cancelTransaction = document.getElementById('cancel-transaction');
const newOrder = document.getElementById('new-order');

function formatId(value) {
    return String(value).padStart(5, '0');
}

if (!pendingOrder || !Array.isArray(pendingOrder.items) || pendingOrder.items.length === 0) {
    itemList.textContent = 'No order items found. Return to the ordering page.';
    paymentForm.querySelector('button[type="submit"]').disabled = true;
} else {
    let total = 0;
    pendingOrder.items.forEach(item => {
        total += Number(item.price) * Number(item.quantity);
        const row = document.createElement('div');
        row.className = 'summary-item';
        row.innerHTML = `
            <span class="summary-item-name"></span>
            <span class="summary-item-quantity">x${item.quantity}</span>
            <span class="summary-item-price">Php ${(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
        `;
        const optionText = item.options
            ? ` (${item.options.flavor}, ${item.options.rice})`
            : '';
        row.querySelector('.summary-item-name').textContent = `${item.name}${optionText}`;
        itemList.appendChild(row);
    });

    cancelTransaction.addEventListener('click', () => {
        sessionStorage.removeItem('pendingOrder');
        window.location.href = 'ordering.html';
    });

    newOrder.addEventListener('click', () => {
        window.location.href = 'ordering.html';
    });
    totalElement.textContent = `Php ${total.toFixed(2)}`;
    paymentTotal.textContent = `Total Amount: Php ${total.toFixed(2)}`;
    amountInput.value = total.toFixed(2);
    pendingOrder.total = total;
}

amountInput.addEventListener('input', () => {
    const amountPaid = Number(amountInput.value) || 0;
    const change = Math.max(0, amountPaid - Number(pendingOrder?.total || 0));
    changeAmount.textContent = `Php ${change.toFixed(2)}`;
});

paymentForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!pendingOrder) return;
    const orderDetails = new FormData(form);
    const amountPaid = Number(amountInput.value);
    if (amountPaid < Number(pendingOrder.total)) {
        errorElement.textContent = 'Payment amount cannot be less than the total.';
        return;
    }

    const submitButton = paymentForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    pendingOrder.customerName = document.getElementById('customerName').value.trim();
    pendingOrder.contactNumber = document.getElementById('contactNumber').value.trim();
    pendingOrder.orderType = orderDetails.get('orderType');
    pendingOrder.notes = document.getElementById('notes').value.trim();
    fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            customerName: pendingOrder.customerName,
            contactNumber: pendingOrder.contactNumber,
            orderType: pendingOrder.orderType,
            notes: pendingOrder.notes,
            items: pendingOrder.items,
            payment: {
                method: new FormData(paymentForm).get('paymentMethod'),
                amountPaid
            }
        })
    })
        .then(response => {
            if (!response.ok) throw new Error(`Order submission failed: ${response.status}`);
            return response.json();
        })
        .then(result => {
            sessionStorage.removeItem('pendingOrder');
            receiptDetails.innerHTML = `
                <p><strong>Order No.:</strong> ${formatId(result.orderId)}</p>
                <p><strong>Payment ID:</strong> ${formatId(result.paymentId)}</p>
                <p><strong>Status:</strong> ${result.paymentStatus || 'Pending'}</p>
                <p><strong>Change Amount:</strong> Php ${(amountPaid - Number(pendingOrder.total)).toFixed(2)}</p>
            `;
            transactionModal.hidden = false;
            printReceipt.onclick = () => window.print();
        })
        .catch(error => {
            submitButton.disabled = false;
            errorElement.textContent = error.message;
            console.error(error);
        });
});
