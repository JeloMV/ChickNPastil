const express = require('express')
const path = require("path")

const app = express()
const PORT = 3000;


app.get("/", (req, res) => {
    const role = "staff";

    if(role === "staff"){
        return res.redirect("/staff/dashboard.html");
    }

    if (role === "manger") {
        return res.redirect("/manager/dashboard.html");
    }
    return res.redirect("/login");

});

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});