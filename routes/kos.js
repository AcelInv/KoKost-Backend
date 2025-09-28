const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// Setup folder upload dengan multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/images'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)) // contoh: 1758634925622.jpg
});
const upload = multer({ storage });

/* ============================
   KOS (induk)
============================ */

// GET semua kos
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM kos');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET detail kos + daftar rooms
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [kos] = await db.query('SELECT * FROM kos WHERE id = ?', [id]);
    if (kos.length === 0) return res.status(404).json({ error: 'Kos tidak ditemukan' });

    const [rooms] = await db.query('SELECT * FROM rooms WHERE kos_id = ?', [id]);

    res.json({ ...kos[0], rooms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST tambah kos
router.post('/', upload.single('image'), async (req, res) => {
  const { name, location, price, availableRooms, description } = req.body;
  const imageUrl = req.file ? '/images/' + req.file.filename : null;

  try {
    await db.query(
      'INSERT INTO kos (name, location, price, available_rooms, image_url, description) VALUES (?, ?, ?, ?, ?, ?)',
      [name, location, price, availableRooms, imageUrl, description]
    );
    res.json({ message: 'Kos berhasil ditambahkan' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT edit kos dan update rooms terkait
router.put('/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  
  let { name, location, price, available_rooms, description } = req.body;

  // Konversi ke number
  price = Number(price);
  available_rooms = Number(available_rooms);

  // Validasi available_rooms
  if (isNaN(available_rooms)) {
    return res.status(400).json({ error: 'available_rooms harus berupa angka valid' });
  }
  if (isNaN(price)) {
    return res.status(400).json({ error: 'price harus berupa angka valid' });
  }

  const imageUrl = req.file ? '/images/' + req.file.filename : null;

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Query update kos, jika ada gambar baru
    let sqlKos;
    let paramsKos;

    if (imageUrl) {
      sqlKos = `
        UPDATE kos 
        SET name = ?, location = ?, price = ?, available_rooms = ?, description = ?, image_url = ? 
        WHERE id = ?
      `;
      paramsKos = [name, location, price, available_rooms, description, imageUrl, id];
    } else {
      sqlKos = `
        UPDATE kos 
        SET name = ?, location = ?, price = ?, available_rooms = ?, description = ?
        WHERE id = ?
      `;
      paramsKos = [name, location, price, available_rooms, description, id];
    }

    await conn.query(sqlKos, paramsKos);

    // Update rooms yang terkait dengan kos_id = id
    const sqlRooms = `
      UPDATE rooms
      SET price = ?
      WHERE kos_id = ?
    `;
    await conn.query(sqlRooms, [price, id]);

    await conn.commit();

    res.json({ message: 'Data kos dan rooms berhasil diperbarui' });
  } catch (err) {
    await conn.rollback();
    console.error('Update error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan saat memperbarui data' });
  } finally {
    conn.release();
  }
});








// DELETE kos dan rooms terkait
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM rooms WHERE kos_id = ?', [id]);
    await db.query('DELETE FROM kos WHERE id = ?', [id]);
    res.json({ message: 'Kos berhasil dihapus beserta semua kamar' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

/* ============================
   ROOMS (tiap kos)
============================ */

// GET semua rooms untuk 1 kos
router.get('/:kosId/rooms', async (req, res) => {
  const { kosId } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM rooms WHERE kos_id = ?', [kosId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST tambah room
router.post('/:kosId/rooms', async (req, res) => {
  const { kosId } = req.params;
  const { name, price, availableRooms, description, rules } = req.body;

  try {
    await db.query(
      'INSERT INTO rooms (kos_id, name, price, available_rooms, description, rules) VALUES (?, ?, ?, ?, ?, ?)',
      [kosId, name, price, availableRooms, description, rules]
    );
    res.json({ message: 'Room berhasil ditambahkan' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT edit room
router.put('/:kosId/rooms/:roomId', async (req, res) => {
  const { kosId, roomId } = req.params;
  const { name, price, availableRooms, description, rules } = req.body;

  try {
    await db.query(
      'UPDATE rooms SET name=?, price=?, available_rooms=?, description=?, rules=? WHERE id=? AND kos_id=?',
      [name, price, availableRooms, description, rules, roomId, kosId]
    );
    res.json({ message: 'Room berhasil diperbarui' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE room
router.delete('/:kosId/rooms/:roomId', async (req, res) => {
  const { kosId, roomId } = req.params;
  try {
    await db.query('DELETE FROM rooms WHERE id = ? AND kos_id = ?', [roomId, kosId]);
    res.json({ message: 'Room berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
