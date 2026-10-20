const express = require('express')
const path = require("path")

const app = express()
const PORT = 3000;

app.use(express.static(path.resolve(__dirname)));

app.get("/api/menu", (req, res) => {
    res.sendFile(path.resolve(__dirname, "data", "menu.json"));
});

app.get("/", (req, res) => {
    const role = "staff";

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