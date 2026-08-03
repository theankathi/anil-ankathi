# Task Manager

A simple, dependency-free task manager web app built with **HTML, CSS, and vanilla JavaScript**. Tasks are saved in your browser's `localStorage`, so they survive page refreshes.

## Features

- ➕ Add tasks with a title, optional description, due date, and priority (Low / Medium / High)
- ✅ Mark tasks complete / incomplete
- ✏️ Edit and 🗑️ delete tasks
- 🔍 Filter by status (All / Active / Completed) and by priority
- 📅 Overdue due-dates are highlighted
- 💾 Automatic persistence via `localStorage`
- 🌙 Light / dark theme toggle (remembered between visits)
- 📱 Responsive layout for desktop and mobile

## Project structure

```
task-manager/
├── index.html   # markup
├── styles.css   # styling + light/dark themes
├── app.js       # data layer (Store) kept separate from the render/UI layer
└── README.md
```

The JavaScript separates concerns:
- **`Store`** — all data operations (load/save/add/update/remove/toggle) against `localStorage`.
- **`Theme`** — theme state and persistence.
- **View/controller** — reads from `Store`, renders the DOM, and wires up events.

## How to run

No build step or server required.

1. Open `task-manager/index.html` directly in any modern browser, **or**
2. Serve it locally, e.g.:
   ```bash
   cd task-manager
   python -m http.server 8000
   # then visit http://localhost:8000
   ```

## Done when ✔

Open `index.html`, add / edit / complete / delete tasks, refresh the page — your tasks are still there.
