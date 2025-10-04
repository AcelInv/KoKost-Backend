const express = require("express");
const router = express.Router();
const db = require("../db");

// Ambil semua bookings
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        b.id AS booking_id,
        b.start_date,
        b.created_at,
        b.rooms AS rooms,
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
    res.json(rows);
  } catch (err) {
    console.error("❌ Error GET /api/bookings:", err.message);
    res
      .status(500)
      .json({ error: "Failed to fetch bookings", details: err.message });
  }
});

// Buat booking baru (langsung, tanpa status)
router.post("/", async (req, res) => {
  try {
    const { user_id, kos_id, rooms, start_date } = req.body;
    if (!user_id || !kos_id || !rooms || !start_date)
      return res.status(400).json({ error: "Semua field wajib diisi" });

    // Ambil available_rooms
    const [kosRow] = await db.query(
      "SELECT available_rooms FROM kos WHERE id = ?",
      [kos_id]
    );
    if (!kosRow.length)
      return res.status(404).json({ error: "Kos tidak ditemukan" });

    const available = kosRow[0].available_rooms;
    if (available < rooms)
      return res
        .status(400)
        .json({ error: `Hanya tersedia ${available} kamar` });

    // Insert booking
    const [result] = await db.query(
      `INSERT INTO bookings (user_id, kos_id, rooms, start_date, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [user_id, kos_id, rooms, start_date]
    );

    // Update available_rooms
    const newAvailable = available - rooms;
    await db.query("UPDATE kos SET available_rooms = ? WHERE id = ?", [
      newAvailable,
      kos_id,
    ]);

    res.status(201).json({
      success: true,
      booking_id: result.insertId,
      available_rooms: newAvailable,
      rooms_booked: rooms,
    });
  } catch (err) {
    console.error("❌ Error POST /api/bookings:", err.message);
    res
      .status(500)
      .json({ error: "Gagal menambahkan booking", details: err.message });
  }
});

module.exports = router;
