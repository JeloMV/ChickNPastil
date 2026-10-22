const params = new URLSearchParams(window.location.search);
const orderId = params.get('orderId');
const paymentId = params.get('paymentId');
const details = document.getElementById('receipt-details');

details.innerHTML = `
    <p><strong>Order No.:</strong> ${orderId || '-'}</p>
    <p><strong>Payment ID:</strong> ${paymentId || '-'}</p>
    <p>Keep this page open to print or save the receipt as a PDF.</p>
`;

document.getElementById('print-receipt').addEventListener('click', () => {
    window.print();
});
