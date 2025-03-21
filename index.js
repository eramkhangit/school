require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const { getDistance } = require('geolib'); 

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: false }))

// MySQL connection configuration
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Connect to MySQL
db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL');
});

// Add School API (POST /addSchool)
app.post('/addSchool', (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  // Validate input
  if (!name || !address || !latitude || !longitude) {
    return res.status(400).json({ error: 'All fields (name, address, latitude, longitude) are required.' });
  }

  // Insert into the database
  const query = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
  db.query(query, [name, address, latitude, longitude], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error: ' + err });
    }
    return res.status(201).json({ message: 'School added successfully', id: result.insertId });
  });
});

// List Schools API (GET /listSchools)
app.get('/listSchools', (req, res) => {
  const { latitude, longitude } = req.query;

  // Validate input
  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and Longitude are required' });
  }

  // Fetch all schools from the database
  const query = 'SELECT * FROM schools';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error: ' + err });
    }

    // Sort schools by distance to the user's coordinates
    const sortedSchools = results.map(school => {
      const distance = getDistance(
        { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
        { latitude: school.latitude, longitude: school.longitude }
      );
      return { ...school, distance };
    }).sort((a, b) => a.distance - b.distance);  // Sort in ascending order of distance

    return res.json({ schools: sortedSchools });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
