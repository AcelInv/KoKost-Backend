const express = require("express");
const router = express.Router();
const db = require("../db");

// GET semua booking
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        b.id AS booking_id,
        b.start_date,
        b.created_at,
        b.rooms,
        u.id AS user_id,
        u.email AS user_email,
        k.id AS kos_id,
        k.name AS kos_name,
        k.available_rooms
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN kos k ON b.kos_id = k.id
      ORDER BY b.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error GET /bookings:", err.message);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// POST tambah booking baru
router.post("/", async (req, res) => {
  try {
    const { user_id, kos_id, rooms, start_date } = req.body;
    if (!user_id || !kos_id || !rooms || !start_date)
      return res.status(400).json({ error: "Semua field wajib diisi" });

    const kosRow = await db.query("SELECT available_rooms FROM kos WHERE id = $1", [kos_id]);
    if (kosRow.rows.length === 0)
      return res.status(404).json({ error: "Kos tidak ditemukan" });

    const available = kosRow.rows[0].available_rooms;
    if (available < rooms)
      return res.status(400).json({ error: `Hanya tersedia ${available} kamar` });

    // Insert booking
    const result = await db.query(
      `INSERT INTO bookings (user_id, kos_id, rooms, start_date, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING id`,
      [user_id, kos_id, rooms, start_date]
    );

    const newAvailable = available - rooms;
    await db.query("UPDATE kos SET available_rooms = $1 WHERE id = $2", [newAvailable, kos_id]);

    res.status(201).json({
      success: true,
      booking_id: result.rows[0].id,
      available_rooms: newAvailable,
      rooms_booked: rooms,
    });
  } catch (err) {
    console.error("Error POST /bookings:", err.message);
    res.status(500).json({ error: "Gagal menambahkan booking" });
  }
});

module.exports = router;
