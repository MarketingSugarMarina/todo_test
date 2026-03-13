// server.js — Express REST API สำหรับ Todo List App (PostgreSQL)

const express  = require('express');
const path     = require('path');
const { Pool } = require('pg');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Database ─────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Railway ต้องการ SSL
});

/**
 * initDB — สร้างตาราง todos ถ้ายังไม่มี
 * รันครั้งเดียวตอน server เริ่ม
 */
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id         SERIAL PRIMARY KEY,
      text       TEXT        NOT NULL,
      done       BOOLEAN     NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ
    )
  `);
  console.log('Database ready');
}

// ─── Helper ───────────────────────────────────────────────────

/** แปลง row จาก PostgreSQL ให้ตรงกับ format ที่ frontend ใช้ */
function formatTodo(row) {
  return {
    id:        row.id,
    text:      row.text,
    done:      row.done,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** แปลง :id param เป็น integer — คืน NaN ถ้าไม่ใช่ตัวเลข */
function parseId(param) {
  return parseInt(param, 10);
}

// ─── Routes ───────────────────────────────────────────────────

/**
 * GET /api/todos
 * ดึงรายการ todo ทั้งหมด เรียงตาม id
 * Response 200: Todo[]
 */
app.get('/api/todos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM todos ORDER BY id ASC');
    res.json(rows.map(formatTodo));
  } catch (err) {
    console.error('[GET /api/todos]', err);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

/**
 * POST /api/todos
 * เพิ่ม todo ใหม่
 * Body: { text: string }
 * Response 201: Todo ที่เพิ่งสร้าง
 */
app.post('/api/todos', async (req, res) => {
  const { text } = req.body ?? {};

  if (typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'text is required and must be a non-empty string' });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO todos (text) VALUES ($1) RETURNING *',
      [text.trim()]
    );
    res.status(201).json(formatTodo(rows[0]));
  } catch (err) {
    console.error('[POST /api/todos]', err);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

/**
 * PUT /api/todos/:id
 * Toggle สถานะ done ↔ undone
 * Response 200: Todo ที่อัปเดตแล้ว
 */
app.put('/api/todos/:id', async (req, res) => {
  const id = parseId(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'id must be a number' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE todos
          SET done       = NOT done,
              updated_at = NOW()
        WHERE id = $1
      RETURNING *`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: `Todo with id ${id} not found` });
    }

    res.json(formatTodo(rows[0]));
  } catch (err) {
    console.error('[PUT /api/todos/:id]', err);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

/**
 * DELETE /api/todos/:id
 * ลบ todo ตาม id
 * Response 200: { message, deleted }
 */
app.delete('/api/todos/:id', async (req, res) => {
  const id = parseId(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'id must be a number' });
  }

  try {
    const { rows } = await pool.query(
      'DELETE FROM todos WHERE id = $1 RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: `Todo with id ${id} not found` });
    }

    res.json({ message: 'Deleted successfully', deleted: formatTodo(rows[0]) });
  } catch (err) {
    console.error('[DELETE /api/todos/:id]', err);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// ─── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── Global error handler ─────────────────────────────────────
app.use((err, req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  });
