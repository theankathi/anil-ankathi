/* ============================================================
   Task Manager — vanilla JS
   Data/logic layer is kept separate from the DOM/render layer.
   ============================================================ */

/* ---------- Data layer (store) ---------- */
const Store = (() => {
  const KEY = "task-manager.tasks";

  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  };

  const save = (tasks) => localStorage.setItem(KEY, JSON.stringify(tasks));

  // Simple unique id without external deps.
  const uid = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  return {
    getAll: load,

    add(data) {
      const tasks = load();
      tasks.push({
        id: uid(),
        title: data.title,
        description: data.description || "",
        dueDate: data.dueDate || "",
        priority: data.priority || "Medium",
        completed: false,
        createdAt: Date.now(),
      });
      save(tasks);
    },

    update(id, changes) {
      const tasks = load().map((t) =>
        t.id === id ? { ...t, ...changes } : t
      );
      save(tasks);
    },

    remove(id) {
      save(load().filter((t) => t.id !== id));
    },

    toggle(id) {
      const tasks = load().map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      );
      save(tasks);
    },

    clearCompleted() {
      save(load().filter((t) => !t.completed));
    },
  };
})();

/* ---------- Theme (persisted) ---------- */
const Theme = (() => {
  const KEY = "task-manager.theme";
  const apply = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    document.getElementById("theme-toggle").textContent =
      theme === "dark" ? "☀️" : "🌙";
  };
  return {
    init() {
      apply(localStorage.getItem(KEY) || "light");
    },
    toggle() {
      const next =
        document.documentElement.getAttribute("data-theme") === "dark"
          ? "light"
          : "dark";
      localStorage.setItem(KEY, next);
      apply(next);
    },
  };
})();

/* ---------- View / controller ---------- */
const filters = { status: "all", priority: "all" };

// DOM refs
const form = document.getElementById("task-form");
const idInput = document.getElementById("task-id");
const titleInput = document.getElementById("title");
const descInput = document.getElementById("description");
const dueInput = document.getElementById("due-date");
const prioInput = document.getElementById("priority");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const listEl = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const taskCount = document.getElementById("task-count");
const priorityFilter = document.getElementById("priority-filter");

const escapeHtml = (str) =>
  str.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const isOverdue = (task) =>
  task.dueDate && !task.completed && task.dueDate < todayStr();

const todayStr = () => new Date().toISOString().slice(0, 10);

const formatDate = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function applyFilters(tasks) {
  return tasks.filter((t) => {
    if (filters.status === "active" && t.completed) return false;
    if (filters.status === "completed" && !t.completed) return false;
    if (filters.priority !== "all" && t.priority !== filters.priority)
      return false;
    return true;
  });
}

function render() {
  const all = Store.getAll();
  const visible = applyFilters(all).sort(
    (a, b) => a.completed - b.completed || b.createdAt - a.createdAt
  );

  listEl.innerHTML = "";
  visible.forEach((task) => listEl.appendChild(renderTask(task)));

  emptyState.classList.toggle("hidden", visible.length > 0);

  const activeCount = all.filter((t) => !t.completed).length;
  taskCount.textContent = `${activeCount} ${
    activeCount === 1 ? "task" : "tasks"
  } left`;
}

function renderTask(task) {
  const li = document.createElement("li");
  li.className = `task prio-${task.priority}${
    task.completed ? " completed" : ""
  }`;
  li.dataset.id = task.id;

  const due = task.dueDate
    ? `<span class="badge${isOverdue(task) ? " overdue" : ""}">📅 ${formatDate(
        task.dueDate
      )}${isOverdue(task) ? " · overdue" : ""}</span>`
    : "";

  li.innerHTML = `
    <input type="checkbox" class="task-checkbox" ${
      task.completed ? "checked" : ""
    } aria-label="Toggle complete" />
    <div class="task-body">
      <div class="task-title">${escapeHtml(task.title)}</div>
      ${
        task.description
          ? `<div class="task-desc">${escapeHtml(task.description)}</div>`
          : ""
      }
      <div class="task-meta">
        <span class="badge prio-${task.priority}">${task.priority}</span>
        ${due}
      </div>
    </div>
    <div class="task-actions">
      <button class="icon-btn" data-action="edit" aria-label="Edit" title="Edit">✏️</button>
      <button class="icon-btn" data-action="delete" aria-label="Delete" title="Delete">🗑️</button>
    </div>
  `;
  return li;
}

/* ---------- Edit mode ---------- */
function enterEditMode(task) {
  idInput.value = task.id;
  titleInput.value = task.title;
  descInput.value = task.description;
  dueInput.value = task.dueDate;
  prioInput.value = task.priority;
  submitBtn.textContent = "Save changes";
  cancelBtn.classList.remove("hidden");
  titleInput.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function exitEditMode() {
  form.reset();
  idInput.value = "";
  prioInput.value = "Medium";
  submitBtn.textContent = "Add task";
  cancelBtn.classList.add("hidden");
}

/* ---------- Events ---------- */
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = {
    title: titleInput.value.trim(),
    description: descInput.value.trim(),
    dueDate: dueInput.value,
    priority: prioInput.value,
  };
  if (!data.title) return;

  if (idInput.value) {
    Store.update(idInput.value, data);
  } else {
    Store.add(data);
  }
  exitEditMode();
  render();
});

cancelBtn.addEventListener("click", exitEditMode);

listEl.addEventListener("click", (e) => {
  const li = e.target.closest(".task");
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.classList.contains("task-checkbox")) {
    Store.toggle(id);
    render();
    return;
  }

  const action = e.target.dataset.action;
  if (action === "delete") {
    if (confirm("Delete this task?")) {
      Store.remove(id);
      render();
    }
  } else if (action === "edit") {
    const task = Store.getAll().find((t) => t.id === id);
    if (task) enterEditMode(task);
  }
});

// Status filter buttons
document.querySelectorAll('[data-filter-type="status"]').forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll('[data-filter-type="status"]')
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filters.status = btn.dataset.filter;
    render();
  });
});

// Priority filter
priorityFilter.addEventListener("change", () => {
  filters.priority = priorityFilter.value;
  render();
});

document
  .getElementById("clear-completed")
  .addEventListener("click", () => {
    Store.clearCompleted();
    render();
  });

document
  .getElementById("theme-toggle")
  .addEventListener("click", () => Theme.toggle());

/* ---------- Init ---------- */
Theme.init();
render();
