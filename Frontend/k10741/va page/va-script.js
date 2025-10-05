// VA Dashboard script
// - expects trail1.json in same folder
// - relies on Google Maps API with callback initMap
// - Chart.js is used for the summary chart

let map;
let mapPolygons = []; // polygons currently on the map
let geoData = null;   // loaded trail1.json

const schemes = [
  "PM Kisan Maan Dhan Yojana",
  "PM Kisan Samman Nidhi",
  "Soil Health Card Scheme",
  "PM Fasal Bima Yojana",
  "Kisan Credit Card Scheme"
];

// ---- UI references
const menu = document.getElementById('menu');
const menuLinks = document.getElementById('menuLinks');
const schemeTilesContainer = document.getElementById('schemeTiles');
const analyticsArea = document.getElementById('analyticsArea');
const analyticsTitle = document.getElementById('analyticsTitle');
const ownersTable = document.getElementById('ownersTable');
const summaryCanvas = document.getElementById('summaryChart');
const usernameEl = document.getElementById('username');
const footerBtn = document.getElementById('footer-btn');
const footerNames = document.getElementById('footer-names');
let summaryChart = null;

// menu toggle
if (menu) {
  menu.addEventListener('click', () => {
    const showing = menuLinks.style.display === 'block';
    menuLinks.style.display = showing ? 'none' : 'block';
  });
  // hide when clicking elsewhere
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !menuLinks.contains(e.target)) {
      menuLinks.style.display = 'none';
    }
  });
}

// Footer toggle
if (footerBtn) {
  footerBtn.addEventListener('click', () => {
    footerNames.classList.toggle('hidden');
  });
}

// display logged-in VA name
const storedUser = localStorage.getItem('loggedUser');
if (usernameEl) usernameEl.textContent = storedUser ? `👋 ${storedUser.split('@')[0]}` : '';

// build scheme tiles
function buildSchemeTiles(){
  schemeTilesContainer.innerHTML = '';
  schemes.forEach(s => {
    const tile = document.createElement('div');
    tile.className = 'scheme-tile';
    tile.innerHTML = `
      <h3>${s}</h3>
      <p style="margin:0;color:rgba(8,56,14,0.8)">View coverage & eligibility analytics for this scheme.</p>
      <div class="scheme-actions">
        <button class="btn" data-scheme="${s}">View Analytics</button>
        <button class="btn-outline" data-scheme="${s}" onclick="focusScheme(event)">Focus</button>
      </div>
    `;
    schemeTilesContainer.appendChild(tile);
  });

  // attach listeners
  document.querySelectorAll('.btn[data-scheme]').forEach(b => {
    b.addEventListener('click', (e) => {
      const scheme = e.currentTarget.dataset.scheme;
      renderAnalyticsForScheme(scheme);
    });
  });
}

// optional focus (fits all polygons for scheme)
window.focusScheme = function(e){
  const scheme = e.currentTarget ? e.currentTarget.dataset.scheme : e;
  highlightSchemeOnMap(scheme, false); // draw but do not show table/chart
}

// fetch geojson
async function loadGeoJSON(){
  try {
    const res = await fetch('trail1.json');
    geoData = await res.json();
    buildSchemeTiles();
  } catch (err){
    console.error('Failed to load trail1.json', err);
    schemeTilesContainer.innerHTML = '<p style="color:red">Failed to load trail1.json</p>';
  }
}

// initialize map (Google Maps callback)
function initMap(){
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 12.795, lng: 76.512 },
    zoom: 15,
    mapTypeId: 'hybrid'
  });

  // load data
  loadGeoJSON();
}

// clear previously drawn polygons
function clearMapPolygons(){
  mapPolygons.forEach(p => p.setMap(null));
  mapPolygons = [];
}

// returns true if scheme string indicates eligible
function isEligibleText(txt){
  if (!txt) return false;
  return /eligible/i.test(txt);
}

// highlight scheme on map, populate table + chart
async function renderAnalyticsForScheme(scheme){
  if (!geoData) return;
  analyticsArea.classList.remove('hidden');
  analyticsTitle.textContent = `${scheme} — Analytics`;

  // clear old polygons
  clearMapPolygons();

  // build owner status list
  const ownerRows = [];
  let eligibleCount = 0, notEligibleCount = 0;

  // iterate features
  geoData.features.forEach(f => {
    const props = f.properties || {};
    const owner = props.Name || 'Unknown';
    const schemeInfo = props.scheme_eligibility ? props.scheme_eligibility[scheme] : null;
    const eligible = isEligibleText(schemeInfo);

    // increment counts
    if (eligible) eligibleCount++; else notEligibleCount++;

    // polygon coords expected as [ [ [lon,lat], ... ] ]
    const rings = f.geometry && f.geometry.coordinates ? f.geometry.coordinates : [];
    // For each ring, draw polygon
    rings.forEach(ring => {
      const coords = ring.map(c => ({ lat: c[1], lng: c[0] }));
      const polygon = new google.maps.Polygon({
        paths: coords,
        strokeColor: '#000000',
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: eligible ? '#90EE90' : '#F08080', // lightgreen / lightcoral
        fillOpacity: 0.5,
      });
      polygon.setMap(map);
      mapPolygons.push(polygon);
    });

    ownerRows.push({ owner, eligible: eligible ? 'Eligible' : 'Not Eligible' });
  });

  // fit map to all polygons
  const bounds = new google.maps.LatLngBounds();
  mapPolygons.forEach(p => {
    p.getPath().forEach(pt => bounds.extend(pt));
  });
  if (!bounds.isEmpty) map.fitBounds(bounds);

  // populate owners table (scrollable)
  ownersTable.innerHTML = '';
  ownerRows.forEach(r => {
    const row = document.createElement('div');
    row.className = 'table-row';
    const left = document.createElement('div');
    left.textContent = r.owner;
    const right = document.createElement('div');
    right.textContent = r.eligible;
    right.style.fontWeight = '700';
    right.style.color = r.eligible === 'Eligible' ? '#1b5e20' : '#b71c1c';
    row.appendChild(left);
    row.appendChild(right);
    ownersTable.appendChild(row);
  });

  // draw bar chart summary (eligible vs not)
  drawSummaryChart(eligibleCount, notEligibleCount);
}

// wrapper if you want to draw scheme but not show table/chart (focus)
function highlightSchemeOnMap(scheme){
  // simply re-use renderAnalyticsForScheme but can hide html parts if needed
  renderAnalyticsForScheme(scheme);
}

// draw chart
function drawSummaryChart(eligibleCount, notEligibleCount){
  const ctx = summaryCanvas.getContext('2d');
  if (summaryChart) { summaryChart.destroy(); summaryChart = null; }

  summaryChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Eligible', 'Not Eligible'],
      datasets: [{
        label: 'Plots count',
        data: [eligibleCount, notEligibleCount],
        backgroundColor: ['#90EE90', '#F08080'],
        borderColor: ['#2e7d32', '#b71c1c'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, precision:0 }
      },
      plugins: { legend: { display: false } }
    }
  });
}

// load JSON on script run
loadGeoJSON();

// export initMap to global for Google Maps callback
window.initMap = initMap;
