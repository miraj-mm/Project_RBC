// const express = require('express');
// const bodyParser = require('body-parser');
// const mysql = require('mysql');
// const cors = require('cors');

// const app = express();

// app.use(bodyParser.json());
// app.use(cors());

// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'Mueed16449',
//     database: 'rbc'
// });

// db.connect((err) => {
//     if (err) {
//         console.error('Error connecting to the database:', err);
//         process.exit(1);
//     }
//     console.log('Connected to MySQL database');
// });

// app.post('/submitRequest', (req, res) => {
//     const { bloodGroup, requesterName, requesterContact, district, policeStation, reason } = req.body;

//     const query = `
//         INSERT INTO requests (blood_group, requester_name, requester_contact, district, police_station, reason, request_date)
//         VALUES (?, ?, ?, ?, ?, ?, NOW())
//     `;

//     db.query(query, [bloodGroup, requesterName, requesterContact, district, policeStation, reason], (err, result) => {
//         if (err) {
//             console.error('Database error:', err);
//             return res.status(500).json({ success: false, message: 'Database error occurred' });
//         }
//         res.json({ success: true, message: 'Request submitted successfully!' });
//     });
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });
