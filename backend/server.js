require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const query = (text, params) => pool.query(text, params);

// --- ROUTES ---

// 1. LOGIN / REGISTER (Updated for Auto-Approval)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            // REGISTER NEW USER
            const hash = bcrypt.hashSync(password, 10);
            // 👇 CHANGE: is_approved = 1 (Auto Approve)
            const newUser = await query(
                'INSERT INTO users (username, password, is_approved) VALUES ($1, $2, 1) RETURNING *', 
                [username, hash]
            );
            // Return the user immediately so they are logged in automatically
            res.json(newUser.rows[0]); 
        } else {
            // EXISTING USER LOGIN
            if (bcrypt.compareSync(password, user.password)) {
                if (user.is_approved === 1) res.json(user);
                else res.status(403).json({ error: "Your account is blocked by Admin." });
            } else {
                res.status(401).json({ error: "Invalid password" });
            }
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- KEEP ALL OTHER ROUTES EXACTLY THE SAME ---
// (Paste the rest of your previous server.js code below: Admin, Setup, Reset, Dashboard, etc.)
// For safety, I will include the critical Admin/Dashboard routes again to ensure nothing breaks.

app.get('/api/admin/users', async (req, res) => {
    try { const result = await query("SELECT id, username, hostel_name, is_approved FROM users WHERE username != 'admin'"); res.json(result.rows); } 
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/approve', async (req, res) => {
    try { await query('UPDATE users SET is_approved = $1 WHERE id = $2', [req.body.status, req.body.userId]); res.json({ success: true }); } 
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/change-password', async (req, res) => {
    const hash = bcrypt.hashSync(req.body.newPassword, 10);
    try { await query('UPDATE users SET password = $1 WHERE username = $2', [hash, 'admin']); res.json({ success: true }); } 
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/delete-owner', async (req, res) => {
    const { userId } = req.body;
    try {
        await query('DELETE FROM beds WHERE room_id IN (SELECT id FROM rooms WHERE user_id = $1)', [userId]);
        await query('DELETE FROM rooms WHERE user_id = $1', [userId]);
        await query('DELETE FROM users WHERE id = $1', [userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

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
        const sql = `SELECT r.id as room_id, r.floor_number, r.room_number, r.capacity, b.id as bed_id, b.bed_index, b.is_occupied, b.client_name, b.client_mobile, b.join_date, b.leave_date, b.advance_amount, b.maintenance_charges, b.last_rent_paid FROM rooms r LEFT JOIN beds b ON r.id = b.room_id WHERE r.user_id = $1 ORDER BY r.floor_number, r.room_number, b.bed_index`;
        const result = await query(sql, [req.params.userId]);
        const roomsMap = {};
        result.rows.forEach(row => {
            if (!roomsMap[row.room_id]) roomsMap[row.room_id] = { id: row.room_id, floor: row.floor_number, number: row.room_number, capacity: row.capacity, beds: [] };
            if (row.bed_id) roomsMap[row.room_id].beds.push({ id: row.bed_id, index: row.bed_index, isOccupied: row.is_occupied === 1, clientName: row.client_name, clientMobile: row.client_mobile, joinDate: row.join_date, leaveDate: row.leave_date, advance: row.advance_amount, maintenance: row.maintenance_charges, lastRentPaid: row.last_rent_paid });
        });
        res.json(Object.values(roomsMap));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/rooms/add-bed', async (req, res) => {
    const { roomId } = req.body;
    try {
        const roomRes = await query('SELECT capacity FROM rooms WHERE id = $1', [roomId]);
        await query('INSERT INTO beds (room_id, bed_index) VALUES ($1, $2)', [roomId, roomRes.rows[0].capacity]);
        await query('UPDATE rooms SET capacity = capacity + 1 WHERE id = $1', [roomId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/rooms/remove-bed', async (req, res) => {
    const { roomId } = req.body;
    try {
        const lastBedRes = await query('SELECT id, is_occupied FROM beds WHERE room_id = $1 ORDER BY bed_index DESC LIMIT 1', [roomId]);
        if (lastBedRes.rows.length === 0 || lastBedRes.rows[0].is_occupied === 1) return res.status(400).json({ error: "Cannot remove occupied bed" });
        await query('DELETE FROM beds WHERE id = $1', [lastBedRes.rows[0].id]);
        await query('UPDATE rooms SET capacity = capacity - 1 WHERE id = $1', [roomId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/book', async (req, res) => {
    const { bedId, clientName, clientMobile, joinDate, leaveDate, advance, maintenance } = req.body;
    try { await query(`UPDATE beds SET is_occupied = 1, client_name = $1, client_mobile = $2, join_date = $3, leave_date = $4, advance_amount = $5, maintenance_charges = $6, last_rent_paid = NULL WHERE id = $7`, [clientName, clientMobile, joinDate, leaveDate, advance, maintenance, bedId]); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/update-tenant', async (req, res) => {
    const { bedId, advance, maintenance, leaveDate } = req.body;
    try { await query(`UPDATE beds SET advance_amount = $1, maintenance_charges = $2, leave_date = $3 WHERE id = $4`, [advance, maintenance, leaveDate || null, bedId]); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post('/api/update-leave', async (req, res) => { try { await query(`UPDATE beds SET leave_date = $1 WHERE id = $2`, [req.body.leaveDate, req.body.bedId]); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); } });
app.post('/api/pay-rent', async (req, res) => { try { await query(`UPDATE beds SET last_rent_paid = $1 WHERE id = $2`, [req.body.monthString, req.body.bedId]); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); } });
app.post('/api/vacate', async (req, res) => { try { await query(`UPDATE beds SET is_occupied = 0, client_name = NULL, client_mobile = NULL, join_date = NULL, leave_date = NULL, advance_amount = NULL, maintenance_charges = NULL, last_rent_paid = NULL WHERE id = $1`, [req.body.bedId]); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); } });

app.post('/api/import-data', async (req, res) => {
    const { userId, tenants } = req.body;
    try {
        let successCount = 0; let skippedCount = 0; let errors = [];
        for (const tenant of tenants) {
            const dupCheck = await query(`SELECT b.id FROM beds b JOIN rooms r ON b.room_id = r.id WHERE r.user_id = $1 AND b.is_occupied = 1 AND (b.client_name = $2 OR b.client_mobile = $3)`, [userId, tenant.name, tenant.mobile]);
            if (dupCheck.rows.length > 0) { skippedCount++; continue; }
            const roomRes = await query(`SELECT id, capacity FROM rooms WHERE user_id = $1 AND room_number = $2`, [userId, tenant.roomNo]);
            if (roomRes.rows.length === 0) { errors.push(`Room ${tenant.roomNo} missing`); continue; }
            const roomId = roomRes.rows[0].id;
            let bedId;
            const bedRes = await query(`SELECT id FROM beds WHERE room_id = $1 AND is_occupied = 0 ORDER BY bed_index ASC LIMIT 1`, [roomId]);
            if (bedRes.rows.length > 0) bedId = bedRes.rows[0].id;
            else { const newBed = await query(`INSERT INTO beds (room_id, bed_index) VALUES ($1, $2) RETURNING id`, [roomId, roomRes.rows[0].capacity]); bedId = newBed.rows[0].id; await query(`UPDATE rooms SET capacity = capacity + 1 WHERE id = $1`, [roomId]); }
            await query(`UPDATE beds SET is_occupied = 1, client_name = $1, client_mobile = $2, join_date = $3, last_rent_paid = NULL WHERE id = $4`, [tenant.name, tenant.mobile || "", tenant.joinDate || new Date().toISOString().slice(0,10), bedId]);
            successCount++;
        }
        res.json({ success: true, message: `Imported: ${successCount}, Skipped: ${skippedCount}`, errors });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));