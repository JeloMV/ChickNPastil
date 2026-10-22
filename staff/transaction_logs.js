const list = document.getElementById('transaction-list');
const exportButton = document.getElementById('export-report');
let transactions = [];

function formatDate(value) {
    return value ? new Date(value).toLocaleString() : '-';
}

function renderTransactions(records) {
    list.replaceChildren();
    if (records.length === 0) {
        list.textContent = 'No transactions found.';
        return;
    }

    records.forEach(transaction => {
        const card = document.createElement('div');
        card.className = 'transaction-card';
        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-1">
                <strong class="transaction-id"></strong>
                <span class="badge-status"></span>
            </div>
            <div class="text-muted small"></div>
            <div class="d-flex justify-content-between align-items-center mt-2">
                <span class="fw-bold"></span>
            </div>
        `;
        card.querySelector('.transaction-id').textContent =
            `Payment #${transaction.payment_id || '-'} - ${transaction.cust_name || 'Walk-in Customer'}`;
        card.querySelector('.badge-status').textContent = transaction.order_status || '-';
        card.querySelector('.text-muted').textContent = formatDate(transaction.order_datetime);
        card.querySelector('.fw-bold').textContent =
            `Php ${Number(transaction.order_total || 0).toFixed(2)} - ${transaction.payment_method || '-'}`;
        list.appendChild(card);
    });
}

function exportCsv() {
    const headers = ['Payment ID', 'Customer Name', 'Amount', 'Payment Method', 'Status', 'Date'];
    const rows = transactions.map(transaction => [
        transaction.payment_id || '',
        transaction.cust_name || 'Walk-in Customer',
        Number(transaction.order_total || 0).toFixed(2),
        transaction.payment_method || '',
        transaction.order_status || '',
        formatDate(transaction.order_datetime)
    ]);
    const csv = [headers, ...rows]
        .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
        .join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

fetch('/api/transactions')
    .then(response => {
        if (!response.ok) throw new Error(`Transactions request failed: ${response.status}`);
        return response.json();
    })
    .then(data => {
        transactions = data;
        renderTransactions(transactions);
    })
    .catch(error => {
        list.textContent = `Unable to load transactions. ${error.message}`;
        console.error(error);
    });

exportButton.addEventListener('click', () => {
    if (transactions.length === 0) {
        window.alert('There are no transactions to export.');
        return;
    }
    exportCsv();
});
