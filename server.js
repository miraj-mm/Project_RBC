const express = require("express");
const session = require('express-session');
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt        = require("jsonwebtoken");


const app = express();
app.use(cors());
app.use(bodyParser.json());


//jwt config
const JWT_SECRET       = '3db8de4da2b0c740389a7ac549b6719487157bc3689b7bb5ff127d4cfd9bc653de47d708da66994bff640df4ff13a0354a19e40aa30b42315090045570f7f4e37';
const TOKEN_EXPIRES_IN = '1h';

// MySQL Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Mueed16449",
    database: "rbc",
    multipleStatements: true
});


// ────────────────────────────────────────────────────────────
// After your db.connect callback, add:

function ensureDatabaseObjects() {
  const ddl = `
    -- 1) Stored procedure for inserting a new request
    DROP PROCEDURE IF EXISTS register_request;
    CREATE PROCEDURE register_request(
      IN p_blood_group VARCHAR(10),
      IN p_requester_name VARCHAR(255),
      IN p_requester_contact VARCHAR(50),
      IN p_district VARCHAR(100),
      IN p_police_station VARCHAR(100),
      IN p_reason TEXT
    )
    BEGIN
      INSERT INTO requests
        (blood_group, requester_name, requester_contact,
         district, police_station, reason, request_date)
      VALUES
        (p_blood_group, p_requester_name, p_requester_contact,
         p_district, p_police_station, p_reason, NOW());
    END;

    -- 2) Trigger to update donor totals after history insertion
    DROP TRIGGER IF EXISTS trg_after_history_insert;
    CREATE TRIGGER trg_after_history_insert
    AFTER INSERT ON history
    FOR EACH ROW
    BEGIN
      UPDATE donors
      SET
        total_donations    = total_donations + 1,
        last_donation_date = NEW.accept_date
      WHERE id = NEW.donor_id;
    END;

    -- 3) View to summarize pending requests with ROLLUP
    DROP VIEW IF EXISTS request_summary;
    CREATE VIEW request_summary AS
      SELECT
        blood_group,
        district,
        COUNT(*) AS request_count
      FROM requests
      GROUP BY blood_group, district WITH ROLLUP;
  `;

  db.query(ddl, (err) => {
    if (err) {
      console.error("❌ Error creating procedures/triggers/views:", err);
      process.exit(1);
    }
    console.log("✅ Procedures, trigger, and view are set up.");
  });
}

// Then, after connecting:
db.connect(err => {
  if (err) throw err;
  console.log("Connected to MySQL database.");
  ensureDatabaseObjects();  // ← run DDL setup at startup
});




// app.use("/");


function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'] || '';
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Missing or malformed token' });
    }
    jwt.verify(token, JWT_SECRET, (err, payload) => {
      if (err) return res.status(403).json({ message: 'Invalid or expired token' });
      req.user = payload;  // { sub: userId, username, iat, exp }
      next();
    });
  }


// API to Register Donor
app.post("/register", async (req, res) => {
    const { full_name, blood_group, district, police_station, contact_number, email, health_issues, preferred_areas, username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    const query = `
        INSERT INTO donors (full_name, blood_group, district, police_station, contact_number, email, health_issues, preferred_areas, username, password) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [full_name, blood_group, district, police_station, contact_number, email, health_issues, preferred_areas, username, hashedPassword], (err, result) => {
        if (err) {
            res.status(500).send("Error registering donor.");
        } else {
            res.status(201).send("Donor registered successfully.");
        }
    });
});

// API to Search Donors
app.post("/search", (req, res) => {
    const { blood_group } = req.body;

    const query = `SELECT * FROM donors WHERE blood_group = ?`;
    db.query(query, [blood_group], (err, results) => {
        if (err) {
            res.status(500).send("Error fetching donors.");
        } else {
            res.status(200).json(results);
        }
    });
});

// API to Login Donor
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const q = `SELECT * FROM donors WHERE username = ?`;
    db.query(q, [username], async (err, results) => {
      if (err) return res.status(500).json({ message: "Error during login." });
      if (results.length === 0) return res.status(404).json({ message: "User not found." });
  
      const user = results[0];
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: "Invalid credentials." });
  
      const token = jwt.sign(
        { sub: user.id, username: user.username, bloodGroup: user.blood_group },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRES_IN }
      );
      res.json({
        token,
        full_name: user.full_name,
        username:  user.username,
        message:   "Login successful"
      });
    });
  });
  


app.post("/api/fetch-profile",authenticateToken,(req, res) => {
      const username = req.user.username;
      const q = `
        SELECT full_name, email, contact_number, blood_group, preferred_areas
        FROM donors
        WHERE username = ?
      `;
      db.query(q, [username], (err, results) => {
        if (err) {
          console.error("Error fetching profile:", err);
          return res.status(500).json({ error: "Database error." });
        }
        if (results.length === 0) {
          return res.status(404).json({ error: "User not found." });
        }
        res.json(results[0]);
      });
    }
  );


// API to update profile data
app.put( "/api/update-profile",authenticateToken,(req, res) => {
      const username = req.user.username;
      const { full_name, email, contact_number, blood_group, preferred_areas } = req.body;
  
      const q = `
        UPDATE donors
        SET full_name = ?, email = ?, contact_number = ?, blood_group = ?, preferred_areas = ?
        WHERE username = ?
      `;
      const vals = [full_name, email, contact_number, blood_group, preferred_areas, username];
      db.query(q, vals, (err, result) => {
        if (err) {
          console.error("Error updating profile:", err);
          return res.status(500).json({ error: "Database error." });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "User not found or no changes." });
        }
        res.json({ message: "Profile updated successfully!" });
      });
    }
  );


app.get('/getRequests', (req, res) => {
    const query = 'SELECT * FROM requests';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching requests:', err);
            res.status(500).json({ message: 'Database error occurred' });
        } else {
            res.status(200).json(results);
        }
    });
});




app.post("/request-blood", (req, res) => {
    const { bloodGroup, requesterName, requesterContact, district, policeStation, reason } = req.body;

    db.query(
      "CALL register_request(?, ?, ?, ?, ?, ?);",
      [bloodGroup, requesterName, requesterContact, district, policeStation, reason],
      (err) => {
        if (err) {
          console.error('Error submitting blood request:', err);
          return res.status(500).json({ message: "Error submitting blood request." });
        }
        res.status(201).json({ message: "Blood request submitted successfully!" });
      }
    );
});





app.get("/dashboard/blood-requests", authenticateToken, (req, res) => {
  const userBloodGroup = req.user.bloodGroup;

  const q = `SELECT r.id, r.requester_name, r.blood_group, r.request_date 
             FROM requests r
             WHERE r.blood_group = ?`;

  db.query(q, [userBloodGroup], (err, results) => {
    if (err) {
      console.error("Error fetching blood requests:", err);
      return res.status(500).send("Error fetching blood requests.");
    }
    res.json(results);
  });
});

// Accept a blood request
app.post("/accept-request", authenticateToken, (req, res) => {
  const { requestId } = req.body;
  const donorId = req.user.sub; // Get donor ID from token

  // 1. Find the request first
  const findQuery = `SELECT * FROM requests WHERE id = ?`;
  db.query(findQuery, [requestId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: "Request not found." });
    }

    const request = results[0];

    // 2. Insert into history
    const insertQuery = `
      INSERT INTO history (donor_id, requester_name, blood_group, request_date)
      VALUES (?, ?, ?, ?)
    `;
    db.query(insertQuery, [donorId, request.requester_name, request.blood_group, request.request_date], (err2) => {
      if (err2) {
        console.error("Error inserting into history:", err2);
        return res.status(500).json({ message: "Failed to insert into history." });
      }

      // 3. Delete from requests
      const deleteQuery = `DELETE FROM requests WHERE id = ?`;
      db.query(deleteQuery, [requestId], (err3) => {
        if (err3) {
          console.error("Error deleting request:", err3);
          return res.status(500).json({ message: "Failed to delete request." });
        }

        res.json({ message: "Request accepted successfully!" });
      });
    });
  });
});



// Accept a blood request
app.post("/accept-request", authenticateToken, (req, res) => {
  const { requestId } = req.body;
  const donorId = req.user.sub; // Get donor ID from token

  // 1. Find the request first
  const findQuery = `SELECT * FROM requests WHERE id = ?`;
  db.query(findQuery, [requestId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: "Request not found." });
    }

    const request = results[0];

    // 2. Insert into history
    const insertQuery = `
      INSERT INTO history (donor_id, requester_name, blood_group, request_date, accept_date)
      VALUES (?, ?, ?, ?, NOW())
    `;
    db.query(insertQuery, [donorId, request.requester_name, request.blood_group, request.request_date], (err2) => {
      if (err2) {
        console.error("Error inserting into history:", err2);
        return res.status(500).json({ message: "Failed to insert into history." });
      }

      // 3. Update donor's last donation date and total donations
      const updateDonorQuery = `
        UPDATE donors
        SET 
          last_donation_date = CURRENT_DATE,
          total_donations = total_donations + 1
        WHERE id = ?
      `;
      db.query(updateDonorQuery, [donorId], (err3) => {
        if (err3) {
          console.error("Error updating donor:", err3);
          return res.status(500).json({ message: "Failed to update donor." });
        }

        // 4. Delete from requests
        const deleteQuery = `DELETE FROM requests WHERE id = ?`;
        db.query(deleteQuery, [requestId], (err4) => {
          if (err4) {
            console.error("Error deleting request:", err4);
            return res.status(500).json({ message: "Failed to delete request." });
          }

          res.json({ message: "Request accepted and donor updated successfully!" });
        });
      });
    });
  });
});

// Fetch dashboard counts
// Inside your dashboard counts route


app.get("/dashboard/counts", authenticateToken, (req, res) => {
  const donorId = req.user.sub;
  const { bloodGroup } = req.user;

  const query1 = `SELECT COUNT(*) AS totalDonations, MAX(accept_date) AS lastDonation FROM history WHERE donor_id = ?`;
  const query2 = `SELECT COUNT(*) AS pendingRequests FROM requests`;

  db.query(query1, [donorId], (err1, result1) => {
    if (err1) return res.status(500).json({ error: "Failed to fetch history counts" });

  db.query(query2, (err2, result2) => {
      console.log('✅ Query executed for pending requests');

      res.json({
        totalDonations: result1[0].totalDonations,
        lastDonation: result1[0].lastDonation,
        pendingRequests: result2[0].pendingRequests
      });
    });
  });
});


app.get("/getRequestsSummary", (req, res) => {
  const sql = `
    SELECT
      IFNULL(blood_group, 'All Groups')  AS blood_group,
      IFNULL(district,    'All Districts') AS district,
      COUNT(*)          AS request_count
    FROM requests
    GROUP BY blood_group, district WITH ROLLUP
  `;
  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Error fetching summary:", err);
      return res.status(500).json({ message: "Could not fetch summary." });
    }
    res.json(rows);
  });
});



app.get("/donation-history", authenticateToken, (req, res) => {
  const donorId = req.user.sub; // Get donor ID from token
  
  // Query to get donation history for the logged-in donor
  const query = `
    SELECT accept_date, requester_name, blood_group
    FROM history
    WHERE donor_id = ?
    ORDER BY accept_date DESC;
  `;
  
  db.query(query, [donorId], (err, results) => {
    if (err) {
      console.error("Error fetching donation history:", err);
      return res.status(500).json({ message: "Failed to fetch donation history." });
    }
    
    res.json(results); // Send donation history data
  });
});



// API Endpoint: Submit Blood Request
app.post('/submitRequest', (req, res) => {
    const { bloodGroup, requesterName, requesterContact, district, policeStation, reason } = req.body;

    if (!bloodGroup || !requesterName || !requesterContact || !district || !policeStation || !reason) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // const query = `
    //     INSERT INTO requests (blood_group, requester_name, requester_contact, district, police_station, reason, request_date)
    //     VALUES (?, ?, ?, ?, ?, ?, NOW())
    // `;

    const query = `
        INSERT INTO guest_user (bloodGroup, requesterName, requesterContact, district, policeStation, reason, request_date)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    


    db.query(query, [bloodGroup, requesterName, requesterContact, district, policeStation, reason], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error occurred' });
        }
        res.json({ success: true, message: 'Request submitted successfully!' });
    });
});


// Handle invalid routes
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// API for Guest Login
app.get("/guest-login", (req, res) => {
    const { requestId, password } = req.query;

    const query = `SELECT r.*, d.full_name AS donorName FROM requests r 
                   LEFT JOIN donors d ON r.donor_id = d.id 
                   WHERE r.id = ?`;

    db.query(query, [requestId], async (err, results) => {
        if (err) {
            res.status(500).json({ success: false, message: "Database error." });
        } else if (results.length === 0) {
            res.status(404).json({ success: false, message: "Request not found." });
        } else {
            const request = results[0];
            const isPasswordValid = await bcrypt.compare(password, request.password);

            if (isPasswordValid) {
                res.status(200).json({
                    success: true,
                    donorDetails: request.donorName || "No donor has accepted this request yet."
                });
            } else {
                res.status(401).json({ success: false, message: "Invalid password." });
            }
        }
    });
});


//summary
// ── in server.js, below your existing GET /getRequests ──




// Start the Server
app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
