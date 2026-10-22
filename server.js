require('dotenv').config();

const express = require('express')
const path = require("path")
const db = require('./includes/db');

const app = express()
const PORT = 3000;
const defaultRole = process.env.APP_ROLE || 'staff';

const paymongoRoutes = require('./routes/paymongo');

app.use(express.static(path.resolve(__dirname)));
app.use(express.json());

app.use('/api/paymongo', paymongoRoutes);

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
    const includeUnavailable = req.query.manage === 'true';
    const query = `
        SELECT s.section_id, s.section_name, s.is_available AS section_available,
               p.product_id, p.product_name, p.description, p.price,
               p.is_available, p.image_url, p.allow_quantity
        FROM menu_section s
        LEFT JOIN menu_products p ON s.section_id = p.section_id
        WHERE (${includeUnavailable ? 's.is_available IN (TRUE, FALSE)' : 's.is_available = TRUE'})
          AND (${includeUnavailable ? 'p.is_available IN (TRUE, FALSE)' : '(p.is_available = TRUE OR p.is_available IS NULL)'})
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
                    is_available: row.section_available,
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
            is_available: section.is_available,
            items: section.items
        })));
    });
});

app.get('/api/transactions', (req, res) => {
    const query = `
        SELECT
            p.payment_id,
            p.payment_method,
            p.amount_paid,
            p.change_amount,
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

app.post('/api/orders', (req, res) => {
    const { customerName, contactNumber, orderType, notes, items, payment } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'At least one order item is required' });
    }

    const total = items.reduce((sum, item) => {
        return sum + (Number(item.price) * Number(item.quantity));
    }, 0);
    if (!items.every(item => item.productId && item.name && Number(item.quantity) > 0 && Number.isFinite(Number(item.price)))) {
        return res.status(400).json({ error: 'Invalid order item data' });
    }

    const paymentData = payment || {};
    const paymentMethod = paymentData.method === 'GCash' ? 'GCash' : 'Cash';
    const paymentStatus = paymentMethod === 'GCash' ? 'Pending' : 'Verified';
    const orderStatus = paymentMethod === 'GCash' ? 'Pending' : 'Completed';

    db.query(
        `INSERT INTO orders (cust_name, contact_number, order_status, order_total, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [
            customerName || 'Walk-in Customer',
            contactNumber || null,
            orderStatus,
            total,
            `${orderType || 'Takeout'}${notes ? ` - ${notes}` : ''}`
        ],
        (orderError, orderResult) => {
            if (orderError) return res.status(500).json({ error: orderError.message });

            const orderId = orderResult.insertId;
            const itemValues = items.map(item => [
                orderId,
                item.productId,
                item.options ? `${item.name} (${item.options.flavor}, ${item.options.rice})` : item.name,
                Number(item.price),
                Number(item.quantity),
                Number(item.price) * Number(item.quantity)
            ]);

            db.query(
                `INSERT INTO order_items
                    (order_id, product_id, item_name, unit_price, quantity, subtotal)
                 VALUES ?`,
                [itemValues],
                (itemsError) => {
                    if (itemsError) return res.status(500).json({ error: itemsError.message });

                    db.query(
                        `INSERT INTO payments
                            (order_id, payment_method, amount_due, amount_paid, change_amount, payment_status, paid_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            orderId,
                            paymentMethod,
                            total,
                            Number(paymentData.amountPaid) || total,
                            paymentMethod === 'Cash'
                                ? Math.max(0, (Number(paymentData.amountPaid) || total) - total)
                                : 0,
                            paymentStatus,
                            paymentMethod === 'Cash' ? new Date() : null
                        ],
                        (paymentError, paymentResult) => {
                            if (paymentError) return res.status(500).json({ error: paymentError.message });
                            res.status(201).json({
                                orderId,
                                paymentId: paymentResult.insertId,
                                total,
                                paymentStatus
                            });
                        }
                    );
                }
            );
        }
    );
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

app.put('/api/sections/:id', (req, res) => {
    const { section_name } = req.body;
    if (!section_name || !section_name.trim()) {
        return res.status(400).json({ error: 'Section name is required' });
    }

    db.query(
        'UPDATE menu_section SET section_name = ? WHERE section_id = ?',
        [section_name.trim(), req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Section not found' });
            }
            res.json({ success: true });
        }
    );
});

app.patch('/api/sections/:id/toggle-availability', (req, res) => {
    db.query(
        'UPDATE menu_section SET is_available = NOT is_available WHERE section_id = ?',
        [req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Section not found' });
            }
            res.json({ success: true });
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
    const { product_name, description, price, is_available, allow_quantity, image_url } = req.body;
    if (!product_name || !product_name.trim() || !Number.isFinite(Number(price))) {
        return res.status(400).json({ error: 'Product name and a valid price are required' });
    }

    db.query(
        `UPDATE menu_products 
         SET product_name = ?, description = ?, price = ?, is_available = ?, allow_quantity = ?, image_url = ?
         WHERE product_id = ?`,
        [
            product_name.trim(),
            description ? description.trim() : null,
            Number(price),
            is_available !== false,
            allow_quantity !== false,
            image_url || null,
            req.params.id
        ],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }
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

app.patch('/api/products/:id/toggle-availability', (req, res) => {
    db.query(
        `UPDATE menu_products SET is_available = NOT is_available WHERE product_id = ?`,
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