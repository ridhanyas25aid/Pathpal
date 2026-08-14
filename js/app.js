/**
 * Path Pal AI - Main Application Controller
 * Handles Leaflet Map rendering, Tamil Nadu GeoJSON boundary overlays,
 * Crime & Streetlight Heatmaps, dynamic Nominatim search bindings,
 * user geolocation tracking, hazard report modals, and OSRM calculations.
 * Fully optimized for smooth panning and rendering.
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Leaflet Map centered on Tamil Nadu (State View)
  const map = L.map("map", {
    center: [11.1271, 78.6569], // Centered on Tamil Nadu
    zoom: 7,
    zoomControl: false
  });

  // Position zoom controls in top right
  L.control.zoom({ position: "topright" }).addTo(map);

  // Map Tile Layers (CartoDB Dark Matter & OpenStreetMap Standard)
  const darkTileLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  });

  const lightTileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  });

  darkTileLayer.addTo(map);

  // Layer Feature Groups
  const geojsonLayerGroup = L.layerGroup().addTo(map);
  const streetlightLayerGroup = L.layerGroup().addTo(map);
  const crimeLayerGroup = L.layerGroup().addTo(map);
  const routesLayerGroup = L.layerGroup().addTo(map);
  const heatLayerGroup = L.layerGroup().addTo(map);
  const liveLocationLayerGroup = L.layerGroup().addTo(map);

  // Map Report Manager reference
  window.Report.setMap(map);

  // Preset Tamil Nadu Route corridors
  const presetTamilNaduRoutes = [
    {
      name: "Chennai (Central) ➔ Coimbatore (Gandhipuram)",
      start: [13.0827, 80.2707],
      end: [11.0168, 76.9689]
    },
    {
      name: "Madurai (Meenakshi Temple) ➔ Trichy (Rockfort)",
      start: [9.9195, 78.1193],
      end: [10.8282, 78.6946]
    },
    {
      name: "Salem (Junction) ➔ Chennai (Central)",
      start: [11.6643, 78.1460],
      end: [13.0827, 80.2707]
    },
    {
      name: "Coimbatore ➔ Ooty (Hill Station Corridor)",
      start: [11.0168, 76.9689],
      end: [11.4102, 76.6950]
    }
  ];

  // State Management
  let activeNightMode = true;
  let customStartPt = null;
  let customEndPt = null;
  let mapPickingMode = null; // 'start' or 'end'
  
  // Active Route State
  let activeRoute = null;
  let selectedRouteType = 'safest'; // 'safest' or 'fastest'
  let fastestPolyline = null;
  let safestPolyline = null;
  
  // Datasets Storage
  let rawStreetlights = [];
  let rawCrimes = [];
  let approvedReports = [];

  // Heatmap layer variables
  let crimeHeatLayer = null;
  let lightHeatLayer = null;

  // Geolocation tracking variables
  let liveWatchId = null;
  let liveUserCoords = null;
  let liveUserMarker = null;

  // --- Dynamic Dataset Loading ---
  console.log("Loading Tamil Nadu dynamic spatial datasets...");
  
  Promise.all([
    fetch("data/streetlights.json").then(res => {
      if (!res.ok) throw new Error("Streetlights JSON not found");
      return res.json();
    }),
    fetch("data/tamilnadu_real_crime.json").then(res => {
      if (!res.ok) throw new Error("Crime database JSON not found");
      return res.json();
    }),
    fetch("data/tamilnadu.geojson").then(res => {
      if (!res.ok) throw new Error("Tamil Nadu boundary GeoJSON not found");
      return res.json();
    })
  ])
  .then(([streetlights, crimes, tnGeoJson]) => {
    rawStreetlights = streetlights;
    rawCrimes = crimes;

    // Load Tamil Nadu Boundary GeoJSON
    L.geoJSON(tnGeoJson, {
      style: {
        color: "#3b82f6",
        weight: 2,
        opacity: 0.8,
        fillColor: "#1e3a8a",
        fillOpacity: 0.03
      }
    }).addTo(geojsonLayerGroup);

    // Fetch approved safety reports from Firestore database
    db.collection("reports").where("status", "==", "Approved").onSnapshot((snapshot) => {
      approvedReports = [];
      snapshot.forEach(doc => {
        approvedReports.push({ id: doc.id, ...doc.data() });
      });

      // Synchronize Routing Engine with the dynamic datasets
      window.RoutingEngine.setDatasets(rawStreetlights, rawCrimes, approvedReports);

      // Render layers
      renderStreetlights();
      renderCrimeIncidents();
      initializeHeatmaps();

      // Trigger default routing scenario on load
      triggerDefaultRoute();
    }, (error) => {
      console.warn("Firestore reports fetch failed (likely offline/bypass):", error);
      approvedReports = [];
      window.RoutingEngine.setDatasets(rawStreetlights, rawCrimes, approvedReports);
      renderStreetlights();
      renderCrimeIncidents();
      initializeHeatmaps();
      triggerDefaultRoute();
    });
  })
  .catch(err => {
    console.error("Critical error loading spatial databases:", err);
    alert("Error loading Map Datasets: check local server paths.");
  });

  // --- Render Streetlight markers (Optimized with Viewport Culling & Caps) ---
  function renderStreetlights() {
    streetlightLayerGroup.clearLayers();
    if (!document.getElementById("toggle-streetlights").checked) return;

    const currentZoom = map.getZoom();
    if (currentZoom < 15) return; // Only render individual streetlight pins when zoomed in very close (street-level)

    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const minLat = sw.lat, maxLat = ne.lat;
    const minLng = sw.lng, maxLng = ne.lng;

    let renderCount = 0;
    const maxRenderLimit = 150; // Cap to prevent DOM bloating and lag

    for (let i = 0; i < rawStreetlights.length; i++) {
      if (renderCount >= maxRenderLimit) break;

      const sl = rawStreetlights[i];
      const slLat = sl[0];
      const slLng = sl[1];

      // Viewport Culling using fast numerical bounds check (No object allocation)
      if (slLat >= minLat && slLat <= maxLat && slLng >= minLng && slLng <= maxLng) {
        renderCount++;
        const isWorking = sl[2] >= 0.75;
        const statusStr = isWorking ? "working" : "faulty";
        
        const iconHtml = `<div class="custom-light-pin ${isWorking ? '' : 'faulty-pin'}">
          ${isWorking ? '💡' : '⚠️'}
        </div>`;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([slLat, slLng], { icon: customIcon });

        if (isWorking && activeNightMode) {
          L.circle([slLat, slLng], {
            radius: 120,
            color: "#f59e0b",
            weight: 1,
            fillColor: "#fbbf24",
            fillOpacity: 0.1
          }).addTo(streetlightLayerGroup);
        }

        marker.bindPopup(`
          <div class="popup-title">
            <span>💡 Streetlight NODE_${i}</span>
            <span class="popup-tag ${statusStr}">${statusStr.toUpperCase()}</span>
          </div>
          <div class="popup-detail-row"><span>Intensity:</span> <b>${sl[2]}</b></div>
          <div class="popup-detail-row"><span>Coordinates:</span> <b>${slLat.toFixed(5)}, ${slLng.toFixed(5)}</b></div>
        `);

        marker.addTo(streetlightLayerGroup);
      }
    }
  }

  // --- Render Crime Incident Markers (Optimized with Viewport Culling & Caps) ---
  function renderCrimeIncidents() {
    crimeLayerGroup.clearLayers();
    if (!document.getElementById("toggle-crimes").checked) return;

    const currentZoom = map.getZoom();
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const minLat = sw.lat, maxLat = ne.lat;
    const minLng = sw.lng, maxLng = ne.lng;

    let renderCount = 0;
    const maxRenderLimit = 150; // Cap to prevent DOM bloating and lag
    
    // Add real crimes from dataset
    if (currentZoom >= 14) { // Only render individual pins when zoomed in close (neighborhood-level)
      for (let i = 0; i < rawCrimes.length; i++) {
        if (renderCount >= maxRenderLimit) break;

        const crm = rawCrimes[i];
        
        // Viewport Culling using fast numerical bounds check (No object allocation)
        if (crm.Latitude >= minLat && crm.Latitude <= maxLat && crm.Longitude >= minLng && crm.Longitude <= maxLng) {
          renderCount++;
          
          const iconHtml = `<div class="custom-crime-pin">🚨</div>`;
          const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-leaflet-icon',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          const marker = L.marker([crm.Latitude, crm.Longitude], { icon: customIcon });

          L.circle([crm.Latitude, crm.Longitude], {
            radius: 300,
            color: "#ef4444",
            weight: 1,
            fillColor: "#ef4444",
            fillOpacity: 0.12
          }).addTo(crimeLayerGroup);

          marker.bindPopup(`
            <div class="popup-title">
              <span>🚨 ${crm.Crime_Type}</span>
              <span class="popup-tag crime">Score: ${crm.Crime_Score}</span>
            </div>
            <div class="popup-detail-row"><span>District:</span> <b>${crm.District}</b></div>
            <div class="popup-detail-row"><span>Severity:</span> <b>${crm.Severity}</b></div>
            <div class="popup-detail-row"><span>Incident Date:</span> <b>${crm.Date} at ${crm.Time}</b></div>
          `);

          marker.addTo(crimeLayerGroup);
        }
      }
    }

    // Add approved user hazard reports (always show these near view)
    approvedReports.forEach(rep => {
      if (rep.latitude >= minLat && rep.latitude <= maxLat && rep.longitude >= minLng && rep.longitude <= maxLng) {
        const isOutage = rep.type === "Broken Streetlight";
        const iconHtml = `<div class="custom-crime-pin" style="background:#f59e0b;">⚠️</div>`;
        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-icon',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([rep.latitude, rep.longitude], { icon: customIcon });

        L.circle([rep.latitude, rep.longitude], {
          radius: 300,
          color: isOutage ? "#f59e0b" : "#ef4444",
          weight: 1,
          fillColor: isOutage ? "#fbbf24" : "#ef4444",
          fillOpacity: 0.15
        }).addTo(crimeLayerGroup);

        marker.bindPopup(`
          <div class="popup-title">
            <span>⚠️ USER REPORT: ${rep.type}</span>
            <span class="popup-tag crime" style="background:rgba(255,255,255,0.1); color:white;">Approved</span>
          </div>
          <div class="popup-detail-row"><span>Log Time:</span> <b>${rep.time}</b></div>
          <div class="popup-detail-row"><span>Reporter:</span> <b>${rep.userName}</b></div>
          <div class="popup-detail-row" style="margin-top:8px;"><i>${rep.description}</i></div>
          ${rep.photoUrl ? `<img src="${rep.photoUrl}" style="width:100%; border-radius:6px; margin-top:8px;"/>` : ""}
        `);

        marker.addTo(crimeLayerGroup);
      }
    });
  }

  // --- Initialize Heatmap Layers ---
  function initializeHeatmaps() {
    heatLayerGroup.clearLayers();

    // A. Crime Heatmap setup
    const crimePoints = rawCrimes.map(c => [c.Latitude, c.Longitude, c.Crime_Score / 100]);
    crimeHeatLayer = L.heatLayer(crimePoints, {
      radius: 18,
      blur: 15,
      maxZoom: 12
    });

    // B. Streetlight Intensity Heatmap setup
    const lightPoints = rawStreetlights.map(sl => [sl[0], sl[1], sl[2]]);
    lightHeatLayer = L.heatLayer(lightPoints, {
      radius: 16,
      blur: 12,
      maxZoom: 12,
      gradient: { 0.4: 'blue', 0.6: 'cyan', 0.8: 'yellow', 1.0: 'orange' }
    });

    // Trigger update depending on toggles
    toggleHeatmapLayer("crime", document.getElementById("toggle-crime-heatmap").checked);
    toggleHeatmapLayer("light", document.getElementById("toggle-light-heatmap").checked);
  }

  function toggleHeatmapLayer(type, active) {
    if (type === "crime") {
      if (active && crimeHeatLayer) heatLayerGroup.addLayer(crimeHeatLayer);
      else if (crimeHeatLayer) heatLayerGroup.removeLayer(crimeHeatLayer);
    } else if (type === "light") {
      if (active && lightHeatLayer) heatLayerGroup.addLayer(lightHeatLayer);
      else if (lightHeatLayer) heatLayerGroup.removeLayer(lightHeatLayer);
    }
  }

  // Optimize marker updates during pan & zoom changes (Consolidated in the main moveend handler at the bottom)

  // --- Display route scenarios ---
  function displayRouteScenario(routeObj) {
    routesLayerGroup.clearLayers();

    const fastest = routeObj.fastest;
    const safest = routeObj.safest;

    // Draw Fastest Route (Amber / Orange Polyline)
    fastestPolyline = L.polyline(fastest.path, {
      color: "#f59e0b",
      weight: 5,
      opacity: 0.8,
      dashArray: "10, 8"
    }).addTo(routesLayerGroup);

    // Draw Safest Route (Neon Green Polyline with glow)
    safestPolyline = L.polyline(safest.path, {
      color: "#10b981",
      weight: 7,
      opacity: 0.9
    }).addTo(routesLayerGroup);

    // Start & End Pin Markers
    const startPt = safest.path[0];
    const endPt = safest.path[safest.path.length - 1];

    L.circleMarker(startPt, {
      radius: 8,
      color: "#ffffff",
      fillColor: "#06b6d4",
      fillOpacity: 1,
      weight: 3
    }).bindTooltip("<b>Start Point</b>", { permanent: true, direction: "top" }).addTo(routesLayerGroup);

    L.circleMarker(endPt, {
      radius: 8,
      color: "#ffffff",
      fillColor: "#10b981",
      fillOpacity: 1,
      weight: 3
    }).bindTooltip("<b>Destination</b>", { permanent: true, direction: "top" }).addTo(routesLayerGroup);

    // Fit map bounds to view both routes
    const bounds = safestPolyline.getBounds().extend(fastestPolyline.getBounds());
    map.fitBounds(bounds, { padding: [50, 50] });

    // Update UI Route Comparison Cards
    updateRouteUI(routeObj);
    
    // Select Safest route by default on computation
    selectRoute('safest');
  }

  // Helper to switch highlighted route and update metrics
  function selectRoute(type) {
    if (!activeRoute) return;
    selectedRouteType = type;
    const safestCard = document.getElementById("safest-route-card");
    const fastestCard = document.getElementById("fastest-route-card");

    if (!safestCard || !fastestCard) return;

    if (type === 'safest') {
      safestCard.classList.add("selected");
      fastestCard.classList.remove("selected");
      
      if (safestPolyline && fastestPolyline) {
        safestPolyline.setStyle({ color: "#10b981", weight: 7, opacity: 0.9 });
        fastestPolyline.setStyle({ color: "#f59e0b", weight: 5, opacity: 0.4, dashArray: "10, 8" });
        safestPolyline.bringToFront();
      }
      
      updateSummaryCards(activeRoute.safest.metrics);
    } else {
      fastestCard.classList.add("selected");
      safestCard.classList.remove("selected");

      if (safestPolyline && fastestPolyline) {
        fastestPolyline.setStyle({ color: "#f59e0b", weight: 7, opacity: 0.9, dashArray: "" });
        safestPolyline.setStyle({ color: "#10b981", weight: 5, opacity: 0.4 });
        fastestPolyline.bringToFront();
      }

      updateSummaryCards(activeRoute.fastest.metrics);
    }
  }

  // Update summary stat cards from route metrics or current viewport
  function updateSummaryCards(metrics) {
    const totalLights = (metrics?.working_lights || 0) + (metrics?.faulty_lights || 0);
    const crimeCount = (metrics?.crime_warnings?.length) || 0;
    const outageCount = metrics?.faulty_lights || 0;

    document.getElementById("stat-total-lights").textContent = totalLights || "0";
    document.getElementById("stat-active-crimes").textContent = crimeCount || "0";
    document.getElementById("stat-active-outages").textContent = outageCount || "0";
  }

  function refreshSummaryCountByViewport() {
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const minLat = sw.lat, maxLat = ne.lat, minLng = sw.lng, maxLng = ne.lng;

    const visibleStreetlights = rawStreetlights.filter(sl => sl[0] >= minLat && sl[0] <= maxLat && sl[1] >= minLng && sl[1] <= maxLng);
    const visibleCrimes = rawCrimes.filter(crm => crm.Latitude >= minLat && crm.Latitude <= maxLat && crm.Longitude >= minLng && crm.Longitude <= maxLng);
    const visibleReports = approvedReports.filter(rep => rep.latitude >= minLat && rep.latitude <= maxLat && rep.longitude >= minLng && rep.longitude <= maxLng);
    const outageCount = visibleStreetlights.filter(sl => sl[2] < 0.75).length + visibleReports.filter(r => r.type === "Broken Streetlight").length;

    document.getElementById("stat-total-lights").textContent = visibleStreetlights.length || "0";
    document.getElementById("stat-active-crimes").textContent = (visibleCrimes.length + visibleReports.filter(r => r.type !== "Broken Streetlight").length) || "0";
    document.getElementById("stat-active-outages").textContent = outageCount || "0";
  }

  // Update UI Elements with metrics
  function updateRouteUI(routeObj) {
    const safestCard = document.getElementById("safest-route-card");
    const fastestCard = document.getElementById("fastest-route-card");

    if (!safestCard || !fastestCard) return;

    safestCard.innerHTML = `
      <div class="route-badge badge-safe">🛡️ Safest AI Route Recommended</div>
      <div style="font-weight:700; font-size:14px; margin-bottom:4px;">${routeObj.name}</div>
      <div class="route-desc">${routeObj.safest.description}</div>
      <div class="route-metrics-grid">
        <div class="metric-item">
          <div class="metric-val safe-score">${routeObj.safest.safety_score}/100</div>
          <div class="metric-lbl">Safety Rating</div>
        </div>
        <div class="metric-item">
          <div class="metric-val">${routeObj.safest.time_min} mins</div>
          <div class="metric-lbl">ETA</div>
        </div>
        <div class="metric-item">
          <div class="metric-val">${routeObj.safest.lighting_pct}%</div>
          <div class="metric-lbl">Lit Streets</div>
        </div>
      </div>
    `;

    fastestCard.innerHTML = `
      <div class="route-badge badge-fast">⚡ Fastest Route</div>
      <div style="font-weight:700; font-size:14px; margin-bottom:4px;">${routeObj.name}</div>
      <div class="route-desc">${routeObj.fastest.description}</div>
      <div class="route-metrics-grid">
        <div class="metric-item">
          <div class="metric-val fast-score">${routeObj.fastest.safety_score}/100</div>
          <div class="metric-lbl">Safety Rating</div>
        </div>
        <div class="metric-item">
          <div class="metric-val">${routeObj.fastest.time_min} mins</div>
          <div class="metric-lbl">ETA</div>
        </div>
        <div class="metric-item">
          <div class="metric-val">${routeObj.fastest.lighting_pct}%</div>
          <div class="metric-lbl">Lit Streets</div>
        </div>
      </div>
    `;
  }

  // --- Populate Preset Routes Dropdown ---
  const presetDropdown = document.getElementById("preset-routes-select");
  if (presetDropdown) {
    presetDropdown.innerHTML = "";
    
    // Add default placeholder option
    const placeholderOpt = document.createElement("option");
    placeholderOpt.value = "";
    placeholderOpt.textContent = "Select preset route...";
    placeholderOpt.disabled = true;
    placeholderOpt.selected = true;
    presetDropdown.appendChild(placeholderOpt);

    presetTamilNaduRoutes.forEach((rt, idx) => {
      const opt = document.createElement("option");
      opt.value = idx;
      opt.textContent = `${rt.name}`;
      presetDropdown.appendChild(opt);
    });

    presetDropdown.addEventListener("change", async (e) => {
      const selectedIndex = parseInt(e.target.value);
      if (isNaN(selectedIndex)) return;
      
      const routeData = presetTamilNaduRoutes[selectedIndex];
      
      // Update custom coordinate trackers
      customStartPt = routeData.start;
      customEndPt = routeData.end;

      // Update text fields
      document.getElementById("search-start").value = routeData.name.split("➔")[0].trim();
      document.getElementById("search-end").value = routeData.name.split("➔")[1].trim();

      await computeAndDisplayActiveRoutes();
    });
  }

  // Trigger default preset route calculation on load
  async function triggerDefaultRoute() {
    const defaultIndex = 0;
    const defaultRoute = presetTamilNaduRoutes[defaultIndex];
    customStartPt = defaultRoute.start;
    customEndPt = defaultRoute.end;
    document.getElementById("search-start").value = "Chennai Central";
    document.getElementById("search-end").value = "Coimbatore Gandhipuram";
    
    if (presetDropdown) {
      presetDropdown.value = defaultIndex;
    }

    await computeAndDisplayActiveRoutes();
  }

  // Helper trigger to calculate routes
  async function computeAndDisplayActiveRoutes() {
    if (!customStartPt || !customEndPt) return;

    // Provide visual loading status
    const safestCard = document.getElementById("safest-route-card");
    const fastestCard = document.getElementById("fastest-route-card");
    if (safestCard && fastestCard) {
      safestCard.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Calculating safest path...</div>`;
      fastestCard.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Calculating fastest path...</div>`;
    }

    try {
      const customRoute = await window.RoutingEngine.computeCustomRoutes(customStartPt, customEndPt);
      activeRoute = customRoute;
      displayRouteScenario(customRoute);
    } catch (err) {
      console.warn("OSRM route failed, using offline fallback:", err);
      if (window.RoutingEngine.computeCustomRoutesFallback) {
        const fallbackRoute = window.RoutingEngine.computeCustomRoutesFallback(customStartPt, customEndPt);
        activeRoute = fallbackRoute;
        displayRouteScenario(fallbackRoute);
      } else {
        alert("Failed to compute route. The offline route fallback is unavailable.");
      }
    }
  }

  // --- Bind Places Autocomplete Search Inputs ---
  const searchStartInput = document.getElementById("search-start");
  const searchStartSuggestions = document.getElementById("search-start-suggestions");
  const searchEndInput = document.getElementById("search-end");
  const searchEndSuggestions = document.getElementById("search-end-suggestions");

  if (searchStartInput && searchStartSuggestions) {
    window.AppUtils.setupAutocomplete(searchStartInput, searchStartSuggestions, async (selectedItem) => {
      customStartPt = [selectedItem.lat, selectedItem.lng];
      console.log("Start point set via search:", customStartPt);
      if (presetDropdown) presetDropdown.value = "";
      await computeAndDisplayActiveRoutes();
    });
  }

  if (searchEndInput && searchEndSuggestions) {
    window.AppUtils.setupAutocomplete(searchEndInput, searchEndSuggestions, async (selectedItem) => {
      customEndPt = [selectedItem.lat, selectedItem.lng];
      console.log("End point set via search:", customEndPt);
      if (presetDropdown) presetDropdown.value = "";
      await computeAndDisplayActiveRoutes();
    });
  }

  // --- Custom Map Click Pickers (Origin / Destination) ---
  const pickStartBtn = document.getElementById("btn-pick-start");
  const pickEndBtn = document.getElementById("btn-pick-end");

  if (pickStartBtn && pickEndBtn) {
    pickStartBtn.addEventListener("click", () => {
      mapPickingMode = "start";
      pickStartBtn.classList.add("active");
      pickEndBtn.classList.remove("active");
      alert("📍 Click anywhere on the map to set your START point.");
    });

    pickEndBtn.addEventListener("click", () => {
      mapPickingMode = "end";
      pickEndBtn.classList.add("active");
      pickStartBtn.classList.remove("active");
      alert("🏁 Click anywhere on the map to set your DESTINATION.");
    });
  }

  // Capture Map click events
  map.on("click", async (e) => {
    if (window.Report.mapPickingMode) return;
    if (!mapPickingMode) return;

    const coords = [e.latlng.lat, e.latlng.lng];

    if (mapPickingMode === "start") {
      customStartPt = coords;
      mapPickingMode = null;
      pickStartBtn.classList.remove("active");
      pickStartBtn.innerHTML = `📍 Start Set`;
      document.getElementById("search-start").value = `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
    } else if (mapPickingMode === "end") {
      customEndPt = coords;
      mapPickingMode = null;
      pickEndBtn.classList.remove("active");
      pickEndBtn.innerHTML = `🏁 Destination Set`;
      document.getElementById("search-end").value = `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
    }

    if (presetDropdown) presetDropdown.value = "";

    await computeAndDisplayActiveRoutes();
  });

  // --- Layer Toggle Controls ---
  const toggleGeoJson = document.getElementById("toggle-geojson");
  const toggleStreetlights = document.getElementById("toggle-streetlights");
  const toggleCrimes = document.getElementById("toggle-crimes");
  const toggleCrimeHeatmap = document.getElementById("toggle-crime-heatmap");
  const toggleLightHeatmap = document.getElementById("toggle-light-heatmap");

  if (toggleGeoJson) {
    toggleGeoJson.addEventListener("change", (e) => {
      if (e.target.checked) map.addLayer(geojsonLayerGroup);
      else map.removeLayer(geojsonLayerGroup);
    });
  }

  if (toggleStreetlights) {
    toggleStreetlights.addEventListener("change", (e) => {
      if (e.target.checked) {
        map.addLayer(streetlightLayerGroup);
        renderStreetlights();
      } else {
        map.removeLayer(streetlightLayerGroup);
      }
    });
  }

  if (toggleCrimes) {
    toggleCrimes.addEventListener("change", (e) => {
      if (e.target.checked) {
        map.addLayer(crimeLayerGroup);
        renderCrimeIncidents();
      } else {
        map.removeLayer(crimeLayerGroup);
      }
    });
  }

  if (toggleCrimeHeatmap) {
    toggleCrimeHeatmap.addEventListener("change", (e) => {
      toggleHeatmapLayer("crime", e.target.checked);
    });
  }

  if (toggleLightHeatmap) {
    toggleLightHeatmap.addEventListener("change", (e) => {
      toggleHeatmapLayer("light", e.target.checked);
    });
  }

  // --- Night Mode Simulation Toggle ---
  const nightToggleBtn = document.getElementById("btn-toggle-night");
  if (nightToggleBtn) {
    nightToggleBtn.addEventListener("click", () => {
      activeNightMode = !activeNightMode;
      if (activeNightMode) {
        map.removeLayer(lightTileLayer);
        map.addLayer(darkTileLayer);
        nightToggleBtn.innerHTML = `🌙 Night Mode`;
      } else {
        map.removeLayer(darkTileLayer);
        map.addLayer(lightTileLayer);
        nightToggleBtn.innerHTML = `☀️ Day Mode`;
      }
      renderStreetlights();
    });
  }

  // --- User Geolocation Live Tracking ---
  const trackLocBtn = document.getElementById("btn-track-location");
  const recenterBtn = document.getElementById("btn-recenter-map");

  if (trackLocBtn) {
    trackLocBtn.addEventListener("click", () => {
      if (liveWatchId !== null) {
        navigator.geolocation.clearWatch(liveWatchId);
        liveWatchId = null;
        liveUserCoords = null;
        if (liveUserMarker) {
          liveLocationLayerGroup.removeLayer(liveUserMarker);
          liveUserMarker = null;
        }
        trackLocBtn.classList.remove("active");
        alert("Live location tracking disabled.");
      } else {
        if (!navigator.geolocation) {
          alert("Your browser does not support geolocation services.");
          return;
        }

        trackLocBtn.classList.add("active");
        liveWatchId = navigator.geolocation.watchPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            liveUserCoords = [lat, lng];

            if (!liveUserMarker) {
              liveUserMarker = L.circleMarker(liveUserCoords, {
                radius: 10,
                color: "#ffffff",
                fillColor: "#3b82f6",
                fillOpacity: 1,
                weight: 3
              }).bindTooltip("<b>Your Location</b>", { permanent: false }).addTo(liveLocationLayerGroup);
            } else {
              liveUserMarker.setLatLng(liveUserCoords);
            }

            console.log("Device location updated:", liveUserCoords);
          },
          (err) => {
            console.error("Location watch failed:", err);
            alert("Could not retrieve GPS coordinates. Verify GPS permission is granted.");
            trackLocBtn.classList.remove("active");
            if (liveWatchId !== null) {
              navigator.geolocation.clearWatch(liveWatchId);
              liveWatchId = null;
            }
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }
    });
  }

  if (recenterBtn) {
    recenterBtn.addEventListener("click", () => {
      if (liveUserCoords) {
        map.setView(liveUserCoords, 14);
      } else {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = [pos.coords.latitude, pos.coords.longitude];
            map.setView(coords, 14);
          },
          (err) => {
            map.setView([11.1271, 78.6569], 7);
          }
        );
      }
    });
  }

  // --- Report Safety Hazard Modal wiring ---
  const openReportBtn = document.getElementById("btn-open-report");
  if (openReportBtn) {
    openReportBtn.addEventListener("click", () => {
      window.Report.toggleModal(true);
    });
  }

  // Display admin portal link only if role is admin
  const adminPortalBtn = document.getElementById("btn-admin-portal");
  if (adminPortalBtn) {
    const role = localStorage.getItem("pathpal_user_role");
    if (role !== "admin") {
      adminPortalBtn.style.display = "none";
    }
  }

  // Refresh stat cards each time the map view changes for location-aware counts
  map.on("moveend", () => {
    renderStreetlights();
    renderCrimeIncidents();
    
    // If a route is active and visible in the viewport, preserve and update the route's specific metrics.
    // Otherwise, fallback to location-aware counts of the current viewport.
    if (activeRoute && customStartPt && customEndPt && (map.getBounds().contains(customStartPt) || map.getBounds().contains(customEndPt))) {
      const selectedMetrics = selectedRouteType === 'fastest' ? activeRoute.fastest.metrics : activeRoute.safest.metrics;
      updateSummaryCards(selectedMetrics);
    } else {
      refreshSummaryCountByViewport();
    }
  });

  // Bind click selection on the safest and fastest route cards
  const safestCard = document.getElementById("safest-route-card");
  const fastestCard = document.getElementById("fastest-route-card");
  if (safestCard && fastestCard) {
    safestCard.addEventListener("click", () => selectRoute('safest'));
    fastestCard.addEventListener("click", () => selectRoute('fastest'));
  }

  // Initialize summary counts from the current viewport once data has loaded
  refreshSummaryCountByViewport();
});
