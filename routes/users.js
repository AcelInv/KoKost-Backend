const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, username, email, role, created_at FROM users"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/register", async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const [existsUser] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    if (existsUser.length > 0)
      return res.status(400).json({ error: "Username sudah dipakai" });

    const [existsEmail] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (existsEmail.length > 0)
      return res.status(400).json({ error: "Email sudah terdaftar" });

    const hashed = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashed, role || "user"]
    );
    res.json({ message: "Registrasi berhasil" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (users.length === 0)
      return res.status(400).json({ error: "Username tidak ditemukan" });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Password salah" });

    res.json({ id: user.id, username: user.username, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Hapus user
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "User dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
