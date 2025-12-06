require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Cloud Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

console.log("Connecting to Cloud Database...");

// Initialize Tables
const initDB = async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY, username TEXT UNIQUE, password TEXT, 
            is_approved INTEGER DEFAULT 0, setup_complete INTEGER DEFAULT 0, 
            hostel_name TEXT, total_floors INTEGER
        );`);

        const adminPass = bcrypt.hashSync("admin123", 10);
        await pool.query(`INSERT INTO users (username, password, is_approved, setup_complete) 
            VALUES ('admin', $1, 1, 1) ON CONFLICT (username) DO NOTHING;`, [adminPass]);

        await pool.query(`CREATE TABLE IF NOT EXISTS rooms (
            id SERIAL PRIMARY KEY, user_id INTEGER, floor_number INTEGER, 
            room_number TEXT, capacity INTEGER
        );`);

        await pool.query(`CREATE TABLE IF NOT EXISTS beds (
            id SERIAL PRIMARY KEY, room_id INTEGER REFERENCES rooms(id), 
            bed_index INTEGER, is_occupied INTEGER DEFAULT 0, 
            client_name TEXT, client_mobile TEXT, join_date TEXT, 
            leave_date TEXT, advance_amount REAL, maintenance_charges REAL, 
            last_rent_paid TEXT
        );`);
        console.log("Database Tables Ready.");
    } catch (err) { console.error("DB Init Error:", err); }
};
initDB();

const query = (text, params) => pool.query(text, params);

// --- ROUTES ---

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];
        if (!user) {
            const hash = bcrypt.hashSync(password, 10);
            await query('INSERT INTO users (username, password, is_approved) VALUES ($1, $2, 0)', [username, hash]);
            return res.status(403).json({ error: "REGISTRATION_SUCCESS" });
        } else {
            if (bcrypt.compareSync(password, user.password)) {
                if (user.is_approved === 1) res.json(user);
                else res.status(403).json({ error: "NOT_APPROVED" });
            } else {
                res.status(401).json({ error: "Invalid password" });
            }
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- ADMIN ROUTES ---
app.get('/api/admin/users', async (req, res) => {
    try {
        const result = await query("SELECT id, username, hostel_name, is_approved FROM users WHERE username != 'admin'");
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/approve', async (req, res) => {
    try {
        await query('UPDATE users SET is_approved = $1 WHERE id = $2', [req.body.status, req.body.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/change-password', async (req, res) => {
    const hash = bcrypt.hashSync(req.body.newPassword, 10);
    try {
        await query('UPDATE users SET password = $1 WHERE username = $2', [hash, 'admin']);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// NEW: DELETE OWNER (Cascading Delete)
app.post('/api/admin/delete-owner', async (req, res) => {
    const { userId } = req.body;
    try {
        // 1. Delete Beds
        await query('DELETE FROM beds WHERE room_id IN (SELECT id FROM rooms WHERE user_id = $1)', [userId]);
        // 2. Delete Rooms
        await query('DELETE FROM rooms WHERE user_id = $1', [userId]);
        // 3. Delete User
        await query('DELETE FROM users WHERE id = $1', [userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- HOSTEL ROUTES ---
app.post('/api/setup', async (req, res) => {
    const { userId, hostelName, totalFloors, rooms } = req.body;
    try {
        await query('UPDATE users SET hostel_name = $1, total_floors = $2, setup_complete = 1 WHERE id = $3', [hostelName, totalFloors, userId]);
        for (const room of rooms) {
            const rRes = await query('INSERT INTO rooms (user_id, floor_number, room_number, capacity) VALUES ($1, $2, $3, $4) RETURNING id', [userId, room.floor, room.roomNo, room.capacity]);
            const roomId = rRes.rows[0].id;
            for(let i=0; i<room.capacity; i++) await query('INSERT INTO beds (room_id, bed_index) VALUES ($1, $2)', [roomId, i]);
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/reset-hostel', async (req, res) => {
    const { userId } = req.body;
    try {
        await query(`DELETE FROM beds WHERE room_id IN (SELECT id FROM rooms WHERE user_id = $1)`, [userId]);
        await query(`DELETE FROM rooms WHERE user_id = $1`, [userId]);
        await query(`UPDATE users SET setup_complete = 0 WHERE id = $1`, [userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/dashboard/:userId', async (req, res) => {
    try {
        const sql = `
            SELECT r.id as room_id, r.floor_number, r.room_number, r.capacity,
            b.id as bed_id, b.bed_index, b.is_occupied, b.client_name, b.client_mobile, b.join_date, b.leave_date, b.advance_amount, b.maintenance_charges, b.last_rent_paid
            FROM rooms r LEFT JOIN beds b ON r.id = b.room_id
            WHERE r.user_id = $1 ORDER BY r.floor_number, r.room_number, b.bed_index`;
        const result = await query(sql, [req.params.userId]);
        const roomsMap = {};
        result.rows.forEach(row => {
            if (!roomsMap[row.room_id]) roomsMap[row.room_id] = { id: row.room_id, floor: row.floor_number, number: row.room_number, capacity: row.capacity, beds: [] };
            if (row.bed_id) roomsMap[row.room_id].beds.push({ id: row.bed_id, index: row.bed_index, isOccupied: row.is_occupied === 1, clientName: row.client_name, clientMobile: row.client_mobile, joinDate: row.join_date, leaveDate: row.leave_date, advance: row.advance_amount, maintenance: row.maintenance_charges, lastRentPaid: row.last_rent_paid });
        });
        res.json(Object.values(roomsMap));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/book', async (req, res) => {
    const { bedId, clientName, clientMobile, joinDate, leaveDate, advance, maintenance } = req.body;
    try { await query(`UPDATE beds SET is_occupied = 1, client_name = $1, client_mobile = $2, join_date = $3, leave_date = $4, advance_amount = $5, maintenance_charges = $6, last_rent_paid = NULL WHERE id = $7`, [clientName, clientMobile, joinDate, leaveDate, advance, maintenance, bedId]); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/update-leave', async (req, res) => { try { await query(`UPDATE beds SET leave_date = $1 WHERE id = $2`, [req.body.leaveDate, req.body.bedId]); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); } });
app.post('/api/pay-rent', async (req, res) => { try { await query(`UPDATE beds SET last_rent_paid = $1 WHERE id = $2`, [req.body.monthString, req.body.bedId]); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); } });
app.post('/api/vacate', async (req, res) => { try { await query(`UPDATE beds SET is_occupied = 0, client_name = NULL, client_mobile = NULL, join_date = NULL, leave_date = NULL, advance_amount = NULL, maintenance_charges = NULL, last_rent_paid = NULL WHERE id = $1`, [req.body.bedId]); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); } });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));