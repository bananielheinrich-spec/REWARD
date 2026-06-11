const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Speicher für offene Claims, die auf Abholung warten
const pendingClaims = {};

// Speicher für den Zeitstempel des letzten erfolgreichen Claims (Username: Zeit in ms)
const cooldowns = {};

const COOLDOWN_TIME = 24 * 60 * 60 * 1000; // 24 Stunden in Millisekunden

// 🔐 Endpunkt 1: Website registriert den Claim
app.post("/create-claim", (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.json({ success: false, error: "Kein Username angegeben." });
    }

    const cleanName = username.trim().toLowerCase();
    const now = Date.now();

    -- Prüfen, ob der Spieler noch Cooldown hat
    if (cooldowns[cleanName]) {
        const timePassed = now - cooldowns[cleanName];
        if (timePassed < COOLDOWN_TIME) {
            const timeLeft = COOLDOWN_TIME - timePassed;
            const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
            return res.json({ 
                success: false, 
                error: `Du hast deine Belohnung heute schon abgeholt! Warte noch ${hoursLeft} Stunden.` 
            });
        }
    }
    
    // Claim registrieren & Cooldown-Zeitstempel vorübergehend setzen
    pendingClaims[cleanName] = true;
    cooldowns[cleanName] = now; 

    console.log(`[Website] Claim für ${username} registriert. (24h Cooldown gestartet)`);
    res.json({ success: true });
});

// 🎮 Endpunkt 2: Roblox prüft EINZELNE Spieler (Beim Joinen)
app.get("/auto-validate/:username", (req, res) => {
    const username = req.params.username;
    const cleanName = username.trim().toLowerCase();

    if (pendingClaims[cleanName]) {
        delete pendingClaims[cleanName];
        console.log(`[Roblox - Join] Claim für ${username} eingelöst.`);
        return res.json({ valid: true, reward: 1000 });
    }

    res.json({ valid: false });
});

// 🎮 Endpunkt 3: Roblox prüft LIVE-Spieler (Alle 5 Sekunden)
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
            delete pendingClaims[cleanName];
        }
    });

    res.json({ rewards: rewardsToSend });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
