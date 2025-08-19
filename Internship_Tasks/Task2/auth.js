// auth.js

async function signup(name, email, password) {
  const users = readLS(LS_KEYS.USERS, []);
  const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) throw new Error('Email already registered');
  const passwordHash = await hash(password);
  const user = { id: uid('user'), name, email, passwordHash, createdAt: Date.now() };
  users.push(user);
  writeLS(LS_KEYS.USERS, users);
  writeLS(LS_KEYS.SESS, { userId: user.id });
  return user;
}

async function login(email, password) {
  const users = readLS(LS_KEYS.USERS, []);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error('Invalid credentials');
  const passwordHash = await hash(password);
  if (user.passwordHash !== passwordHash) throw new Error('Invalid credentials');
  writeLS(LS_KEYS.SESS, { userId: user.id });
  return user;
}

function currentUser() {
  const sess = readLS(LS_KEYS.SESS, null);
  if (!sess) return null;
  const users = readLS(LS_KEYS.USERS, []);
  return users.find(u => u.id === sess.userId) || null;
}

function logout() { localStorage.removeItem(LS_KEYS.SESS); }

// Wire up index.html
document.addEventListener('DOMContentLoaded', () => {
  const isDashboard = location.pathname.endsWith('dashboard.html');

  if (!isDashboard) {
    const signupSection = document.getElementById('signup-section');
    const loginSection = document.getElementById('login-section');
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const gotoLogin = document.getElementById('goto-login');
    const gotoSignup = document.getElementById('goto-signup');
    const signupBtn = document.getElementById('signup-btn');
    const loginBtn = document.getElementById('login-btn');

    function showLogin() {
      signupSection.style.display = 'none';
      loginSection.style.display = 'block';
      tabLogin.classList.add('btn-primary'); tabLogin.classList.remove('btn-outline');
      tabSignup.classList.add('btn-outline'); tabSignup.classList.remove('btn-primary');
    }
    function showSignup() {
      loginSection.style.display = 'none';
      signupSection.style.display = 'block';
      tabSignup.classList.add('btn-primary'); tabSignup.classList.remove('btn-outline');
      tabLogin.classList.add('btn-outline'); tabLogin.classList.remove('btn-primary');
    }
    tabLogin?.addEventListener('click', showLogin);
    tabSignup?.addEventListener('click', showSignup);
    gotoLogin?.addEventListener('click', (e)=>{ e.preventDefault(); showLogin(); });
    gotoSignup?.addEventListener('click', (e)=>{ e.preventDefault(); showSignup(); });

    signupBtn?.addEventListener('click', async () => {
      const name = document.getElementById('su-name').value.trim();
      const email = document.getElementById('su-email').value.trim();
      const pass = document.getElementById('su-pass').value;
      if (!name || !email || !pass) return alert('Fill all fields');
      try {
        await signup(name, email, pass);
        location.href = 'dashboard.html';
      } catch (e) { alert(e.message); }
    });

    loginBtn?.addEventListener('click', async () => {
      const email = document.getElementById('li-email').value.trim();
      const pass = document.getElementById('li-pass').value;
      if (!email || !pass) return alert('Fill all fields');
      try {
        await login(email, pass);
        location.href = 'dashboard.html';
      } catch (e) { alert(e.message); }
    });
  } else {
    // dashboard session guard
    const user = currentUser();
    if (!user) { location.href = 'index.html'; return; }
    document.getElementById('current-user').textContent = user.name;
    document.getElementById('logout-btn').addEventListener('click', () => {
      logout();
      location.href = 'index.html';
    });
  }
});
