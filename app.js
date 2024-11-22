const express = require('express');
const mysql = require('mysql2');
const app = express();
const PORT = process.env.PORT || 3000;
const haversine = require('haversine-distance');

// Middleware to parse JSON
app.use(express.json());

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: 'nk123lamba', // Replace with your MySQL password
    database: 'school_data' // Replace with your database name
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// POST API to Add a New School
app.post('/addSchool', (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    // Validation
    if (!name || !address || !latitude || !longitude) {
        return res.status(400).json({
            error: 'All fields (name, address, latitude, longitude) are required.',
        });
    }

    if (typeof name !== 'string' || typeof address !== 'string') {
        return res.status(400).json({
            error: 'Name and address must be strings.',
        });
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({
            error: 'Latitude and longitude must be numbers.',
        });
    }

    // Insert into the database
    const query = `INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)`;
    db.query(query, [name, address, latitude, longitude], (err, results) => {
        if (err) {
            console.error('Error inserting into the database:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.status(201).json({
            message: 'School added successfully',
            data: {
                id: results.insertId,
                name,
                address,
                latitude,
                longitude,
            },
        });
    });
});

// List Schools API
app.get('/listSchools', (req, res) => {
    const { latitude, longitude } = req.query;

    // Validation
    if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: 'Latitude and longitude must be valid numbers.' });
    }

    // Fetch all schools from the database
    const query = 'SELECT * FROM schools';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching schools from the database:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        // Calculate distances and sort
        const userLocation = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
        const schoolsWithDistances = results.map((school) => {
            const schoolLocation = { latitude: school.latitude, longitude: school.longitude };
            const distance = haversine(userLocation, schoolLocation);
            return { ...school, distance }; // Add distance to the school data
        });

        // Sort schools by distance
        schoolsWithDistances.sort((a, b) => a.distance - b.distance);

        // Return the sorted list of schools
        res.status(200).json({
            message: 'Schools fetched successfully',
            data: schoolsWithDistances,
        });
    });
});



// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
