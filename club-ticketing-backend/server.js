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
  // Extract data sent from the React frontend
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

// ==========================================
// EVENT & MATCH MANAGEMENT ROUTES
// ==========================================

// 1. Create a new event/match (For Admins)
app.post('/api/events', (req, res) => {
    const { title, description, event_date, venue, total_tickets } = req.body;

    // Basic validation
    if (!title || !event_date || !venue || !total_tickets) {
        return res.status(400).json({ message: 'الرجاء تعبئة جميع الحقول الأساسية.' });
    }

    // Insert into the events table. Notice we set available_tickets = total_tickets initially!
    const query = `
        INSERT INTO events (title, description, event_date, venue, total_tickets, available_tickets) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [title, description, event_date, venue, total_tickets, total_tickets], (err, result) => {
        if (err) {
            console.error('Error creating event:', err);
            return res.status(500).json({ message: 'حدث خطأ أثناء إضافة المباراة.' });
        }
        res.status(201).json({ message: 'تمت إضافة الفعالية بنجاح!' });
    });
});

// 2. Fetch all upcoming events (For Admins and Members)
app.get('/api/events', (req, res) => {

    const query = 'SELECT * FROM events ORDER BY event_date ASC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching events:', err);
            return res.status(500).json({ message: 'فشل في جلب بيانات المباريات.' });
        }
        res.status(200).json(results);
    });
});

const PORT = process.env.PORT || 5000;

// ==========================================
// TICKET BOOKING ROUTE
// ==========================================

app.post('/api/book_ticket', (req, res) => {
    const { user_id, event_id } = req.body;

    if (!user_id || !event_id) {
        return res.status(400).json({ message: 'بيانات الحجز غير مكتملة.' });
    }

    // 1. Check if the user already has a ticket for this specific event
    const checkTicketQuery = 'SELECT * FROM tickets WHERE user_id = ? AND event_id = ?';
    db.query(checkTicketQuery, [user_id, event_id], (err, ticketResults) => {
        if (err) return res.status(500).json({ message: 'حدث خطأ أثناء التحقق من التذاكر.' });
        
        if (ticketResults.length > 0) {
            return res.status(400).json({ message: 'لقد قمت بحجز تذكرة لهذه المباراة مسبقاً.' });
        }

        // 2. Check if the event exists and has available tickets
        const checkEventQuery = 'SELECT available_tickets FROM events WHERE id = ?';
        db.query(checkEventQuery, [event_id], (err, eventResults) => {
            if (err) return res.status(500).json({ message: 'حدث خطأ أثناء التحقق من المباراة.' });
            if (eventResults.length === 0) return res.status(404).json({ message: 'المباراة غير موجودة.' });
            
            const available = eventResults[0].available_tickets;
            if (available <= 0) {
                return res.status(400).json({ message: 'عذراً، لقد نفدت جميع تذاكر هذه المباراة.' });
            }

            // 3. Generate a unique "QR Code" string for the ticket
            const qrCodeString = `WAMD-${user_id}-${event_id}-${Date.now()}`;

            // 4. Insert the new ticket into the database
            const insertTicketQuery = 'INSERT INTO tickets (user_id, event_id, qr_code) VALUES (?, ?, ?)';
            db.query(insertTicketQuery, [user_id, event_id, qrCodeString], (err, insertResult) => {
                if (err) return res.status(500).json({ message: 'فشل في إصدار التذكرة.' });

                // 5. Decrement the available_tickets count in the events table by 1
                const updateEventQuery = 'UPDATE events SET available_tickets = available_tickets - 1 WHERE id = ?';
                db.query(updateEventQuery, [event_id], (err, updateResult) => {
                    if (err) console.error('Failed to update ticket count:', err);
                    
                    // Send success!
                    res.status(201).json({ message: 'تم حجز التذكرة بنجاح!', qr_code: qrCodeString });
                });
            });
        });
    });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});