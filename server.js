const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 3000; // You can change the port if needed

// Enable CORS for your React Native app
app.use(cors());

// Connect to SQLite database
const db = new sqlite3.Database('liveries.db', (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    }
});

// Endpoint to get nearby planes (you will need to implement logic for 'nearby' based on user's location)
app.get('/api/nearby-planes', (req, res) => {
    // Example coordinates (latitude, longitude) - you will replace this with the user's actual location
    const userLatitude = req.query.lat;
    const userLongitude = req.query.lng;

    // SQL query to get planes based on user location - you need to implement the distance logic
    const query = `SELECT * FROM liveries WHERE ...`; // Add your distance logic here

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).send(err.message);
        } else {
            res.json(rows);
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
