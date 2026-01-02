import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import { v4 as uuid } from "uuid";

const app = express();
app.use(express.json());
app.use(cors());

/**
 * =========================
 * DATABASE (RESILIENT)
 * =========================
 */
let db = null;

async function connectDB() {
  while (!db) {
    try {
      db = await mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
      });
      console.log("Connected to MySQL");
    } catch (err) {
      console.error("MySQL not ready. Retrying in 5s...");
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

connectDB();

/**
 * =========================
 * HEALTH
 * =========================
 */
app.get("/health", (_, res) => res.send("ok"));

/**
 * =========================
 * ROUTES
 * =========================
 */
const router = express.Router();

// GET contacts
router.get("/contacts", async (_, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM contacts ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// CREATE contact
router.post("/contacts", async (req, res) => {
  try {
    const id = uuid();
    const { name, email, phone } = req.body;

    await db.query(
      "INSERT INTO contacts (id, name, email, phone) VALUES (?, ?, ?, ?)",
      [id, name, email, phone]
    );

    res.json({ id, name, email, phone });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// UPDATE contact
router.put("/contacts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    await db.query(
      "UPDATE contacts SET name=?, email=?, phone=? WHERE id=?",
      [name, email, phone, id]
    );

    res.json({ id, name, email, phone });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// DELETE contact
router.delete("/contacts/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM contacts WHERE id=?", [req.params.id]);
    res.json({ message: "deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// mount API
app.use("/api", router);

/**
 * =========================
 * LISTEN
 * =========================
 */
app.listen(3000, "0.0.0.0", () => {
  console.log("Backend running on port 3000");
});
