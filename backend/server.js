require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- FIXED EMAIL CONFIGURATION ---
// "service: 'gmail'" automatically handles the Ports and Security for you.
// This prevents the "Connection Timeout" error on Render.
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Cloud Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const query = (text, params) => pool.query(text, params);

// --- ROUTES ---

// 1. LOGIN / REGISTER (Auto-Approve + Email Save)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    // Remove spaces from email just in case
    const email = req.body.email ? req.body.email.trim().toLowerCase() : null;

    try {
        const result = await query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            // REGISTER
            const hash = bcrypt.hashSync(password, 10);
            const newUser = await query(
                'INSERT INTO users (username, password, email, is_approved) VALUES ($1, $2, $3, 1) RETURNING *', 
                [username, hash, email]
            );
            
            // Welcome Email
            if(email && process.env.EMAIL_USER) {
                transporter.sendMail({
                    from: `"Hostel Manager" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: 'Welcome to Hostel Manager',
                    text: `Hello ${username},\n\nYour account has been created successfully.\nUsername: ${username}\nPassword: ${password}\n\nLogin here: https://hostel-app-xi.vercel.app`
                }).catch(err => console.log("Email failed:", err.message));
            }

            res.json(newUser.rows[0]); 
        } else {
            // LOGIN
            if (bcrypt.compareSync(password, user.password)) {
                // If user didn't have an email saved before, update it now
                if(email && (!user.email || user.email !== email)) {
                    await query('UPDATE users SET email = $1 WHERE id = $2', [email, user.id]);
                }
                
                if (user.is_approved === 1) res.json(user);
                else res.status(403).json({ error: "Account blocked by Admin." });
            } else {
                res.status(401).json({ error: "Invalid password" });
            }
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. FORGOT PASSWORD (Robust Error Handling)
app.post('/api/forgot-password', async (req, res) => {
    const email = req.body.email ? req.body.email.trim().toLowerCase() : "";
    
    try {
        // 1. Check DB
        const result = await query('SELECT * FROM users WHERE LOWER(email) = $1', [email]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Email not found in database." });

        // 2. Generate Temp Password
        const tempPass = Math.random().toString(36).slice(-8);
        const hash = bcrypt.hashSync(tempPass, 10);
        await query('UPDATE users SET password = $1 WHERE email = $2', [hash, email]);

        // 3. Send Email
        await transporter.sendMail({
            from: `"Hostel Manager" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset',
            text: `Your new temporary password is: ${tempPass}\n\nPlease login and change it.`
        });

        res.json({ success: true, message: "Password sent to email." });
    } catch (err) { 
        console.error("Email Error:", err);
        res.status(500).json({ error: "Server Timeout. Try again in 1 minute." }); 
    }
});

// --- REST OF ROUTES (UNCHANGED) ---
app.get('/api/admin/users', async (req, res) => { try { const r = await query("SELECT * FROM users WHERE username != 'admin'"); res.json(r.rows); } catch (e) { res.status(500).json(e); } });
app.post('/api/admin/approve', async (req, res) => { try { await query('UPDATE users SET is_approved = $1 WHERE id = $2', [req.body.status, req.body.userId]); res.json({success:true}); } catch (e) { res.status(500).json(e); } });
app.post('/api/admin/change-password', async (req, res) => { const h = bcrypt.hashSync(req.body.newPassword, 10); try { await query('UPDATE users SET password = $1 WHERE username = $2', [h, 'admin']); res.json({success:true}); } catch (e) { res.status(500).json(e); } });
app.post('/api/admin/delete-owner', async (req, res) => { const {userId} = req.body; try { await query('DELETE FROM beds WHERE room_id IN (SELECT id FROM rooms WHERE user_id = $1)', [userId]); await query('DELETE FROM rooms WHERE user_id = $1', [userId]); await query('DELETE FROM users WHERE id = $1', [userId]); res.json({success:true}); } catch (e) { res.status(500).json(e); } });
app.post('/api/setup', async (req, res) => { const {userId, hostelName, totalFloors, rooms} = req.body; try { await query('UPDATE users SET hostel_name=$1, total_floors=$2, setup_complete=1 WHERE id=$3', [hostelName, totalFloors, userId]); for(const r of rooms){ const rr = await query('INSERT INTO rooms (user_id, floor_number, room_number, capacity) VALUES ($1,$2,$3,$4) RETURNING id', [userId, r.floor, r.roomNo, r.capacity]); for(let i=0; i<r.capacity; i++) await query('INSERT INTO beds (room_id, bed_index) VALUES ($1,$2)', [rr.rows[0].id, i]); } res.json({success:true}); } catch (e) { res.status(500).json(e); } });
app.post('/api/reset-hostel', async (req, res) => { const {userId} = req.body; try { await query('DELETE FROM beds WHERE room_id IN (SELECT id FROM rooms WHERE user_id=$1)', [userId]); await query('DELETE FROM rooms WHERE user_id=$1', [userId]); await query('UPDATE users SET setup_complete=0 WHERE id=$1', [userId]); res.json({success:true}); } catch (e) { res.status(500).json(e); } });
app.get('/api/dashboard/:userId', async (req, res) => { try { const r = await query(`SELECT r.id as room_id, r.floor_number, r.room_number, r.capacity, b.id as bed_id, b.bed_index, b.is_occupied, b.client_name, b.client_mobile, b.join_date, b.leave_date, b.advance_amount, b.maintenance_charges, b.rent_amount, b.last_rent_paid FROM rooms r LEFT JOIN beds b ON r.id = b.room_id WHERE r.user_id = $1 ORDER BY r.floor_number, r.room_number, b.bed_index`, [req.params.userId]); const m = {}; r.rows.forEach(row => { if(!m[row.room_id]) m[row.room_id] = {id:row.room_id, floor:row.floor_number, number:row.room_number, capacity:row.capacity, beds:[]}; if(row.bed_id) m[row.room_id].beds.push({id:row.bed_id, index:row.bed_index, isOccupied:row.is_occupied===1, clientName:row.client_name, clientMobile:row.client_mobile, joinDate:row.join_date, leaveDate:row.leave_date, advance:row.advance_amount, maintenance:row.maintenance_charges, rentAmount:row.rent_amount, lastRentPaid:row.last_rent_paid}); }); res.json(Object.values(m)); } catch (e) { res.status(500).json(e); } });
app.post('/api/rooms/add-bed', async (req, res) => { const {roomId} = req.body; try { const r = await query('SELECT capacity FROM rooms WHERE id=$1', [roomId]); await query('INSERT INTO beds (room_id, bed_index) VALUES ($1,$2)', [roomId, r.rows[0].capacity]); await query('UPDATE rooms SET capacity=capacity+1 WHERE id=$1', [roomId]); res.json({success:true}); } catch (e) { res.status(500).json(e); } });
app.post('/api/rooms/remove-bed', async (req, res) => { const {roomId} = req.body; try { const r = await query('SELECT id, is_occupied FROM beds WHERE room_id=$1 ORDER BY bed_index DESC LIMIT 1', [roomId]); if(r.rows.length===0 || r.rows[0].is_occupied===1) return res.status(400).json({error:"Cannot remove"}); await query('DELETE FROM beds WHERE id=$1', [r.rows[0].id]); await query('UPDATE rooms SET capacity=capacity-1 WHERE id=$1', [roomId]); res.json({success:true}); } catch (e) { res.status(500).json(e); } });
app.post('/api/book', async (req, res) => { const { bedId, clientName, clientMobile, joinDate, leaveDate, advance, maintenance, rentAmount } = req.body; try { await query(`UPDATE beds SET is_occupied = 1, client_name = $1, client_mobile = $2, join_date = $3, leave_date = $4, advance_amount = $5, maintenance_charges = $6, rent_amount = $7, last_rent_paid = NULL WHERE id = $8`, [clientName, clientMobile, joinDate, leaveDate, advance, maintenance, rentAmount, bedId]); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); } });
app.post('/api/update-tenant', async (req, res) => { const { bedId, advance, maintenance, rentAmount, leaveDate } = req.body; try { await query(`UPDATE beds SET advance_amount = $1, maintenance_charges = $2, rent_amount = $3, leave_date = $4 WHERE id = $5`, [advance, maintenance, rentAmount, leaveDate || null, bedId]); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); } });
app.post('/api/update-leave', async (req, res) => { try { await query('UPDATE beds SET leave_date=$1 WHERE id=$2', [req.body.leaveDate, req.body.bedId]); res.json({success:true}); } catch (e) { res.status(500).json(e); } });
app.post('/api/pay-rent', async (req, res) => { try { await query('UPDATE beds SET last_rent_paid=$1 WHERE id=$2', [req.body.monthString, req.body.bedId]); res.json({success:true}); } catch (e) { res.status(500).json(e); } });
app.post('/api/vacate', async (req, res) => { try { await query('UPDATE beds SET is_occupied=0, client_name=NULL, client_mobile=NULL, join_date=NULL, leave_date=NULL, advance_amount=NULL, maintenance_charges=NULL, rent_amount=NULL, last_rent_paid=NULL WHERE id=$1', [req.body.bedId]); res.json({success:true}); } catch (e) { res.status(500).json(e); } });
app.post('/api/import-data', async (req, res) => { const {userId, tenants} = req.body; try { let sc=0; for(const t of tenants) { const d = await query(`SELECT b.id FROM beds b JOIN rooms r ON b.room_id=r.id WHERE r.user_id=$1 AND b.is_occupied=1 AND (b.client_name=$2 OR b.client_mobile=$3)`, [userId, t.name, t.mobile]); if(d.rows.length>0) continue; const rRes = await query(`SELECT id, capacity FROM rooms WHERE user_id=$1 AND room_number=$2`, [userId, t.roomNo]); if(rRes.rows.length===0) continue; const rid = rRes.rows[0].id; let bid; const bRes = await query(`SELECT id FROM beds WHERE room_id=$1 AND is_occupied=0 ORDER BY bed_index ASC LIMIT 1`, [rid]); if(bRes.rows.length>0) bid=bRes.rows[0].id; else { const nb = await query(`INSERT INTO beds (room_id, bed_index) VALUES ($1,$2) RETURNING id`, [rid, rRes.rows[0].capacity]); bid=nb.rows[0].id; await query(`UPDATE rooms SET capacity=capacity+1 WHERE id=$1`, [rid]); } await query(`UPDATE beds SET is_occupied=1, client_name=$1, client_mobile=$2, join_date=$3, last_rent_paid=NULL WHERE id=$4`, [t.name, t.mobile||"", t.joinDate||new Date().toISOString().slice(0,10), bid]); sc++; } res.json({success:true, message:`Imported: ${sc}`}); } catch (e) { res.status(500).json(e); } });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));