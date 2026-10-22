const mysql = require('mysql2');

const db = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'admin123',
    database: process.env.DB_NAME || 'db123',
    waitForConnections: true,
    connectionLimit: 10
});

db.query('SELECT 1', (err) => {
    if (err) {
        console.error('Unable to connect to MySQL:', err.message);
        return;
    }
    console.log('Connected (MySQL)');
});

module.exports=db;