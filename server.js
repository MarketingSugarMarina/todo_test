// server.js — จุดเริ่มต้นของ Express server

const express = require('express');
const path = require('path');

const app = express();

// อ่าน port จาก environment variable หรือใช้ 3000 เป็นค่าเริ่มต้น
const PORT = process.env.PORT || 3000;

// Middleware: แปลง request body เป็น JSON
app.use(express.json());

// Middleware: serve static files จากโฟลเดอร์ /public
// เมื่อเข้า http://localhost:3000 จะโหลด public/index.html อัตโนมัติ
app.use(express.static(path.join(__dirname, 'public')));

// --- In-memory data store ---
// เก็บ todos ไว้ใน array (รีสตาร์ท server = ข้อมูลหาย)
let todos = [];
let nextId = 1; // auto-increment ID

// GET /api/todos — ดึงรายการ todo ทั้งหมด
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

// POST /api/todos — เพิ่ม todo ใหม่
// body: { "text": "ชื่องาน" }
app.post('/api/todos', (req, res) => {
  const { text } = req.body;

  // ตรวจสอบว่ามี text หรือไม่
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'text is required' });
  }

  const todo = {
    id: nextId++,
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
  };

  todos.push(todo);
  res.status(201).json(todo);
});

// PATCH /api/todos/:id — toggle completed ของ todo
app.patch('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const todo = todos.find((t) => t.id === id);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  // สลับสถานะ completed
  todo.completed = !todo.completed;
  res.json(todo);
});

// DELETE /api/todos/:id — ลบ todo ตาม id
app.delete('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = todos.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  todos.splice(index, 1);
  res.status(204).send(); // 204 No Content
});

// เริ่มต้น server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
