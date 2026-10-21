require('dotenv').config();

const express = require('express')
const path = require("path")
const db = require('./includes/db');

const app = express()
const PORT = 3000;

app.use(express.static(path.resolve(__dirname)));

app.get("/api/menu", (req, res) => {
    res.sendFile(path.resolve(__dirname, "data", "menu.json"));
});

app.get("/", (req, res) => {
    const role = "manager";

    if(role === "staff"){
        return res.redirect("/staff/dashboard.html");
    }

    if (role === "manager") {
        return res.redirect("/manager/dashboard.html");
    }
    return res.redirect("/login");

});

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});

// GET /api/menu - returns sections with nested products
app.get('/api/menu', (req, res) => {
    const query = `
        SELECT s.section_id, s.section_name, 
               p.product_id, p.product_name, p.price, p.is_available
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
                    id: row.product_id,
                    name: row.product_name,
                    price: row.price
                });
            }
        });

        res.json(Object.values(sectionsMap));
    });
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