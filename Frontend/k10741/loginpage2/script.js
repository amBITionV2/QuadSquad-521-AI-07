// Footer toggle
const btn = document.getElementById('footer-btn');
const names = document.getElementById('footer-names');
if (btn) {
  btn.addEventListener('click', () => names.classList.toggle('hidden'));
}

// Sidebar toggle
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
if (menuToggle) {
  menuToggle.addEventListener('click', () => sidebar.classList.toggle('hidden'));
}

// Tab switching (login/signup)
const loginTab = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const msg = document.getElementById('message');

if (loginTab && signupTab) {
  loginTab.addEventListener('click', () => {
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
  });

  signupTab.addEventListener('click', () => {
    signupForm.classList.add('active');
    loginForm.classList.remove('active');
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
  });
}

// Email validation
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Login form handling
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!validateEmail(email)) {
      msg.textContent = '❌ Please enter a valid email';
      return;
    }
    if (!password) {
      msg.textContent = '⚠️ Please enter your password';
      return;
    }

    // Temporarily use the email prefix as name (until backend)
    const userName = email.split('@')[0];
    localStorage.setItem('loggedUser', userName);

    msg.textContent = '✅ Redirecting...';
    setTimeout(() => {
      window.location.href = '../va page/va_dashboard.html';
    }, 1000);
  });
}

// Signup form handling
if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();

    if (!name || !validateEmail(email) || !password) {
      msg.textContent = '❌ Please fill all fields correctly';
      return;
    }

    localStorage.setItem('loggedUser', name);

    msg.textContent = '✅ Account created! Redirecting...';
    setTimeout(() => {
      window.location.href = '../va page/va_dashboard.html';
    }, 1000);
  });
}
