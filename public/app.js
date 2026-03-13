// app.js — ติดต่อ REST API ด้วย fetch() และ render UI

// ─── State ────────────────────────────────────────────────────
let todos         = [];    // ข้อมูลจาก server
let currentFilter = 'all'; // 'all' | 'active' | 'completed'

// ─── DOM refs ────────────────────────────────────────────────
const todoInput     = document.getElementById('todo-input');
const addBtn        = document.getElementById('add-btn');
const todoList      = document.getElementById('todo-list');
const errorMsg      = document.getElementById('error-msg');
const footerCount   = document.getElementById('footer-count');
const filterBtns    = document.querySelectorAll('.filter-btn');
const statTotal     = document.getElementById('stat-total');
const statActive    = document.getElementById('stat-active');
const statDone      = document.getElementById('stat-done');
const statProgress  = document.getElementById('stat-progress');
const progressBar   = document.getElementById('progress-bar');
const progressLabel = document.getElementById('progress-label');

// ─── API ──────────────────────────────────────────────────────

/**
 * loadTodos — GET /api/todos
 * ดึงรายการทั้งหมดแล้ว render
 */
async function loadTodos() {
  try {
    const res = await fetch('/api/todos');
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    todos = await res.json();
    render();
  } catch (err) {
    showError('โหลดข้อมูลไม่ได้ กรุณาลองใหม่');
    console.error('[loadTodos]', err);
  }
}

/**
 * addTodo — POST /api/todos
 * เพิ่ม todo ใหม่แล้ว refresh รายการ
 * @param {string} text
 */
async function addTodo(text) {
  try {
    const res = await fetch('/api/todos', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.error || 'เพิ่ม todo ไม่ได้');
      return;
    }

    // เพิ่มใน local state แทน fetch ซ้ำ เพื่อความเร็ว
    todos.push(data);
    render();
  } catch (err) {
    showError('เชื่อมต่อ server ไม่ได้');
    console.error('[addTodo]', err);
  }
}

/**
 * toggleTodo — PUT /api/todos/:id
 * สลับสถานะ done ↔ undone แล้ว refresh รายการ
 * @param {number} id
 */
async function toggleTodo(id) {
  try {
    const res = await fetch(`/api/todos/${id}`, { method: 'PUT' });
    const data = await res.json();

    if (!res.ok) {
      showError(data.error || 'อัปเดตไม่ได้');
      return;
    }

    // อัปเดตเฉพาะ item ที่เปลี่ยนใน local state
    todos = todos.map((t) => (t.id === id ? data : t));
    render();
  } catch (err) {
    showError('เชื่อมต่อ server ไม่ได้');
    console.error('[toggleTodo]', err);
  }
}

/**
 * deleteTodo — DELETE /api/todos/:id
 * ลบ todo แล้ว refresh รายการ
 * @param {number} id
 */
async function deleteTodo(id) {
  try {
    const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    const data = await res.json();

    if (!res.ok) {
      showError(data.error || 'ลบไม่ได้');
      return;
    }

    todos = todos.filter((t) => t.id !== id);
    render();
  } catch (err) {
    showError('เชื่อมต่อ server ไม่ได้');
    console.error('[deleteTodo]', err);
  }
}

// ─── Render ───────────────────────────────────────────────────

/** กรอง todos ตาม currentFilter */
function getFiltered() {
  if (currentFilter === 'active')    return todos.filter((t) => !t.done);
  if (currentFilter === 'completed') return todos.filter((t) =>  t.done);
  return todos;
}

/** วาด todo list และ counter */
function render() {
  const filtered = getFiltered();
  todoList.innerHTML = '';

  if (filtered.length === 0) {
    // Empty state
    const li = document.createElement('li');
    li.className = 'py-12 text-center text-gray-400 text-sm select-none';
    li.innerHTML = `
      <svg class="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
      <p class="font-medium text-gray-400">No tasks here</p>
      <p class="text-xs text-gray-300 mt-1">Add a task above to get started</p>
    `;
    todoList.appendChild(li);
  } else {
    filtered.forEach((todo) => {
      const li = document.createElement('li');
      li.className = 'flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group';

      // ── Checkbox ──
      const checkbox     = document.createElement('input');
      checkbox.type      = 'checkbox';
      checkbox.checked   = todo.done;
      checkbox.className = 'w-4 h-4 cursor-pointer flex-shrink-0 rounded';
      checkbox.addEventListener('change', () => toggleTodo(todo.id));

      // ── Badge + Text wrapper ──
      const textWrap = document.createElement('div');
      textWrap.className = 'flex-1 flex items-center gap-3 min-w-0';

      const span       = document.createElement('span');
      span.textContent = todo.text;
      span.className   = [
        'text-sm break-words flex-1',
        todo.done ? 'line-through text-gray-300' : 'text-gray-700 font-medium',
      ].join(' ');

      const badge       = document.createElement('span');
      badge.textContent = todo.done ? 'Done' : 'Active';
      badge.className   = todo.done
        ? 'hidden sm:inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100 flex-shrink-0'
        : 'hidden sm:inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-100 flex-shrink-0';

      textWrap.append(span, badge);

      // ── Delete button ──
      const delBtn     = document.createElement('button');
      delBtn.title     = 'Delete task';
      delBtn.className = 'flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition cursor-pointer';
      delBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`;
      delBtn.addEventListener('click', () => deleteTodo(todo.id));

      li.append(checkbox, textWrap, delBtn);
      todoList.appendChild(li);
    });
  }

  // ── อัปเดต stats + counter ──
  updateStats();
}

/** อัปเดต stat cards, progress bar และ footer */
function updateStats() {
  const total     = todos.length;
  const done      = todos.filter((t) => t.done).length;
  const active    = total - done;
  const pct       = total === 0 ? 0 : Math.round((done / total) * 100);

  statTotal.textContent    = total;
  statActive.textContent   = active;
  statDone.textContent     = done;
  statProgress.textContent = `${pct}%`;
  progressBar.style.width  = `${pct}%`;
  progressLabel.textContent = `${pct}%`;

  footerCount.textContent = total === 0
    ? 'No tasks yet'
    : active === 0
      ? 'All tasks completed!'
      : `${active} of ${total} task${total > 1 ? 's' : ''} remaining`;
}

// ─── UI helpers ───────────────────────────────────────────────

/** แสดง error message แล้วล้างอัตโนมัติหลัง 3 วินาที */
function showError(msg) {
  errorMsg.textContent = msg;
  setTimeout(() => (errorMsg.textContent = ''), 3000);
}

// ─── Event Listeners ──────────────────────────────────────────

// ปุ่ม Add
addBtn.addEventListener('click', () => {
  const text = todoInput.value.trim();
  if (!text) {
    showError('Please enter a task');
    todoInput.focus();
    return;
  }
  errorMsg.textContent = '';
  todoInput.value      = '';
  addTodo(text);
});

// กด Enter
todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addBtn.click();
});

// Filter buttons
filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    render();
  });
});

// ─── Init ─────────────────────────────────────────────────────
loadTodos();
