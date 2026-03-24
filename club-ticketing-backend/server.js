const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors()); // Allow frontend to communicate with backend
app.use(express.json()); // Allow server to parse JSON data from forms

// MySQL Database Connection Pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test Database Connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Successfully connected to the MySQL database.');
    connection.release();
  }
});

// Basic Route to test the server
app.get('/', (req, res) => {
  res.send('Club Ticketing Backend API is running!');
});

// Register a new member (API Route)
app.post('/api/register', (req, res) => {
  // Extract data sent from the React frontend
  const { fullName, memberId, email, phone } = req.body;

  // MySQL query to insert the new member
  const query = 'INSERT INTO Member (fullName, nationalID, email, phone) VALUES (?, ?, ?, ?)';

  db.query(query, [fullName, memberId, email, phone], (err, result) => {
    if (err) {
      console.error('Database insertion error:', err);
      
      // If the email or ID is already in the database, send a specific error
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'رقم الهوية أو البريد الإلكتروني مسجل مسبقاً.' });
      }
      return res.status(500).json({ message: 'حدث خطأ في الخادم.' });
    }
    
    // Success response
    res.status(201).json({ message: 'تم تقديم الطلب بنجاح! بانتظار موافقة الإدارة.' });
  });
});

// Update Member Status (API Route)
app.post('/api/update_member_status', (req, res) => {
    const { id, status } = req.body;

    if (!id || !status) {
        return res.status(400).json({ message: "Incomplete data provided." });
    }

    // Changed 'members' to 'Member' to match your register route
    const query = 'UPDATE Member SET status = ? WHERE id = ?';
    
    db.query(query, [status, id], (err, result) => {
        if (err) {
            console.error("Database update failed:", err);
            return res.status(500).json({ message: "Database update failed." });
        }
        res.status(200).json({ message: "Status updated successfully." });
    });
});

// Fetch pending members (API Route)
app.get('/api/get_pending_members', (req, res) => {
    // We only want members where status is 'Pending'
    const query = "SELECT memberID as id, fullName as name, nationalID as national_id, email FROM Member WHERE status = 'Pending'";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching pending members:", err);
            return res.status(500).json({ message: "Failed to fetch pending members." });
        }
        res.status(200).json(results);
    });
});


// Member Login (API Route)
app.post('/api/login', (req, res) => {
    const { nationalId, email } = req.body;

    if (!nationalId || !email) {
        return res.status(400).json({ message: 'الرجاء إدخال رقم الهوية والبريد الإلكتروني.' });
    }

    const query = 'SELECT * FROM Member WHERE nationalID = ? AND email = ?';

    db.query(query, [nationalId, email], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ message: 'حدث خطأ في الخادم.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'بيانات الدخول غير صحيحة.' });
        }

        const user = results[0];

        // Check the user's approval status
        if (user.status === 'Pending') {
            return res.status(403).json({ message: 'حسابك قيد المراجعة من قبل الإدارة.' });
        } else if (user.status === 'rejected') {
            return res.status(403).json({ message: 'نعتذر، تم رفض طلب العضوية الخاص بك.' });
        }

        res.status(200).json({ 
            message: 'تم تسجيل الدخول بنجاح',
            user: {
                id: user.memberID,
                name: user.fullName,
                email: user.email,
                status: user.status
            }
        });
    });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});