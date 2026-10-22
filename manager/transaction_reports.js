const transactionBody = document.getElementById('transaction-table-body');
const searchInput = document.querySelector('.search-input');
const exportButton = document.querySelector('.btn-export-report');
let transactions = [];

function formatDate(value) {
    if (!value) return '-';
    return new Date(value).toLocaleString();
}

function renderTransactions(records) {
    transactionBody.replaceChildren();

    if (records.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="8">No transactions found.</td>';
        transactionBody.appendChild(row);
        return;
    }

    records.forEach(transaction => {
        const row = document.createElement('tr');
        const values = [
            transaction.payment_id || '-',
            transaction.cust_name || 'Walk-in Customer',
            `Php ${Number(transaction.order_total || 0).toFixed(2)}`,
            transaction.contact_number || '-',
            transaction.order_status || '-',
            transaction.notes || '-',
            formatDate(transaction.order_datetime)
        ];

        values.forEach((value, index) => {
            const cell = document.createElement('td');
            if (index === 4) {
                const status = document.createElement('span');
                status.className = `badge-status badge-status-${String(value).toLowerCase()}`;
                status.textContent = value;
                cell.appendChild(status);
            } else {
                cell.textContent = value;
            }
            row.appendChild(cell);
        });

        const actionCell = document.createElement('td');
        const detailsButton = document.createElement('button');
        detailsButton.type = 'button';
        detailsButton.className = 'btn-details';
        detailsButton.textContent = 'Details';
        actionCell.appendChild(detailsButton);
        row.appendChild(actionCell);
        transactionBody.appendChild(row);
    });
}

function exportCsv() {
    const headers = ['Payment ID', 'Customer Name', 'Order Amount', 'Contact No.', 'Status', 'Notes', 'Date and Time'];
    const rows = transactions.map(transaction => [
        transaction.payment_id || '',
        transaction.cust_name || 'Walk-in Customer',
        Number(transaction.order_total || 0).toFixed(2),
        transaction.contact_number || '',
        transaction.order_status || '',
        transaction.notes || '',
        formatDate(transaction.order_datetime)
    ]);
    const csv = [headers, ...rows]
        .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
        .join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

if (exportButton) {
    exportButton.addEventListener('click', () => {
        if (transactions.length === 0) {
            window.alert('There are no transactions to export.');
            return;
        }
        exportCsv();
    });
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
        transactionBody.innerHTML =
            `<tr><td colspan="8">Unable to load transactions. ${error.message}</td></tr>`;
        console.error(error);
    });

searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const filtered = transactions.filter(transaction =>
        Object.values(transaction).some(value =>
            String(value || '').toLowerCase().includes(searchTerm)
        )
    );
    renderTransactions(filtered);
});
