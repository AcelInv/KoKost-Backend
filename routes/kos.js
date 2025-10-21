const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ======================= KONFIGURASI MULTER =======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/images'),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ======================= GET SEMUA KOS =======================
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM kos ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ======================= GET DETAIL KOS =======================
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

// ======================= POST TAMBAH KOS =======================
router.post('/', upload.single('image'), async (req, res) => {
  const { name, location, price, availableRooms, description } = req.body;
  const imageUrl = req.file ? '/images/' + req.file.filename : null;

  try {
    if (!name || !location || !price || !availableRooms) {
      return res
        .status(400)
        .json({ success: false, error: 'Semua field wajib diisi!' });
    }

    await db.query(
      'INSERT INTO kos (name, location, price, available_rooms, image_url, description) VALUES ($1, $2, $3, $4, $5, $6)',
      [name, location, price, Number(availableRooms), imageUrl, description || null]
    );

    res
      .status(201)
      .json({ success: true, message: 'Kos berhasil ditambahkan' });
  } catch (err) {
    console.error('❌ Error POST /kos:', err.message);
    res
      .status(500)
      .json({ success: false, error: 'Gagal menambahkan kos ke database' });
  }
});

// ======================= PUT UPDATE KOS (hapus gambar lama otomatis) =======================
router.put('/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { name, location, price, available_rooms, description } = req.body;
  const newImageUrl = req.file ? '/images/' + req.file.filename : null;

  try {
    if (!name || !location || !price || !available_rooms) {
      return res
        .status(400)
        .json({ success: false, error: 'Semua field wajib diisi!' });
    }

    // Ambil data lama
    const oldData = await db.query('SELECT image_url FROM kos WHERE id = $1', [id]);
    const oldImageUrl = oldData.rows[0]?.image_url;

    // Hapus gambar lama jika ada gambar baru
    if (newImageUrl && oldImageUrl && oldImageUrl !== newImageUrl) {
      const oldPath = path.join(__dirname, '..', 'public', oldImageUrl);
      if (oldPath.startsWith(path.join(__dirname, '..', 'public', 'images'))) {
        fs.unlink(oldPath, (err) => {
          if (err) console.warn('⚠️ Gagal hapus gambar lama:', err.message);
        });
      }
    }

    // Update data di database
    if (newImageUrl) {
      await db.query(
        `UPDATE kos 
         SET name=$1, location=$2, price=$3, available_rooms=$4, image_url=$5, description=$6 
         WHERE id=$7`,
        [name, location, price, available_rooms, newImageUrl, description || null, id]
      );
    } else {
      await db.query(
        `UPDATE kos 
         SET name=$1, location=$2, price=$3, available_rooms=$4, description=$5 
         WHERE id=$6`,
        [name, location, price, available_rooms, description || null, id]
      );
    }

    res.json({
      success: true,
      message: 'Kos berhasil diperbarui (gambar lama dihapus jika diganti)',
    });
  } catch (err) {
    console.error('❌ Error PUT /kos/:id:', err.message);
    res.status(500).json({ success: false, error: 'Gagal memperbarui kos' });
  }
});

// ======================= DELETE KOS (hapus gambar otomatis) =======================
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Ambil image lama
    const oldData = await db.query('SELECT image_url FROM kos WHERE id = $1', [id]);
    const oldImageUrl = oldData.rows[0]?.image_url;

    // Hapus gambar lama jika ada
    if (oldImageUrl) {
      const oldPath = path.join(__dirname, '..', 'public', oldImageUrl);
      if (oldPath.startsWith(path.join(__dirname, '..', 'public', 'images'))) {
        fs.unlink(oldPath, (err) => {
          if (err) console.warn('⚠️ Gagal hapus gambar lama saat delete:', err.message);
        });
      }
    }

    // Hapus rooms & data kos di database
    await db.query('DELETE FROM rooms WHERE kos_id = $1', [id]);
    await db.query('DELETE FROM kos WHERE id = $1', [id]);

    res.json({ success: true, message: 'Kos dan gambar terkait berhasil dihapus' });
  } catch (err) {
    console.error('❌ Error DELETE /kos/:id:', err.message);
    res.status(500).json({ success: false, error: 'Gagal menghapus kos' });
  }
});

module.exports = router;
