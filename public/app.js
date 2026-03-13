// app.js — Client-side JavaScript สำหรับ Todo List App
// ติดต่อกับ server ผ่าน REST API (/api/todos)

// ===== State =====
let todos = [];           // เก็บรายการ todos ทั้งหมดที่ดึงมาจาก server
let currentFilter = 'all'; // 'all' | 'active' | 'completed'

// ===== DOM References =====
const todoInput   = document.getElementById('todo-input');
const addBtn      = document.getElementById('add-btn');
const todoList    = document.getElementById('todo-list');
const errorMsg    = document.getElementById('error-msg');
const footerCount = document.getElementById('footer-count');
const filterBtns  = document.querySelectorAll('.filter-btn');

// ===== API helpers =====

/** ดึง todos ทั้งหมดจาก server */
async function fetchTodos() {
  const res = await fetch('/api/todos');
  todos = await res.json();
  render();
}

/** เพิ่ม todo ใหม่ */
async function addTodo(text) {
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.json();
    showError(err.error || 'เกิดข้อผิดพลาด');
    return;
  }

  const newTodo = await res.json();
  todos.push(newTodo); // เพิ่มใน local state โดยไม่ต้อง fetch ใหม่
  render();
}

/** Toggle completed ของ todo ตาม id */
async function toggleTodo(id) {
  const res = await fetch(`/api/todos/${id}`, { method: 'PATCH' });
  if (!res.ok) return;

  const updated = await res.json();
  // อัปเดตใน local state
  todos = todos.map((t) => (t.id === id ? updated : t));
  render();
}

/** ลบ todo ตาม id */
async function deleteTodo(id) {
  const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
  if (!res.ok) return;

  todos = todos.filter((t) => t.id !== id);
  render();
}

// ===== Render =====

/** กรอง todos ตาม currentFilter */
function getFilteredTodos() {
  if (currentFilter === 'active')    return todos.filter((t) => !t.completed);
  if (currentFilter === 'completed') return todos.filter((t) => t.completed);
  return todos; // 'all'
}

/** วาดรายการ todos ลงหน้าเว็บ */
function render() {
  const filtered = getFilteredTodos();
  todoList.innerHTML = ''; // ล้างรายการเก่า

  if (filtered.length === 0) {
    // แสดง empty state
    todoList.innerHTML = '<li class="empty-msg">ไม่มีรายการ</li>';
  } else {
    filtered.forEach((todo) => {
      const li = document.createElement('li');
      li.className = `todo-item${todo.completed ? ' completed' : ''}`;

      // Checkbox
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = todo.completed;
      checkbox.addEventListener('change', () => toggleTodo(todo.id));

      // ข้อความงาน
      const span = document.createElement('span');
      span.className = 'todo-text';
      span.textContent = todo.text;

      // ปุ่มลบ
      const delBtn = document.createElement('button');
      delBtn.className = 'delete-btn';
      delBtn.textContent = '✕';
      delBtn.title = 'ลบ';
      delBtn.addEventListener('click', () => deleteTodo(todo.id));

      li.append(checkbox, span, delBtn);
      todoList.appendChild(li);
    });
  }

  // อัปเดต footer: นับงานที่ยังไม่เสร็จ
  const remaining = todos.filter((t) => !t.completed).length;
  footerCount.textContent = `เหลืออีก ${remaining} งาน`;
}

/** แสดง error message และล้างหลัง 3 วินาที */
function showError(msg) {
  errorMsg.textContent = msg;
  setTimeout(() => (errorMsg.textContent = ''), 3000);
}

// ===== Event Listeners =====

// ปุ่ม "เพิ่ม"
addBtn.addEventListener('click', () => {
  const text = todoInput.value.trim();
  if (!text) {
    showError('กรุณากรอกชื่องาน');
    todoInput.focus();
    return;
  }
  errorMsg.textContent = '';
  todoInput.value = '';
  addTodo(text);
});

// กด Enter ในช่อง input
todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addBtn.click();
});

// ปุ่ม Filter
filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    // เปลี่ยน active class
    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    currentFilter = btn.dataset.filter;
    render();
  });
});

// ===== Init =====
// โหลด todos เมื่อหน้าเว็บพร้อม
fetchTodos();
