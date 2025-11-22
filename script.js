/* =========================
   Helper + State (persistence)
   ========================= */
const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));

const input = qs('#todo-input');
const addBtn = qs('#add-btn');
const listEl = qs('#todo-list');
const taskCountEl = qs('#task-count');
const completedCountEl = qs('#completed-count');
const progressBar = qs('#progress-bar');
const lastSavedEl = qs('#last-saved');

const themeToggleBtn = qs('#theme-toggle'); 
const openLoginBtn = qs('#open-login');     
const loginModal = qs('#login-modal');      
const loginCloseBtn = qs('#login-close');   
const loginDoBtn = qs('#login-do');         
const usernameInput = qs('#username-input');
const passwordInput = qs('#password-input');
const mainContent = qs('#main-content'); // Seleksi konten utama

const THEME_KEY = 'myday_theme_v1';
const TASK_KEY = 'myday_tasks_v1';
const LOGIN_KEY = 'myday_is_logged_in'; // Kunci baru untuk status login

/* Helper untuk memproses HTML */
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* load theme */
(function initTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  if(saved === 'dark') document.body.classList.add('dark-mode'), qs('#theme-toggle').textContent = '☀️';
})();

/* =========================
   LOGIKA LOGIN/LOGOUT BARU
   ========================= */
   
// Fungsi untuk membuka modal login
function openLoginModal() {
    loginModal.classList.remove('hidden');
    usernameInput.focus();
}

// Fungsi untuk menutup modal login dan mereset input
function closeLoginModal() {
    loginModal.classList.add('hidden');
    usernameInput.value = '';
    passwordInput.value = '';
}

// Fungsi Logout
function handleLogout() {
    if(!confirm('Apakah Anda yakin ingin Logout?')) return;
    localStorage.removeItem(LOGIN_KEY);
    
    mainContent.classList.add('hidden'); // Sembunyikan konten utama
    
    // Atur ulang tombol ke state 'Login'
    openLoginBtn.textContent = '🔐';
    openLoginBtn.setAttribute('title', 'Login');
    openLoginBtn.removeEventListener('click', handleLogout);
    openLoginBtn.addEventListener('click', openLoginModal);
    
    alert('Anda berhasil Logout. Konten harian disembunyikan.');
}

// Fungsi Login
function handleLogin() {
    const user = usernameInput.value.trim();
    const pass = passwordInput.value.trim();
    
    const VALID_USER = 'admin';
    const VALID_PASS = '12345';
    
    if (user === VALID_USER && pass === VALID_PASS) {
        alert(`Login Berhasil! Selamat datang, ${user}. Sekarang Anda bisa mengakses Rencana Harian.`);
        closeLoginModal(); // Tutup modal setelah login
        
        // Beri akses dan simpan status
        localStorage.setItem(LOGIN_KEY, 'true'); 
        mainContent.classList.remove('hidden'); // TAMPILKAN KONTEN UTAMA
        
        // Atur tombol ke state 'Logout'
        openLoginBtn.textContent = '🔒';
        openLoginBtn.setAttribute('title', 'Logout');
        openLoginBtn.removeEventListener('click', openLoginModal);
        openLoginBtn.addEventListener('click', handleLogout); 
        
    } else {
        alert('Login Gagal. Nama pengguna atau Kata Sandi salah. (Coba: admin / 12345)');
        passwordInput.value = ''; 
        usernameInput.focus();
    }
}

/* load tasks and check login status on startup */
let tasks = [];
(function load(){
  try{
    const raw = localStorage.getItem(TASK_KEY);
    if(raw) tasks = JSON.parse(raw);
    
    const loggedIn = localStorage.getItem(LOGIN_KEY) === 'true';

    if(loggedIn){
        mainContent.classList.remove('hidden'); // Tampilkan jika sudah login
        openLoginBtn.textContent = '🔒';
        openLoginBtn.setAttribute('title', 'Logout');
        openLoginBtn.addEventListener('click', handleLogout); // Set ke Logout handler
    } else {
        mainContent.classList.add('hidden'); // Sembunyikan jika belum login
        openLoginBtn.textContent = '🔐';
        openLoginBtn.setAttribute('title', 'Login');
        openLoginBtn.addEventListener('click', openLoginModal); // Set ke Login modal handler
    }
  }catch(e){
    tasks = [];
  }
  renderList();
})();


/* =========================
   Render / UI
   ========================= */
function renderList(){
  listEl.innerHTML = '';
  if(!tasks.length){
    // nothing — keep sidebar empty card message present
  }
  tasks.forEach((t, idx) => {
    const li = document.createElement('li');
    li.className = 'task';
    li.setAttribute('data-id', t.id);

    li.innerHTML = `
      <div class="left">
        <div class="number">${idx+1}.</div>
        <input class="checkbox" type="checkbox" ${t.done ? 'checked' : ''} aria-label="Tandai selesai">
        <div style="min-width:0">
          <div class="task-title" title="${escapeHtml(t.text)}">${escapeHtml(t.text)}</div>
          <div class="task-meta">${t.date ? t.date : ''}</div>
        </div>
      </div>
      <div class="controls">
        <button class="btn-delete" title="Hapus" aria-label="Hapus tugas">✕</button>
      </div>
    `;
    if(t.done) li.style.opacity = '0.75', li.querySelector('.task-title').style.textDecoration = 'line-through';
    listEl.appendChild(li);
  });

  updateStats();
}

function updateStats(){
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  taskCountEl.textContent = `${total} tugas`;
  completedCountEl.textContent = done;
  const pct = total ? Math.round((done/total)*100) : 0;
  progressBar.style.width = pct + '%';
  lastSavedEl.textContent = `Tersimpan terakhir: ${new Date().toLocaleString()}`;
}

function save(){
  localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
  lastSavedEl.textContent = `Tersimpan terakhir: ${new Date().toLocaleString()}`;
}

/* =========================
   Events
   ========================= */
addBtn.addEventListener('click', () => {
  const v = input.value.trim();
  if(!v) return input.focus();
  const item = {
    id: Date.now().toString(36),
    text: v,
    done: false,
    date: new Date().toLocaleDateString()
  };
  tasks.push(item);
  input.value = '';
  renderList();
  save();
});

input.addEventListener('keydown', (e) => {
  if(e.key === 'Enter') addBtn.click();
});

// delegate list clicks
listEl.addEventListener('click', (e) => {
  const li = e.target.closest('li.task');
  if(!li) return;
  const id = li.dataset.id;
  if(e.target.classList.contains('btn-delete')){
    tasks = tasks.filter(t => t.id !== id);
    renderList(); save();
    return;
  }
  if(e.target.classList.contains('checkbox')){
    const t = tasks.find(x => x.id === id);
    if(!t) return;
    t.done = e.target.checked;
    renderList(); save();
  }
});

qs('#clear-all').addEventListener('click', () => {
  if(!confirm('Hapus SEMUA tugas?')) return;
  tasks = []; renderList(); save();
});

qs('#clear-completed').addEventListener('click', () => {
  tasks = tasks.filter(t => !t.done); renderList(); save();
});

// theme toggle
themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const dark = document.body.classList.contains('dark-mode');
  qs('#theme-toggle').textContent = dark ? '☀️' : '🌙';
  localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
});

// Event listeners untuk modal login
loginCloseBtn.addEventListener('click', closeLoginModal);
loginDoBtn.addEventListener('click', handleLogin); 

// initial small accessibility focus
// Hanya fokus jika user sudah login
if(localStorage.getItem(LOGIN_KEY) === 'true') {
    input.focus();
}