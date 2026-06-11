const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Speicher für offene Claims (Username: true)
const pendingClaims = {};

// 🔐 Endpunkt 1: Website registriert den Claim (Egal ob User online oder offline ist)
app.post("/create-claim", (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.json({ success: false, error: "Kein Username angegeben." });
    }

    const cleanName = username.trim().toLowerCase();
    
    // Claim speichern
    pendingClaims[cleanName] = true;

    console.log(`[Website] Claim für ${username} registriert.`);
    res.json({ success: true });
});

// 🎮 Endpunkt 2: Roblox prüft EINZELNE Spieler (Beim Joinen)
app.get("/auto-validate/:username", (req, res) => {
    const username = req.params.username;
    const cleanName = username.trim().toLowerCase();

    if (pendingClaims[cleanName]) {
        delete pendingClaims[cleanName]; // Sofort löschen nach Erhalt
        console.log(`[Roblox - Join] Claim für ${username} eingelöst.`);
        return res.json({ valid: true, reward: 1000 });
    }

    res.json({ valid: false });
});

// 🎮 Endpunkt 3: Roblox prüft LIVE-Spieler (Alle 5 Sekunden im Hintergrund)
app.post("/fetch-live-claims", (req, res) => {
    const { players } = req.body;

    if (!players || !Array.isArray(players)) {
        return res.json({ rewards: [] });
    }

    const rewardsToSend = [];

    players.forEach(username => {
        const cleanName = username.trim().toLowerCase();

        if (pendingClaims[cleanName]) {
            rewardsToSend.push(username);
            delete pendingClaims[cleanName]; // Sofort löschen nach Erhalt
        }
    });

    res.json({ rewards: rewardsToSend });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
