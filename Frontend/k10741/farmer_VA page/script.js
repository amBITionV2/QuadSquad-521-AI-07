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

// Simulated validation and redirection
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

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
    localStorage.setItem('loggedUser', name);

    msg.textContent = '✅ Redirecting...';
    setTimeout(() => (window.location.href = 'index.html'), 1000);
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value.trim();
    const name = document.getElementById('signup-name').value.trim();
    const password = document.getElementById('signup-password').value.trim();

    if (!name || !validateEmail(email) || !password) {
      msg.textContent = '❌ Please fill all fields correctly';
      return;
    }
    localStorage.setItem('loggedUser', name);

    msg.textContent = '✅ Account created! Redirecting...';
    setTimeout(() => (window.location.href = 'index.html'), 1000);
  });
}
// ---------------- MENU TOGGLE ----------------
const menu = document.getElementById('menu');
const menuLinks = document.getElementById('menuLinks');
if (menu) {
  menu.addEventListener('click', () => {
    menuLinks.style.display =
      menuLinks.style.display === 'block' ? 'none' : 'block';
  });
}

// ---------------- USERNAME DISPLAY ----------------
const usernameEl = document.getElementById('username');
const storedUser = localStorage.getItem('loggedUser');
if (usernameEl && storedUser) {
  usernameEl.textContent = `👋 Welcome, ${storedUser}`;
}

// ---------------- GOOGLE MAP INITIALIZATION ----------------
let map;

async function initMap() {
  // Initialize Map
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 12.795, lng: 76.512 },
    zoom: 16,
    mapTypeId: "hybrid",
  });

  // Load GeoJSON file
  const response = await fetch("trail1.json");
  const data = await response.json();

  const userName = storedUser ? storedUser.toLowerCase() : null;
  const features = data.features.filter(
    (f) => f.properties.Name.toLowerCase() === userName
  );

  // If user has plots, show them
  if (features.length > 0) {
    features.forEach((feature) => {
      const coords = feature.geometry.coordinates[0].map(c => ({ lat: c[1], lng: c[0] }));
      const polygon = new google.maps.Polygon({
        paths: coords,
        strokeColor: "#000000",
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: "#FFB6C1",
        fillOpacity: 0.5,
      });
      polygon.setMap(map);

      // Fit map bounds
      const bounds = new google.maps.LatLngBounds();
      coords.forEach(c => bounds.extend(c));
      map.fitBounds(bounds);

      // Populate info panel
      displayLandInfo(feature.properties);
    });
  } else {
    document.getElementById("landInfo").innerHTML =
      `<p>No land found for <strong>${userName}</strong>.</p>`;
  }
}

// ---------------- DISPLAY SCHEME INFO ----------------
function displayLandInfo(properties) {
  const container = document.getElementById("landInfo");

  let html = `
    <div class="scheme-card">
      <h3>${properties.Name}</h3>
      <p><strong>Area:</strong> ${properties.area_acres_recalculated.toFixed(2)} acres</p>
      <h4>Scheme Eligibility:</h4>
      <ul>
  `;

  for (let scheme in properties.scheme_eligibility) {
    html += `<li>${scheme}: ${properties.scheme_eligibility[scheme]}</li>`;
  }

  html += `</ul></div>`;

  container.innerHTML += html;
}
