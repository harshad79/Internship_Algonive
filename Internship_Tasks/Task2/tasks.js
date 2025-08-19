// tasks.js

// Task shape:
// { id, title, desc, assigneeId, due, status: 'pending'|'in_progress'|'completed', createdBy, createdAt, updatedAt }

const TASK_STATUSES = ['pending','in_progress','completed'];

function getTasks(){ return readLS(LS_KEYS.TASKS, []); }
function setTasks(list){ writeLS(LS_KEYS.TASKS, list); }

function listUsers(){ return readLS(LS_KEYS.USERS, []); }

function createTask(data){
  const user = currentUser();
  const t = {
    id: uid('task'),
    title: data.title.trim(),
    desc: data.desc.trim(),
    assigneeId: data.assigneeId,
    due: data.due,
    status: data.status || 'pending',
    createdBy: user.id,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  const tasks = getTasks();
  tasks.push(t);
  setTasks(tasks);
  return t;
}

function updateTask(id, patch){
  const tasks = getTasks();
  const i = tasks.findIndex(t => t.id === id);
  if (i === -1) return null;
  tasks[i] = { ...tasks[i], ...patch, updatedAt: Date.now() };
  setTasks(tasks);
  return tasks[i];
}

function deleteTask(id){
  const tasks = getTasks().filter(t => t.id !== id);
  setTasks(tasks);
}

function userName(userId){
  const u = listUsers().find(x => x.id === userId);
  return u ? u.name : 'Unknown';
}

function renderAssigneeOptions(){
  const sel = document.getElementById('task-assignee');
  const filterSel = document.getElementById('filter-assignee');
  const users = listUsers();
  sel.innerHTML = users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
  filterSel.innerHTML = `<option value="all">All assignees</option>` + users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
  // default to current user
  const me = currentUser();
  if (me) sel.value = me.id;
}

function renderTasks(){
  const listEl = document.getElementById('tasks-list');
  const statusFilter = document.getElementById('filter-status').value;
  const assigneeFilter = document.getElementById('filter-assignee').value;
  const q = document.getElementById('filter-search').value.trim().toLowerCase();

  let items = getTasks();

  if (statusFilter !== 'all') items = items.filter(t => t.status === statusFilter);
  if (assigneeFilter !== 'all') items = items.filter(t => t.assigneeId === assigneeFilter);
  if (q) items = items.filter(t => t.title.toLowerCase().includes(q));

  // sort: incomplete first, then due date asc
  items.sort((a,b) => {
    const aDone = a.status === 'completed', bDone = b.status === 'completed';
    if (aDone !== bDone) return aDone - bDone;
    return (new Date(a.due)) - (new Date(b.due));
  });

  listEl.innerHTML = '';
  const frag = document.createDocumentFragment();

  items.forEach(t => {
    const dueClass = classifyDue(t.due); // ok | soon | overdue
    const card = document.createElement('div');
    card.className = `task-card ${dueClass}`;

    const header = document.createElement('div');
    header.className = 'row';
    header.innerHTML = `
      <div><strong>${t.title}</strong><div class="small">Assigned to: ${userName(t.assigneeId)}</div></div>
      <div style="text-align:right">
        <span class="badge">${STATUS_LABEL[t.status]}</span>
      </div>
    `;

    const body = document.createElement('div');
    body.className = 'grid';
    body.style.gap = '6px';
    body.innerHTML = `
      <div>${t.desc || ''}</div>
      <div class="small">Due: ${new Date(t.due).toLocaleDateString()}</div>
    `;

    const actions = document.createElement('div');
    actions.className = 'kit';
    const statusSel = document.createElement('select');
    statusSel.className = 'status-select';
    TASK_STATUSES.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = STATUS_LABEL[s];
      if (s === t.status) opt.selected = true;
      statusSel.appendChild(opt);
    });
    statusSel.addEventListener('change', () => {
      updateTask(t.id, { status: statusSel.value });
      renderTasks();
    });

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-outline';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => loadTaskIntoForm(t.id));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-danger';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
      if (confirm(`Delete "${t.title}"?`)) {
        deleteTask(t.id);
        renderTasks();
        updateSummary();
      }
    });

    actions.appendChild(statusSel);
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(actions);
    frag.appendChild(card);
  });

  listEl.appendChild(frag);
  updateSummary();
}

function updateSummary(){
  const all = getTasks();
  const pending = all.filter(t => t.status === 'pending').length;
  const inprog = all.filter(t => t.status === 'in_progress').length;
  const done = all.filter(t => t.status === 'completed').length;
  document.getElementById('summary').textContent =
    `Total: ${all.length} • Pending: ${pending} • In progress: ${inprog} • Completed: ${done}`;
}

function resetForm(){
  document.getElementById('task-title').value = '';
  document.getElementById('task-desc').value = '';
  document.getElementById('task-due').value = '';
  document.getElementById('task-status').value = 'pending';
  document.getElementById('form-mode').textContent = '';
  delete document.getElementById('create-task-btn').dataset.editing;
}

function loadTaskIntoForm(id){
  const t = getTasks().find(x => x.id === id);
  if (!t) return;
  document.getElementById('task-title').value = t.title;
  document.getElementById('task-desc').value = t.desc;
  document.getElementById('task-due').value = t.due;
  document.getElementById('task-status').value = t.status;
  document.getElementById('task-assignee').value = t.assigneeId;
  const btn = document.getElementById('create-task-btn');
  btn.dataset.editing = id;
  document.getElementById('form-mode').textContent = 'Editing task';
}

function wireDashboard(){
  // guard
  const me = currentUser();
  if (!me) { location.href = 'index.html'; return; }

  renderAssigneeOptions();
  document.getElementById('task-due').setAttribute('min', todayISO());

  document.getElementById('create-task-btn').addEventListener('click', () => {
    const title = document.getElementById('task-title').value.trim();
    const desc = document.getElementById('task-desc').value.trim();
    const assigneeId = document.getElementById('task-assignee').value;
    const due = document.getElementById('task-due').value;
    const status = document.getElementById('task-status').value;

    if (!title || !assigneeId || !due) return alert('Title, assignee and due date are required');

    const btn = document.getElementById('create-task-btn');
    const editingId = btn.dataset.editing;

    if (editingId) {
      updateTask(editingId, { title, desc, assigneeId, due, status });
      btn.removeAttribute('data-editing');
      document.getElementById('form-mode').textContent = '';
    } else {
      createTask({ title, desc, assigneeId, due, status });
    }

    resetForm();
    renderTasks();
  });

  document.getElementById('reset-form-btn').addEventListener('click', resetForm);

  document.getElementById('filter-status').addEventListener('change', renderTasks);
  document.getElementById('filter-assignee').addEventListener('change', renderTasks);
  document.getElementById('filter-search').addEventListener('input', renderTasks);

  renderTasks();
  scheduleReminders();
}

function scheduleReminders(){
  // Notify soon/overdue tasks on load and hourly
  function run() {
    const me = currentUser();
    const myTasks = getTasks().filter(t => t.assigneeId === me.id && t.status !== 'completed');
    const soon = myTasks.filter(t => classifyDue(t.due) === 'soon');
    const overdue = myTasks.filter(t => classifyDue(t.due) === 'overdue');

    soon.slice(0,3).forEach(t => notify('Task due soon', `${t.title} due ${new Date(t.due).toLocaleDateString()}`));
    overdue.slice(0,3).forEach(t => notify('Task overdue', `${t.title} was due ${new Date(t.due).toLocaleDateString()}`));
  }
  run();
  setInterval(run, 60*60*1000);
}

document.addEventListener('DOMContentLoaded', wireDashboard);
