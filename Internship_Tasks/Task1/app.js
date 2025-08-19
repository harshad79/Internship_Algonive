let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let filter = 'all';

function saveTasks() { localStorage.setItem('tasks', JSON.stringify(tasks)); }

const taskForm = document.getElementById('taskForm');
const tasksDiv = document.getElementById('tasks');
const filterButtons = document.querySelectorAll('.filters button');

document.addEventListener('DOMContentLoaded', () => {
  // Prevent past dates
  document.getElementById('dueDate').setAttribute('min', new Date().toISOString().split('T')[0]);
  renderTasks();
});

taskForm.onsubmit = (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const dueDate = document.getElementById('dueDate').value;
  if (!title || !description || !dueDate) return;

  const editingId = taskForm.dataset.editing;
  if (editingId) {
    const task = tasks.find(t => t.id === editingId);
    if (task) {
      task.title = title;
      task.description = description;
      task.dueDate = dueDate;
    }
    delete taskForm.dataset.editing;
    taskForm.querySelector('button[type="submit"]').textContent = 'Add Task';
  } else {
    tasks.push({
      id: Date.now().toString(),
      title,
      description,
      dueDate,
      completed: false,
      createdAt: Date.now()
    });
  }
  saveTasks();
  renderTasks();
  taskForm.reset();
};

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  document.getElementById('title').value = task.title;
  document.getElementById('description').value = task.description;
  document.getElementById('dueDate').value = task.dueDate;
  taskForm.dataset.editing = id;
  taskForm.querySelector('button[type="submit"]').textContent = 'Update Task';
}

function toggleComplete(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  if (!confirm(`Delete "${task.title}"?`)) return;
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    filter = button.dataset.filter;
    renderTasks();
  });
});

function getDueStatus(task) {
  const now = new Date();
  const due = new Date(task.dueDate + 'T23:59:59');
  const diffMs = due - now;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 1) return 'due-soon';
  return 'ok';
}

function checkReminders() {
  const dueSoon = tasks.filter(t => !t.completed && getDueStatus(t) === 'due-soon');
  if (dueSoon.length > 0) {
    const names = dueSoon.slice(0, 3).map(t => `“${t.title}”`).join(', ');
    const extra = dueSoon.length > 3 ? ` and ${dueSoon.length - 3} more` : '';
    alert(`Reminder: ${names}${extra} due within 24 hours.`);
  }
}

function renderTasks() {
  tasksDiv.innerHTML = '';
  const visible = tasks.filter(t => {
    if (filter === 'complete') return t.completed;
    if (filter === 'incomplete') return !t.completed;
    return true;
  });

  visible.sort((a, b) => {
    const aDue = new Date(a.dueDate).getTime();
    const bDue = new Date(b.dueDate).getTime();
    if (a.completed !== b.completed) return a.completed - b.completed;
    return aDue - bDue;
  });

  visible.forEach(task => {
    const status = getDueStatus(task);
    const card = document.createElement('div');
    card.className = `task ${task.completed ? 'completed' : ''} ${status !== 'ok' ? status : ''}`;

    const header = document.createElement('div');
    header.className = 'task-header';

    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = task.title;

    const meta = document.createElement('div');
    meta.className = 'task-meta';
    const dueEl = document.createElement('span');
    dueEl.textContent = `Due: ${new Date(task.dueDate).toLocaleDateString()}`;
    const stateEl = document.createElement('span');
    if (task.completed) stateEl.textContent = 'Completed';
    else if (status === 'overdue') stateEl.textContent = 'Overdue';
    else if (status === 'due-soon') stateEl.textContent = 'Due soon';
    else stateEl.textContent = 'Scheduled';

    meta.appendChild(dueEl);
    meta.appendChild(stateEl);

    header.appendChild(title);
    header.appendChild(meta);

    const desc = document.createElement('div');
    desc.className = 'task-desc';
    desc.textContent = task.description;

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle';
    toggleBtn.textContent = task.completed ? 'Mark Incomplete' : 'Mark Complete';
    toggleBtn.onclick = () => toggleComplete(task.id);

    const editBtn = document.createElement('button');
    editBtn.className = 'edit';
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => editTask(task.id);

    const delBtn = document.createElement('button');
    delBtn.className = 'delete';
    delBtn.textContent = 'Delete';
    delBtn.onclick = () => deleteTask(task.id);

    actions.appendChild(toggleBtn);
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    card.appendChild(header);
    card.appendChild(desc);
    card.appendChild(actions);

    tasksDiv.appendChild(card);
  });

  checkReminders();
}