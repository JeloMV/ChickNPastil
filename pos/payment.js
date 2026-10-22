const order = JSON.parse(sessionStorage.getItem('pendingOrder') || 'null');
const form = document.getElementById('payment-form');
const totalElement = document.getElementById('payment-order-total');
const errorElement = document.getElementById('payment-error');

if (!order || !Array.isArray(order.items) || !order.total) {
    errorElement.textContent = 'No pending order found.';
    form.querySelector('button').disabled = true;
} else {
    totalElement.textContent = `Total Amount: Php ${Number(order.total).toFixed(2)}`;
    document.getElementById('amountPaid').value = Number(order.total).toFixed(2);
}

form.addEventListener('submit', event => {
    event.preventDefault();
    const amountPaid = Number(document.getElementById('amountPaid').value);
    if (!order || amountPaid < Number(order.total)) {
        errorElement.textContent = 'Payment amount cannot be less than the total.';
        return;
    }

    fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            customerName: order.customerName,
            contactNumber: order.contactNumber,
            orderType: order.orderType,
            notes: order.notes,
            items: order.items,
            payment: {
                method: new FormData(form).get('paymentMethod'),
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
            window.location.href = `receipt.html?orderId=${result.orderId}&paymentId=${result.paymentId}`;
        })
        .catch(error => {
            errorElement.textContent = error.message;
            console.error(error);
        });
});
