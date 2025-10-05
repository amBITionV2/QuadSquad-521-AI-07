function toggleMenu() {
  const menu = document.getElementById("menu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

async function initMap() {
  const center = { lat: 12.782, lng: 76.512 };
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 17,
    center: center,
    mapTypeId: "satellite",
  });

  const tableBody = document.getElementById("tableBody");
  const chartLabels = [];
  const chartValues = [];
  const polygonsMap = {}; // ✅ store polygons by owner name

  try {
    const response = await fetch("trail1.json");
    const geoData = await response.json();

    geoData.features.forEach(feature => {
      const props = feature.properties;
      if (props.for_sale === "true") {
        const geomType = feature.geometry.type;
        const geomCoords = feature.geometry.coordinates;

        // ✅ Handle both Polygon and MultiPolygon
        let polygons = [];
        if (geomType === "Polygon") polygons.push(geomCoords);
        else if (geomType === "MultiPolygon") polygons = geomCoords;

        polygons.forEach(polygonCoords => {
          const coords = polygonCoords[0].map(c => ({ lat: c[1], lng: c[0] }));

          const polygon = new google.maps.Polygon({
            paths: coords,
            strokeColor: "#000000",
            strokeWeight: 1.2,
            fillColor: "#C9A7EB",
            fillOpacity: 0.6,
          });
          polygon.setMap(map);

          // ✅ Store for later focusing
          if (!polygonsMap[props.Name]) polygonsMap[props.Name] = [];
          polygonsMap[props.Name].push(polygon);

          // InfoWindow
          const infoWindow = new google.maps.InfoWindow();
          polygon.addListener("click", () => {
            let schemesHtml = "<strong>Eligible Schemes:</strong><ul>";
            if (props.scheme_eligibility) {
              for (const [scheme, eligible] of Object.entries(props.scheme_eligibility)) {
                schemesHtml += `<li>${scheme}: ${eligible}</li>`;
              }
            } else {
              schemesHtml += "<li>No scheme data available.</li>";
            }
            schemesHtml += "</ul>";

            infoWindow.setContent(
              `<div>
                <strong>Owner:</strong> ${props.Name}<br>
                ${schemesHtml}
              </div>`
            );
            infoWindow.setPosition(coords[0]);
            infoWindow.open(map);
          });
        });

        // Calculate price
        const area = props.area_acres_recalculated || 0;
        const price = area * 5300000;

        // ✅ Create clickable table row
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${props.Name}</td>
          <td>${area.toFixed(2)}</td>
          <td>₹${price.toLocaleString()}</td>
        `;
        row.style.cursor = "pointer";
        row.addEventListener("click", () => focusOwner(props.Name)); // ✅ zoom when clicked
        tableBody.appendChild(row);

        // Chart
        chartLabels.push(props.Name);
        chartValues.push(area);
      }
    });

    // Bar chart
    new Chart(document.getElementById("barChart"), {
      type: "bar",
      data: {
        labels: chartLabels,
        datasets: [{
          label: "Land Area (acres)",
          data: chartValues,
          backgroundColor: "#C9A7EB",
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });

    // ✅ Function to zoom/focus a particular owner’s plot
    function focusOwner(ownerName) {
      if (!polygonsMap[ownerName]) return;
      const bounds = new google.maps.LatLngBounds();

      // Reset all polygon styles first
      Object.values(polygonsMap).flat().forEach(poly => {
        poly.setOptions({ strokeWeight: 1.2, fillOpacity: 0.6 });
      });

      // Highlight selected owner's polygons
      polygonsMap[ownerName].forEach(poly => {
        poly.getPath().forEach(latlng => bounds.extend(latlng));
        poly.setOptions({ strokeWeight: 3, fillOpacity: 0.9 });
      });

      map.fitBounds(bounds);
    }

  } catch (err) {
    console.error("Error loading trail1.json:", err);
  }
}
