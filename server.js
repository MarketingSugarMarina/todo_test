// server.js — Express REST API สำหรับ Todo List App

const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── File store ───────────────────────────────────────────────
const DB_PATH = path.join(__dirname, 'todos.json');

/**
 * readDB — อ่านข้อมูลจาก todos.json
 * ถ้าไฟล์ยังไม่มี จะสร้างใหม่เป็น { todos: [], nextId: 1 }
 * @returns {{ todos: object[], nextId: number }}
 */
function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { todos: [], nextId: 1 };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(raw);
}

/**
 * writeDB — บันทึกข้อมูลลง todos.json
 * @param {{ todos: object[], nextId: number }} db
 */
function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

// ─── Helper ───────────────────────────────────────────────────

/** แปลง :id param เป็น integer — คืน NaN ถ้าไม่ใช่ตัวเลข */
function parseId(param) {
  return parseInt(param, 10);
}

// ─── Routes ───────────────────────────────────────────────────

/**
 * GET /api/todos
 * ดึงรายการ todo ทั้งหมด
 * Response 200: Todo[]
 */
app.get('/api/todos', (req, res) => {
  const { todos } = readDB();
  res.json(todos);
});

/**
 * POST /api/todos
 * เพิ่ม todo ใหม่
 * Body: { text: string }
 * Response 201: Todo ที่เพิ่งสร้าง
 * Response 400: ถ้า text ว่างหรือไม่ได้ส่งมา
 */
app.post('/api/todos', (req, res) => {
  const { text } = req.body ?? {};

  if (typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'text is required and must be a non-empty string' });
  }

  const db   = readDB();
  const todo = {
    id:        db.nextId++,
    text:      text.trim(),
    done:      false,
    createdAt: new Date().toISOString(),
  };

  db.todos.push(todo);
  writeDB(db);
  res.status(201).json(todo);
});

/**
 * PUT /api/todos/:id
 * Toggle สถานะ done ↔ undone
 * Response 200: Todo ที่อัปเดตแล้ว
 * Response 400: ถ้า id ไม่ใช่ตัวเลข
 * Response 404: ถ้าไม่พบ todo
 */
app.put('/api/todos/:id', (req, res) => {
  const id = parseId(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'id must be a number' });
  }

  const db   = readDB();
  const todo = db.todos.find((t) => t.id === id);

  if (!todo) {
    return res.status(404).json({ error: `Todo with id ${id} not found` });
  }

  todo.done      = !todo.done;
  todo.updatedAt = new Date().toISOString();

  writeDB(db);
  res.json(todo);
});

/**
 * DELETE /api/todos/:id
 * ลบ todo ตาม id
 * Response 200: { message, deleted }
 * Response 400: ถ้า id ไม่ใช่ตัวเลข
 * Response 404: ถ้าไม่พบ todo
 */
app.delete('/api/todos/:id', (req, res) => {
  const id = parseId(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'id must be a number' });
  }

  const db    = readDB();
  const index = db.todos.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Todo with id ${id} not found` });
  }

  const [deleted] = db.todos.splice(index, 1);
  writeDB(db);
  res.json({ message: 'Deleted successfully', deleted });
});

// ─── 404 handler สำหรับ route ที่ไม่มี ────────────────────────
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
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
