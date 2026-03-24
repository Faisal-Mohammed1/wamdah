const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt'); // <-- Added bcrypt for security
require('dotenv').config();

const app = express();

// Middleware
app.use(cors()); // Allow frontend to communicate with backend
app.use(express.json()); // Allow server to parse JSON data from forms

// MySQL Database Connection Pool
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'club_ticketing',
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
app.post('/api/register', async (req, res) => { // <-- Added async here
  // Extract data sent from the React frontend (Now includes password)
  const { fullName, memberId, email, phone, password } = req.body;

  try {
    // 1. Secure the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 2. MySQL query to insert the new member with the hashed password
    const query = 'INSERT INTO users (full_name, national_id, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)';

    db.query(query, [fullName, memberId, email, phone, hashedPassword], (err, result) => {
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
  } catch (error) {
    console.error("Password encryption error:", error);
    res.status(500).json({ message: 'حدث خطأ أثناء تأمين البيانات.' });
  }
});

// Update Member Status (API Route)
app.post('/api/update_member_status', (req, res) => {
    const { id, status } = req.body;

    if (!id || !status) {
        return res.status(400).json({ message: "Incomplete data provided." });
    }

    // Update status in the 'users' table
    const query = 'UPDATE users SET status = ? WHERE id = ?';
    
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
    // Fetch from 'users' where status is lowercase 'pending'
    const query = "SELECT id, full_name as name, national_id, email FROM users WHERE status = 'pending'";
    
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
    // We now extract nationalId and password from the frontend request
    const { nationalId, password } = req.body;

    if (!nationalId || !password) {
        return res.status(400).json({ message: 'الرجاء إدخال رقم الهوية وكلمة المرور.' });
    }

    // Find the user by National ID
    const query = 'SELECT * FROM users WHERE national_id = ?';

    db.query(query, [nationalId], async (err, results) => { // <-- Added async here
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ message: 'حدث خطأ في الخادم.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'بيانات الدخول غير صحيحة.' });
        }

        const user = results[0];

        try {
            // Check if the typed password matches the encrypted one in the DB
            const isMatch = await bcrypt.compare(password, user.password_hash);
            
            if (!isMatch) {
                return res.status(401).json({ message: 'بيانات الدخول غير صحيحة.' });
            }

            // Check the user's approval status
            if (user.status === 'pending') {
                return res.status(403).json({ message: 'حسابك قيد المراجعة من قبل الإدارة.' });
            } else if (user.status === 'rejected') {
                return res.status(403).json({ message: 'نعتذر، تم رفض طلب العضوية الخاص بك.' });
            }

            // Success! Send back the user data
            res.status(200).json({ 
                message: 'تم تسجيل الدخول بنجاح',
                user: {
                    id: user.id,
                    name: user.full_name,
                    email: user.email,
                    national_id: user.national_id,
                    status: user.status,
                    role: user.role
                }
            });
        } catch (error) {
            console.error("Password comparison error:", error);
            res.status(500).json({ message: 'حدث خطأ أثناء التحقق من البيانات.' });
        }
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});