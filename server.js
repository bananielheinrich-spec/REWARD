const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

// Speicher für die generierten Tokens (im RAM)
const claims = {};

// 🔐 Endpunkt 1: Website erstellt ein Token
app.post("/create-claim", (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.json({ success: false, error: "Kein Username übergeben" });
    }

    // Generiert ein sicheres, zufälliges Token
    const token = crypto.randomBytes(16).toString("hex");

    claims[token] = {
        username: username,
        used: false
    };

    res.json({
        success: true,
        token: token
    });
});

// 🎮 Endpunkt 2: Roblox prüft und entwertet das Token
app.get("/validate/:token", (req, res) => {
    const token = req.params.token;
    const data = claims[token];

    if (!data || data.used) {
        return res.json({ valid: false });
    }

    // Token als benutzt markieren, damit man es nicht 2x einlösen kann
    data.used = true;

    res.json({
        valid: true,
        username: data.username,
        reward: 1000
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    print(`Server läuft auf Port ${PORT}`);
});
