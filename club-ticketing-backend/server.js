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
app.post('/api/register', async (req, res) => {
  const { fullName, memberId, email, phone, password } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const query = 'INSERT INTO users (full_name, national_id, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)';

    db.query(query, [fullName, memberId, email, phone, hashedPassword], (err, result) => {
      if (err) {
        console.error('Database insertion error:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'رقم الهوية أو البريد الإلكتروني مسجل مسبقاً.' });
        }
        return res.status(500).json({ message: 'حدث خطأ في الخادم.' });
      }
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

    const query = 'SELECT * FROM users WHERE national_id = ?';

    db.query(query, [nationalId], async (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ message: 'حدث خطأ في الخادم.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'بيانات الدخول غير صحيحة.' });
        }

        const user = results[0];

        try {
            const isMatch = await bcrypt.compare(password, user.password_hash);
            
            if (!isMatch) {
                return res.status(401).json({ message: 'بيانات الدخول غير صحيحة.' });
            }

            if (user.status === 'pending') {
                return res.status(403).json({ message: 'حسابك قيد المراجعة من قبل الإدارة.' });
            } else if (user.status === 'rejected') {
                return res.status(403).json({ message: 'نعتذر، تم رفض طلب العضوية الخاص بك.' });
            }

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

// 1. Create a new event/match (Updated with Image URL)
app.post('/api/events', (req, res) => {
    const { title, description, image_url, event_date, venue, total_tickets } = req.body;

    if (!title || !event_date || !venue || !total_tickets) {
        return res.status(400).json({ message: 'الرجاء تعبئة جميع الحقول الأساسية.' });
    }

    const query = `
        INSERT INTO events (title, description, image_url, event_date, venue, total_tickets, available_tickets) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [title, description, image_url, event_date, venue, total_tickets, total_tickets], (err, result) => {
        if (err) {
            console.error('Error creating event:', err);
            return res.status(500).json({ message: 'حدث خطأ أثناء إضافة المباراة.' });
        }
        res.status(201).json({ message: 'تمت إضافة الفعالية بنجاح!' });
    });
});

// Fetch all attendees for a specific event
app.get('/api/events/:id/attendees', (req, res) => {
    const eventId = req.params.id;
    
    const query = `
        SELECT t.qr_code, t.status as ticket_status, t.issued_at, 
               u.full_name, u.national_id, u.phone 
        FROM tickets t
        JOIN users u ON t.user_id = u.id
        WHERE t.event_id = ?
        ORDER BY t.issued_at DESC
    `;
    
    db.query(query, [eventId], (err, results) => {
        if (err) {
            console.error('Error fetching attendees:', err);
            return res.status(500).json({ message: 'فشل في جلب قائمة الحضور.' });
        }
        res.status(200).json(results);
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

// ==========================================
// TICKET BOOKING ROUTE
// ==========================================

app.post('/api/book_ticket', (req, res) => {
    const { user_id, event_id } = req.body;

    if (!user_id || !event_id) {
        return res.status(400).json({ message: 'بيانات الحجز غير مكتملة.' });
    }

    const checkTicketQuery = 'SELECT * FROM tickets WHERE user_id = ? AND event_id = ?';
    db.query(checkTicketQuery, [user_id, event_id], (err, ticketResults) => {
        if (err) return res.status(500).json({ message: 'حدث خطأ أثناء التحقق من التذاكر.' });
        
        if (ticketResults.length > 0) {
            return res.status(400).json({ message: 'لقد قمت بحجز تذكرة لهذه المباراة مسبقاً.' });
        }

        const checkEventQuery = 'SELECT available_tickets FROM events WHERE id = ?';
        db.query(checkEventQuery, [event_id], (err, eventResults) => {
            if (err) return res.status(500).json({ message: 'حدث خطأ أثناء التحقق من المباراة.' });
            if (eventResults.length === 0) return res.status(404).json({ message: 'المباراة غير موجودة.' });
            
            const available = eventResults[0].available_tickets;
            if (available <= 0) {
                return res.status(400).json({ message: 'عذراً، لقد نفدت جميع تذاكر هذه المباراة.' });
            }

            const qrCodeString = `WAMD-${user_id}-${event_id}-${Date.now()}`;

            const insertTicketQuery = 'INSERT INTO tickets (user_id, event_id, qr_code) VALUES (?, ?, ?)';
            db.query(insertTicketQuery, [user_id, event_id, qrCodeString], (err, insertResult) => {
                if (err) return res.status(500).json({ message: 'فشل في إصدار التذكرة.' });

                const updateEventQuery = 'UPDATE events SET available_tickets = available_tickets - 1 WHERE id = ?';
                db.query(updateEventQuery, [event_id], (err, updateResult) => {
                    if (err) console.error('Failed to update ticket count:', err);
                    res.status(201).json({ message: 'تم حجز التذكرة بنجاح!', qr_code: qrCodeString });
                });
            });
        });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});