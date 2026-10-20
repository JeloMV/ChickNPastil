const headerTitles = {
    'staff/dashboard.html': 'Live Sales Operations',
    'staff/ordering.html': 'Create Order',
    'staff/transaction_logs.html': 'Transaction Logs'
};

const headerScript = document.currentScript;
const headerUrl = headerScript
    ? new URL(headerScript.src)
    : new URL('../assets/header.js', window.location.href);
const headerPlaceholder = document.getElementById('header-placeholder');
const pagePath = window.location.pathname
    .split('/')
    .filter(Boolean)
    .slice(-2)
    .join('/');

if (!headerPlaceholder) {
    throw new Error('Header placeholder not found');
}

fetch(new URL('header.html', headerUrl))
    .then(response => {
        if (!response.ok) {
            throw new Error(`Header request failed: ${response.status}`);
        }
        return response.text();
    })
    .then(data => {
        headerPlaceholder.innerHTML = data;
        const pageHeaderTitle = headerPlaceholder.querySelector('#page-header-title');
        if (pageHeaderTitle) {
            pageHeaderTitle.textContent = headerTitles[pagePath] || document.title;
        }

        const logo = headerPlaceholder.querySelector('#logo');
        if (logo) {
            logo.src = new URL('logo.png', headerUrl);
        }
    })
    .catch(error => {
        headerPlaceholder.textContent = 'Unable to load header.';
        console.error(error);
    });