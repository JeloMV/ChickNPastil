require('dotenv').config();

const express = require('express')
const path = require("path")
const db = require('./includes/db');

const app = express()
const PORT = 3000;
const defaultRole = process.env.APP_ROLE || 'staff';

app.use(express.static(path.resolve(__dirname)));
app.use(express.json());

app.get("/assets/html/bars.html", (req, res) => {
    res.sendFile(path.join(__dirname, "assets", "shared", "bars.html"));
});

app.get("/assets/img/logo.png", (req, res) => {
    res.sendFile(path.join(__dirname, "assets", "logo.png"));
});

app.get("/user/session", (req, res) => {
    const role = defaultRole.toLowerCase();
    res.json({
        firstName: role === "manager" ? "Manager" : "Staff",
        lastName: "User",
        role,
        branchLocationName: "Main Branch"
    });
});

app.get("/", (req, res) => {
    const role = defaultRole.toLowerCase();

    if(role === "staff"){
        return res.redirect("/staff/dashboard.html");
    }

    if (role === "manager") {
        return res.redirect("/manager/dashboard.html");
    }
    return res.redirect("/login");

});

app.get("/manager", (req, res) => {
    res.redirect("/manager/dashboard.html");
});

app.get("/staff", (req, res) => {
    res.redirect("/staff/dashboard.html");
});

app.get("/staff/ordering.html", (req, res) => {
    res.redirect("/pos/ordering.html");
});

app.get("/pos/transaction_logs.html", (req, res) => {
    res.redirect("/staff/transaction_logs.html");
});

app.get("pos")

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});

// GET /api/menu - returns sections with nested products
app.get('/api/menu', (req, res) => {
    const query = `
        SELECT s.section_id, s.section_name, 
               p.product_id, p.product_name, p.description, p.price,
               p.is_available, p.image_url, p.allow_quantity
        FROM menu_section s
        LEFT JOIN menu_products p ON s.section_id = p.section_id
        WHERE s.is_available = TRUE AND (p.is_available = TRUE OR p.is_available IS NULL)
        ORDER BY s.section_id, p.product_id
    `;

    db.query(query, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // Group products under their respective section
        const sectionsMap = {};
        rows.forEach(row => {
            if (!sectionsMap[row.section_id]) {
                sectionsMap[row.section_id] = {
                    id: row.section_id,
                    name: row.section_name,
                    items: []
                };
            }
            if (row.product_id) {
                sectionsMap[row.section_id].items.push({
                    product_id: row.product_id,
                    name: row.product_name,
                    description: row.description,
                    price: row.price,
                    is_available: row.is_available,
                    image_url: row.image_url,
                    allow_quantity: row.allow_quantity
                });
            }
        });

        res.json(Object.values(sectionsMap).map(section => ({
            section_id: section.id,
            name: section.name,
            items: section.items
        })));
    });
});

app.get('/api/transactions', (req, res) => {
    const query = `
        SELECT
            p.payment_id,
            o.cust_name,
            o.order_total,
            o.contact_number,
            o.order_status,
            o.notes,
            o.order_datetime
        FROM orders o
        LEFT JOIN payments p ON p.order_id = o.order_id
        ORDER BY o.order_datetime DESC, o.order_id DESC
    `;

    db.query(query, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/sections', (req, res) => {
    const { section_name } = req.body;
    if (!section_name || !section_name.trim()) {
        return res.status(400).json({ error: 'Section name is required' });
    }

    db.query(
        'INSERT INTO menu_section (section_name) VALUES (?)',
        [section_name.trim()],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ section_id: result.insertId });
        }
    );
});

app.post('/api/products', (req, res) => {
    const { section_id, product_name, price, allow_quantity, image_url } = req.body;
    if (!section_id || !product_name || !product_name.trim()) {
        return res.status(400).json({ error: 'Section and product name are required' });
    }

    db.query(
        `INSERT INTO menu_products
            (section_id, product_name, price, allow_quantity, image_url)
         VALUES (?, ?, ?, ?, ?)`,
        [section_id, product_name.trim(), Number(price) || 0, allow_quantity !== false, image_url || null],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ product_id: result.insertId });
        }
    );
});

// 1. Update product details (Modify)
app.put('/api/products/:id', (req, res) => {
    const { product_name, price, is_available, allow_quantity, image_url } = req.body;
    db.query(
        `UPDATE menu_products 
         SET product_name = ?, price = ?, is_available = ?, allow_quantity = ?, image_url = ?
         WHERE product_id = ?`,
        [product_name, price, is_available, allow_quantity, image_url, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// 2. Toggle Quantity Selector quickly
app.patch('/api/products/:id/toggle-qty', (req, res) => {
    db.query(
        `UPDATE menu_products SET allow_quantity = NOT allow_quantity WHERE product_id = ?`,
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// // 3. Delete or disable section/product
// app.delete('/api/products/:id', (req, res) => {
//     db.query('DELETE FROM menu_products WHERE product_id = ?', [req.params.id], (err) => {
//         if (err) return res.status(500).json({ error: err.message });
//         res.json({ success: true });
//     });
// });