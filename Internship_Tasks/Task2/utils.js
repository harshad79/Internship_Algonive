// utils.js

// Namespaces for localStorage keys
const LS_KEYS = {
  USERS: 'tt_users',
  SESS: 'tt_session',
  TASKS: 'tt_tasks'
};

function readLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function writeLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function uid(prefix='id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
}
function todayISO() { return new Date().toISOString().split('T')[0]; }
function parseISO(dateStr) { return new Date(dateStr + 'T00:00:00'); }
function daysUntil(dateStr) {
  const now = new Date();
  const due = parseISO(dateStr);
  return Math.ceil((due - now) / (1000*60*60*24));
}
function classifyDue(dateStr) {
  const d = daysUntil(dateStr);
  if (isNaN(d)) return 'ok';
  if (d < 0) return 'overdue';
  if (d <= 1) return 'soon';
  return 'ok';
}

// Simple password hashing (not secure; for demo only)
async function hash(str) {
  const enc = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

// Notifications (optional)
async function notify(title, body) {
  try {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') new Notification(title, { body });
    }
  } catch {}
}
