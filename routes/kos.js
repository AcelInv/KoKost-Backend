const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/images'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// GET semua kos
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM kos ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET detail kos
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const kos = await db.query('SELECT * FROM kos WHERE id = $1', [id]);
    if (kos.rows.length === 0)
      return res.status(404).json({ error: 'Kos tidak ditemukan' });

    const rooms = await db.query('SELECT * FROM rooms WHERE kos_id = $1', [id]);
    res.json({ ...kos.rows[0], rooms: rooms.rows });
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
      'INSERT INTO kos (name, location, price, available_rooms, image_url, description) VALUES ($1, $2, $3, $4, $5, $6)',
      [name, location, price, availableRooms, imageUrl, description]
    );
    res.json({ message: 'Kos berhasil ditambahkan' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// DELETE kos
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM rooms WHERE kos_id = $1', [id]);
    await db.query('DELETE FROM kos WHERE id = $1', [id]);
    res.json({ message: 'Kos berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT update kos
router.put('/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { name, location, price, available_rooms, description } = req.body;
  const imageUrl = req.file ? '/images/' + req.file.filename : null;

  try {
    if (imageUrl) {
      await db.query(
        'UPDATE kos SET name=$1, location=$2, price=$3, available_rooms=$4, image_url=$5, description=$6 WHERE id=$7',
        [name, location, price, available_rooms, imageUrl, description || null, id]
      );
    } else {
      await db.query(
        'UPDATE kos SET name=$1, location=$2, price=$3, available_rooms=$4, description=$5 WHERE id=$6',
        [name, location, price, available_rooms, description || null, id]
      );
    }

    res.json({ success: true, message: 'Kos berhasil diperbarui' });
  } catch (err) {
    console.error('Error PUT /kos/:id:', err.message);
    res.status(500).json({ success: false, error: 'Gagal memperbarui kos' });
  }
});


module.exports = router;
