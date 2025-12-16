// Simple interactions: highlight active menu and handle upload CTA
document.querySelectorAll('.menu-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.menu-item').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

const uploadAction = document.getElementById('uploadAction');
if (uploadAction) {
  uploadAction.addEventListener('click', () => {
    alert('Upload action triggered. Connect this to your upload flow.');
  });
}

// =====================
// Profile name/avatar from stored username
// =====================
const storedUsername = localStorage.getItem('username');
const profileNameEl = document.getElementById('profileName');
const avatarEl = document.getElementById('avatar');
if (storedUsername) {
  profileNameEl.textContent = storedUsername;
  const initial = storedUsername.trim().charAt(0).toUpperCase() || 'S';
  avatarEl.textContent = initial;
}

// =====================
// Theme switching
// =====================
const themePills = document.querySelectorAll('.pill');
const themeMap = {
  light: {
    '--bg': '#fdfaf5',
    '--card': '#ffffff',
    '--primary': '#f7b731',
    '--primary-strong': '#e3a020',
    '--accent': '#ffdca4',
    '--text': '#2f2f2f',
    '--muted': '#6f6f6f',
    '--shadow': '0 12px 30px rgba(0, 0, 0, 0.08)'
  },
  grey: {
    '--bg': '#f4f4f6',
    '--card': '#ffffff',
    '--primary': '#f2b45a',
    '--primary-strong': '#d89c45',
    '--accent': '#f2d7a6',
    '--text': '#2f2f2f',
    '--muted': '#6a6a6a',
    '--shadow': '0 10px 24px rgba(0, 0, 0, 0.08)'
  },
  dark: {
    '--bg': '#1f1f24',
    '--card': '#2a2a30',
    '--primary': '#f7b731',
    '--primary-strong': '#e3a020',
    '--accent': '#3b2d16',
    '--text': '#f5f5f5',
    '--muted': '#b0b0b5',
    '--shadow': '0 12px 30px rgba(0, 0, 0, 0.45)'
  }
};

function applyTheme(name) {
  const theme = themeMap[name] || themeMap.light;
  Object.entries(theme).forEach(([k, v]) => {
    document.documentElement.style.setProperty(k, v);
  });
  localStorage.setItem('sellerTheme', name);
  themePills.forEach(p => p.classList.toggle('active', p.dataset.theme === name));
}

const savedTheme = localStorage.getItem('sellerTheme') || 'light';
applyTheme(savedTheme);

themePills.forEach(pill => {
  pill.addEventListener('click', () => applyTheme(pill.dataset.theme));
});

// =====================
// Settings toggles (mock)
// =====================
const notifyToggle = document.getElementById('notifyToggle');
if (notifyToggle) {
  const saved = localStorage.getItem('sellerNotify');
  if (saved !== null) notifyToggle.checked = saved === 'true';
  notifyToggle.addEventListener('change', () => {
    localStorage.setItem('sellerNotify', notifyToggle.checked ? 'true' : 'false');
  });
}

