const express = require('express');
const router = express.Router();
const db = require('../db');

// ✅ Ambil semua bookings dengan JOIN ke tabel lain
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        b.id AS booking_id,
        b.start_date,
        b.created_at,
        u.id AS user_id,
        u.email AS user_email,
        k.id AS kos_id,
        k.name AS kos_name,
        b.rooms AS rooms_booked
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN kos k ON b.kos_id = k.id
      ORDER BY b.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error GET /api/bookings:', err.message);
    res.status(500).json({ error: 'Failed to fetch bookings', details: err.message });
  }
});

// ✅ Tambah booking baru (dengan room_id)
router.post('/', async (req, res) => {
  try {
    const { user_id, kos_id, room_id, start_date } = req.body;

    // Validasi input
    if (!user_id || !kos_id || !room_id || !start_date) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    // Simpan ke database
    const [result] = await db.query(
      'INSERT INTO bookings (user_id, kos_id, room_id, start_date, created_at) VALUES (?, ?, ?, ?, NOW())',
      [user_id, kos_id, room_id, start_date]
    );

    // Kirim response
    res.status(201).json({ 
      message: 'Booking berhasil ditambahkan', 
      booking_id: result.insertId 
    });

  } catch (err) {
    console.error('❌ Error POST /api/bookings:', err.message);
    res.status(500).json({ 
      error: 'Gagal menambahkan booking', 
      details: err.message 
    });
  }
});


module.exports = router;
