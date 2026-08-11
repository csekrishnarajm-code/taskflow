const API = "/api";
let TOKEN = localStorage.getItem("taskflow_token") || null;
let CURRENT_USER = null;

// ---------- DOM refs ----------
const authScreen = document.getElementById("auth-screen");
const dashboard = document.getElementById("dashboard");
const authError = document.getElementById("auth-error");

// ---------- Tab switching ----------
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("login-form").classList.toggle("hidden", btn.dataset.tab !== "login");
    document.getElementById("register-form").classList.toggle("hidden", btn.dataset.tab !== "register");
  });
});

// ---------- Auth ----------
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  await authRequest("/login", { email, password });
});

document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("reg-name").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;
  await authRequest("/register", { name, email, password });
});

async function authRequest(path, body) {
  authError.classList.add("hidden");
  try {
    const res = await fetch(API + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong");

    TOKEN = data.token;
    CURRENT_USER = data.user;
    localStorage.setItem("taskflow_token", TOKEN);
    enterDashboard();
  } catch (err) {
    authError.textContent = err.message;
    authError.classList.remove("hidden");
  }
}

document.getElementById("logout-btn").addEventListener("click", () => {
  TOKEN = null;
  localStorage.removeItem("taskflow_token");
  dashboard.classList.add("hidden");
  authScreen.classList.remove("hidden");
});

async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    TOKEN = null;
    localStorage.removeItem("taskflow_token");
    authScreen.classList.remove("hidden");
    dashboard.classList.add("hidden");
    throw new Error("Session expired, please log in again");
  }
  return res;
}

// ---------- Bootstrap on load ----------
async function tryAutoLogin() {
  if (!TOKEN) return;
  try {
    const res = await apiFetch("/me");
    if (!res.ok) return;
    CURRENT_USER = await res.json();
    enterDashboard();
  } catch (_) { /* stay on auth screen */ }
}

function enterDashboard() {
  authScreen.classList.add("hidden");
  dashboard.classList.remove("hidden");
  document.getElementById("user-name").textContent = `Hi, ${CURRENT_USER.name}`;
  loadStats();
  loadTasks();
}

// ---------- Stats ----------
async function loadStats() {
  const res = await apiFetch("/tasks/stats");
  const s = await res.json();
  document.getElementById("stats-row").innerHTML = `
    <div class="stat-card"><div class="num">${s.total}</div><div class="label">Total</div></div>
    <div class="stat-card"><div class="num">${s.pending}</div><div class="label">Pending</div></div>
    <div class="stat-card"><div class="num">${s.in_progress}</div><div class="label">In Progress</div></div>
    <div class="stat-card"><div class="num">${s.completed}</div><div class="label">Completed</div></div>
  `;
}

// ---------- Tasks ----------
async function loadTasks() {
  const status = document.getElementById("filter-status").value;
  const priority = document.getElementById("filter-priority").value;
  const sortBy = document.getElementById("sort-by").value;

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (priority) params.set("priority", priority);
  params.set("sort_by", sortBy);

  const res = await apiFetch(`/tasks?${params}`);
  const tasks = await res.json();
  renderTasks(tasks);
}

function renderTasks(tasks) {
  const list = document.getElementById("task-list");
  if (tasks.length === 0) {
    list.innerHTML = `<p style="color:#6b7280; text-align:center; padding:30px;">No tasks yet — create your first one.</p>`;
    return;
  }
  list.innerHTML = tasks.map(t => `
    <div class="task-card ${t.priority}">
      <div>
        <div class="title">${escapeHtml(t.title)}</div>
        <div class="meta">
          <span class="badge">${t.status.replace('_', ' ')}</span>
          <span class="badge">${t.priority} priority</span>
          ${t.due_date ? `<span class="badge">due ${t.due_date}</span>` : ""}
        </div>
      </div>
      <div class="actions">
        <button onclick="editTask(${t.id})">✏️</button>
        <button onclick="deleteTask(${t.id})">🗑️</button>
      </div>
    </div>
  `).join("");
  window._taskCache = Object.fromEntries(tasks.map(t => [t.id, t]));
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

["filter-status", "filter-priority", "sort-by"].forEach(id => {
  document.getElementById(id).addEventListener("change", loadTasks);
});

// ---------- Task modal ----------
const modal = document.getElementById("task-modal");
document.getElementById("new-task-btn").addEventListener("click", () => openModal());
document.getElementById("cancel-btn").addEventListener("click", () => modal.classList.add("hidden"));

function openModal(task = null) {
  document.getElementById("modal-title").textContent = task ? "Edit Task" : "New Task";
  document.getElementById("task-id").value = task ? task.id : "";
  document.getElementById("task-title").value = task ? task.title : "";
  document.getElementById("task-description").value = task ? task.description : "";
  document.getElementById("task-status").value = task ? task.status : "pending";
  document.getElementById("task-priority").value = task ? task.priority : "medium";
  document.getElementById("task-due").value = task ? (task.due_date || "") : "";
  modal.classList.remove("hidden");
}

function editTask(id) {
  openModal(window._taskCache[id]);
}

async function deleteTask(id) {
  if (!confirm("Delete this task?")) return;
  await apiFetch(`/tasks/${id}`, { method: "DELETE" });
  loadTasks();
  loadStats();
}

document.getElementById("task-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("task-id").value;
  const payload = {
    title: document.getElementById("task-title").value,
    description: document.getElementById("task-description").value,
    status: document.getElementById("task-status").value,
    priority: document.getElementById("task-priority").value,
    due_date: document.getElementById("task-due").value || null,
  };

  if (id) {
    await apiFetch(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  } else {
    await apiFetch("/tasks", { method: "POST", body: JSON.stringify(payload) });
  }

  modal.classList.add("hidden");
  loadTasks();
  loadStats();
});

tryAutoLogin();
