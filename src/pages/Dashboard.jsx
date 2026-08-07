import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { computeCustomRoutes } from '../services/routing';

// Preset Tamil Nadu Routes
const PRESET_ROUTES = [
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

export default function Dashboard({ user, role, onNavigate, onLogout }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  // Map layers refs
  const geojsonGroup = useRef(null);
  const streetlightGroup = useRef(null);
  const crimeGroup = useRef(null);
  const routesGroup = useRef(null);
  const heatGroup = useRef(null);
  const liveLocationGroup = useRef(null);

  // Heatmap layers refs
  const crimeHeatLayer = useRef(null);
  const lightHeatLayer = useRef(null);

  // States
  const [nightMode, setNightMode] = useState(true);
  const [streetlights, setStreetlights] = useState([]);
  const [crimes, setCrimes] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingDatasets, setLoadingDatasets] = useState(true);

  // Layer Toggles
  const [showBoundary, setShowBoundary] = useState(true);
  const [showStreetlightPins, setShowStreetlightPins] = useState(false);
  const [showCrimePins, setShowCrimePins] = useState(true);
  const [showCrimeHeat, setShowCrimeHeat] = useState(true);
  const [showLightHeat, setShowLightHeat] = useState(false);

  // Search & Navigation States
  const [startQuery, setStartQuery] = useState("Chennai Central");
  const [endQuery, setEndQuery] = useState("Coimbatore Gandhipuram");
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [startCoords, setStartCoords] = useState([13.0827, 80.2707]);
  const [endCoords, setEndCoords] = useState([11.0168, 76.9689]);
  
  // Custom Picking Mode: 'start' | 'end' | null
  const [pickingMode, setPickingMode] = useState(null);
  const [presetIndex, setPresetIndex] = useState(0);

  // Route calculation outputs
  const [routes, setRoutes] = useState(null);
  const [calculatingRoutes, setCalculatingRoutes] = useState(false);

  // SOS States
  const [sosActive, setSosActive] = useState(false);
  const [sirenTimer, setSirenTimer] = useState(null);
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);

  // Reporting Hazard Modal States
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("");
  const [reportTime, setReportTime] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportCoords, setReportCoords] = useState(null);
  const [reportPicking, setReportPicking] = useState(false);
  const reportMarkerRef = useRef(null);
  const [submittingReport, setSubmittingReport] = useState(false);

  // Chatbot States
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: "Hello! I am your PathPal Safety Assistant. How can I help you navigate safely across Tamil Nadu today?" }
  ]);
  const chatMessagesEndRef = useRef(null);

  // Tile Layers
  const darkTile = useRef(null);
  const lightTile = useRef(null);

  // --- Load Dynamic Spatial Datasets ---
  useEffect(() => {
    const base = import.meta.env.BASE_URL || "/";
    Promise.all([
      fetch(`${base}data/streetlights.json`).then(res => res.json()),
      fetch(`${base}data/tamilnadu_real_crime.json`).then(res => res.json()),
      fetch(`${base}data/tamilnadu.geojson`).then(res => res.json())
    ])
    .then(([streetlightData, crimeData, geoJson]) => {
      setStreetlights(streetlightData);
      setCrimes(crimeData);

      // Initialize map instance once elements load
      if (!mapInstance.current && mapRef.current) {
        const initMap = L.map(mapRef.current, {
          center: [11.1271, 78.6569],
          zoom: 7,
          zoomControl: false
        });

        L.control.zoom({ position: "topright" }).addTo(initMap);

        darkTile.current = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          maxZoom: 19
        });
        
        lightTile.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19
        });

        darkTile.current.addTo(initMap);

        // Setup Layer Groups
        geojsonGroup.current = L.layerGroup().addTo(initMap);
        streetlightGroup.current = L.layerGroup().addTo(initMap);
        crimeGroup.current = L.layerGroup().addTo(initMap);
        routesGroup.current = L.layerGroup().addTo(initMap);
        heatGroup.current = L.layerGroup().addTo(initMap);
        liveLocationGroup.current = L.layerGroup().addTo(initMap);

        // Load Tamil Nadu Boundaries
        L.geoJSON(geoJson, {
          style: {
            color: "#3b82f6",
            weight: 2,
            opacity: 0.8,
            fillColor: "#1e3a8a",
            fillOpacity: 0.03
          }
        }).addTo(geojsonGroup.current);

        mapInstance.current = initMap;

        // Sync panning and culling
        initMap.on("moveend", () => {
          triggerPinRenders(streetlightData, crimeData);
        });

        // Custom picking handler
        initMap.on("click", (e) => {
          handleMapClick(e.latlng.lat, e.latlng.lng);
        });
      }

      // Fetch dynamic reports from Supabase
      fetchApprovedReports(streetlightData, crimeData);

      // Listen for dynamic database updates
      const reportsSubscription = supabase
        .channel('realtime-approved-reports')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
          fetchApprovedReports(streetlightData, crimeData);
        })
        .subscribe();

      setLoadingDatasets(false);

      return () => {
        supabase.removeChannel(reportsSubscription);
      };
    })
    .catch(err => {
      console.error("Critical datasets loading failure:", err);
      alert("Error loading Map Spatial databases.");
    });
  }, []);

  // Fetch reports helper
  const fetchApprovedReports = async (slList, crList) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('status', 'Approved');

      if (error) throw error;
      setReports(data || []);
      
      // Update Heatmaps
      setupHeatmaps(slList, crList);
      triggerPinRenders(slList, crList, data || []);
    } catch (err) {
      console.error("Failed to sync approved reports:", err);
    }
  };

  // --- Map Tile Night Mode toggle ---
  useEffect(() => {
    if (!mapInstance.current) return;
    if (nightMode) {
      if (lightTile.current) mapInstance.current.removeLayer(lightTile.current);
      if (darkTile.current) darkTile.current.addTo(mapInstance.current);
    } else {
      if (darkTile.current) mapInstance.current.removeLayer(darkTile.current);
      if (lightTile.current) lightTile.current.addTo(mapInstance.current);
    }
    triggerPinRenders(streetlights, crimes, reports);
  }, [nightMode]);

  // --- Dynamic layer toggling reactions ---
  useEffect(() => {
    if (!mapInstance.current) return;
    
    // Boundary layer
    if (showBoundary) mapInstance.current.addLayer(geojsonGroup.current);
    else mapInstance.current.removeLayer(geojsonGroup.current);

    // Streetlight layer
    if (showStreetlightPins) {
      mapInstance.current.addLayer(streetlightGroup.current);
      renderStreetlights(streetlights);
    } else {
      mapInstance.current.removeLayer(streetlightGroup.current);
    }

    // Crime layer
    if (showCrimePins) {
      mapInstance.current.addLayer(crimeGroup.current);
      renderCrimes(crimes, reports);
    } else {
      mapInstance.current.removeLayer(crimeGroup.current);
    }
  }, [showBoundary, showStreetlightPins, showCrimePins, streetlights, crimes, reports]);

  // Heatmap layer updates
  useEffect(() => {
    if (!mapInstance.current) return;

    if (showCrimeHeat && crimeHeatLayer.current) heatGroup.current.addLayer(crimeHeatLayer.current);
    else if (crimeHeatLayer.current) heatGroup.current.removeLayer(crimeHeatLayer.current);

    if (showLightHeat && lightHeatLayer.current) heatGroup.current.addLayer(lightHeatLayer.current);
    else if (lightHeatLayer.current) heatGroup.current.removeLayer(lightHeatLayer.current);
  }, [showCrimeHeat, showLightHeat, reports]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Heatmap init
  const setupHeatmaps = (slList, crList) => {
    if (crimeHeatLayer.current) {
      heatGroup.current.removeLayer(crimeHeatLayer.current);
      heatGroup.current.removeLayer(lightHeatLayer.current);
    }

    const crimePoints = crList.map(c => [c.Latitude, c.Longitude, c.Crime_Score / 100]);
    crimeHeatLayer.current = L.heatLayer(crimePoints, { radius: 18, blur: 15, maxZoom: 12 });

    const lightPoints = slList.map(sl => [sl[0], sl[1], sl[2]]);
    lightHeatLayer.current = L.heatLayer(lightPoints, {
      radius: 16,
      blur: 12,
      maxZoom: 12,
      gradient: { 0.4: 'blue', 0.6: 'cyan', 0.8: 'yellow', 1.0: 'orange' }
    });

    if (showCrimeHeat) heatGroup.current.addLayer(crimeHeatLayer.current);
    if (showLightHeat) heatGroup.current.addLayer(lightHeatLayer.current);
  };

  const triggerPinRenders = (slList, crList, repList = reports) => {
    if (showStreetlightPins) renderStreetlights(slList);
    if (showCrimePins) renderCrimes(crList, repList);
  };

  // --- Optimized Streetlights rendering ---
  const renderStreetlights = (slList) => {
    if (!streetlightGroup.current || !mapInstance.current) return;
    streetlightGroup.current.clearLayers();

    const zoom = mapInstance.current.getZoom();
    if (zoom < 15) return; // Street block zoom required

    const bounds = mapInstance.current.getBounds();
    const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
    
    let renderedCount = 0;
    const limit = 150;

    for (let i = 0; i < slList.length; i++) {
      if (renderedCount >= limit) break;
      const sl = slList[i];
      if (sl[0] >= sw.lat && sl[0] <= ne.lat && sl[1] >= sw.lng && sl[1] <= ne.lng) {
        renderedCount++;
        const working = sl[2] >= 0.75;
        
        const marker = L.marker([sl[0], sl[1]], {
          icon: L.divIcon({
            html: `<div class="custom-light-pin ${working ? '' : 'faulty-pin'}">${working ? '💡' : '⚠️'}</div>`,
            className: 'custom-leaflet-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        });

        if (working && nightMode) {
          L.circle([sl[0], sl[1]], { radius: 120, color: "#f59e0b", weight: 1, fillColor: "#fbbf24", fillOpacity: 0.1 }).addTo(streetlightGroup.current);
        }

        marker.bindPopup(`
          <div class="popup-title"><span>💡 Streetlight NODE_${i}</span><span class="popup-tag ${working ? 'working' : 'faulty'}">${working ? 'WORKING' : 'FAULTY'}</span></div>
          <div class="popup-detail-row"><span>Intensity:</span> <b>${sl[2]}</b></div>
        `);
        marker.addTo(streetlightGroup.current);
      }
    }
  };

  // --- Optimized Crimes rendering ---
  const renderCrimes = (crList, repList) => {
    if (!crimeGroup.current || !mapInstance.current) return;
    crimeGroup.current.clearLayers();

    const zoom = mapInstance.current.getZoom();
    const bounds = mapInstance.current.getBounds();
    const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();

    let renderedCount = 0;
    const limit = 150;

    if (zoom >= 14) {
      for (let i = 0; i < crList.length; i++) {
        if (renderedCount >= limit) break;
        const crm = crList[i];
        if (crm.Latitude >= sw.lat && crm.Latitude <= ne.lat && crm.Longitude >= sw.lng && crm.Longitude <= ne.lng) {
          renderedCount++;
          
          const marker = L.marker([crm.Latitude, crm.Longitude], {
            icon: L.divIcon({
              html: `<div class="custom-crime-pin">🚨</div>`,
              className: 'custom-leaflet-icon',
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            })
          });

          L.circle([crm.Latitude, crm.Longitude], { radius: 300, color: "#ef4444", weight: 1, fillColor: "#ef4444", fillOpacity: 0.12 }).addTo(crimeGroup.current);
          
          marker.bindPopup(`
            <div class="popup-title"><span>🚨 ${crm.Crime_Type}</span><span class="popup-tag crime">Score: ${crm.Crime_Score}</span></div>
            <div class="popup-detail-row"><span>District:</span> <b>${crm.District}</b></div>
            <div class="popup-detail-row"><span>Severity:</span> <b>${crm.Severity}</b></div>
          `);
          marker.addTo(crimeGroup.current);
        }
      }
    }

    // Add approved user hazard reports
    repList.forEach(rep => {
      if (rep.latitude >= sw.lat && rep.latitude <= ne.lat && rep.longitude >= sw.lng && rep.longitude <= ne.lng) {
        const isOutage = rep.type === "Broken Streetlight";
        const marker = L.marker([rep.latitude, rep.longitude], {
          icon: L.divIcon({
            html: `<div class="custom-crime-pin" style="background:#f59e0b;">⚠️</div>`,
            className: 'custom-leaflet-icon',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          })
        });

        L.circle([rep.latitude, rep.longitude], { radius: 300, color: isOutage ? "#f59e0b" : "#ef4444", weight: 1, fillColor: isOutage ? "#fbbf24" : "#ef4444", fillOpacity: 0.15 }).addTo(crimeGroup.current);
        
        marker.bindPopup(`
          <div class="popup-title"><span>⚠️ USER REPORT: ${rep.type}</span></div>
          <div class="popup-detail-row"><span>Log Time:</span> <b>${rep.time}</b></div>
          <div class="popup-detail-row"><span>Reporter:</span> <b>${rep.user_name}</b></div>
          <div class="popup-detail-row" style="margin-top:8px;"><i>${rep.description}</i></div>
          ${rep.photo_url ? `<img src="${rep.photo_url}" style="width:100%; border-radius:6px; margin-top:8px;"/>` : ""}
        `);
        marker.addTo(crimeGroup.current);
      }
    });
  };

  // --- Auto-Route Calculation trigger ---
  useEffect(() => {
    if (streetlights.length > 0 && startCoords && endCoords) {
      calculateActiveRoutes();
    }
  }, [startCoords, endCoords, streetlights]);

  const calculateActiveRoutes = async () => {
    setCalculatingRoutes(true);
    setRoutes(null);
    routesGroup.current?.clearLayers();

    try {
      const data = await computeCustomRoutes(startCoords, endCoords, streetlights, crimes, reports);
      setRoutes(data);

      if (!mapInstance.current) return;

      // Draw Fastest polyline (Amber)
      const fastestPoly = L.polyline(data.fastest.path, { color: "#f59e0b", weight: 5, opacity: 0.8, dashArray: "10, 8" }).addTo(routesGroup.current);
      
      // Draw Safest polyline (Emerald)
      const safestPoly = L.polyline(data.safest.path, { color: "#10b981", weight: 7, opacity: 0.9 }).addTo(routesGroup.current);

      // Start and End Pins
      L.circleMarker(startCoords, { radius: 8, color: "#ffffff", fillColor: "#06b6d4", fillOpacity: 1, weight: 3 }).bindTooltip("<b>Start Point</b>").addTo(routesGroup.current);
      L.circleMarker(endCoords, { radius: 8, color: "#ffffff", fillColor: "#10b981", fillOpacity: 1, weight: 3 }).bindTooltip("<b>Destination</b>").addTo(routesGroup.current);

      // Zoom Map to fit route
      const bounds = safestPoly.getBounds().extend(fastestPoly.getBounds());
      mapInstance.current.fitBounds(bounds, { padding: [50, 50] });

    } catch (err) {
      console.error("OSRM Routing error:", err);
    } finally {
      setCalculatingRoutes(false);
    }
  };

  // --- Nominatim Places autocomplete debounced search ---
  const handleSearch = async (query, isStart) => {
    if (isStart) {
      setStartQuery(query);
      if (query.trim().length < 3) return setStartSuggestions([]);
    } else {
      setEndQuery(query);
      if (query.trim().length < 3) return setEndSuggestions([]);
    }

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=Tamil+Nadu+${encodeURIComponent(query)}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        const results = data.map(item => ({
          name: item.display_name.replace(", Tamil Nadu, India", ""),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        }));
        if (isStart) setStartSuggestions(results);
        else setEndSuggestions(results);
      }
    } catch (e) {
      console.warn("Autocomplete query failed", e);
    }
  };

  // Preset corridor selector
  const handlePresetChange = (e) => {
    const idx = parseInt(e.target.value);
    setPresetIndex(idx);
    const rt = PRESET_ROUTES[idx];
    setStartCoords(rt.start);
    setEndCoords(rt.end);
    setStartQuery(rt.name.split("➔")[0].trim());
    setEndQuery(rt.name.split("➔")[1].trim());
  };

  // Map clicks handler for coordinates picking
  const handleMapClick = (lat, lng) => {
    if (reportPicking) {
      setReportCoords([lat, lng]);
      setReportPicking(false);
      setShowReportModal(true);

      // Show temporary reporting marker
      if (reportMarkerRef.current) mapInstance.current.removeLayer(reportMarkerRef.current);
      reportMarkerRef.current = L.marker([lat, lng], {
        icon: L.divIcon({
          html: '<div class="custom-report-pin">⚠️</div>',
          className: 'custom-leaflet-icon',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      }).addTo(mapInstance.current);
      return;
    }

    if (pickingMode === "start") {
      setStartCoords([lat, lng]);
      setStartQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      setPickingMode(null);
    } else if (pickingMode === "end") {
      setEndCoords([lat, lng]);
      setEndQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      setPickingMode(null);
    }
  };

  // --- User Safety Hazard Submission ---
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportType || !reportDesc || !reportTime || !reportCoords) {
      alert("Missing details. Mark the hazard coordinates first.");
      return;
    }

    setSubmittingReport(true);

    let nameStr = "Anonymous User";
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .maybeSingle();
      if (profile) nameStr = profile.name;
    } catch (e) {}

    try {
      const { error } = await supabase
        .from('reports')
        .insert([
          {
            type: reportType,
            description: reportDesc,
            time: reportTime,
            latitude: reportCoords[0],
            longitude: reportCoords[1],
            status: "Pending",
            user_id: user.id,
            user_name: nameStr
          }
        ]);

      if (error) throw error;

      alert("Hazard logged successfully! Under review.");
      
      // Clean up modal states
      setShowReportModal(false);
      setReportType("");
      setReportDesc("");
      setReportTime("");
      setReportCoords(null);

      if (reportMarkerRef.current) {
        mapInstance.current.removeLayer(reportMarkerRef.current);
        reportMarkerRef.current = null;
      }
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setSubmittingReport(false);
    }
  };

  // --- Emergency SOS sequence (Oscillator Siren Audio API) ---
  const triggerSOSAlert = async () => {
    setSosActive(true);

    let emergencyNum = "112";
    let nameStr = "User";
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, emergency_contact')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        nameStr = profile.name;
        emergencyNum = profile.emergency_contact || emergencyNum;
      }
    } catch (e) {}

    try {
      await supabase
        .from('sos_alerts')
        .insert([
          {
            user_id: user.id,
            user_name: nameStr,
            user_phone: user.phone || "",
            emergency_contact: emergencyNum,
            latitude: startCoords[0],
            longitude: startCoords[1],
            status: "Active"
          }
        ]);
    } catch (dbErr) {
      console.warn("Could not log SOS event:", dbErr);
    }

    // Play synthesized Web Audio siren tones
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscillatorRef.current = osc;
      gainNodeRef.current = gain;

      const timer = setInterval(() => {
        if (!ctx) return;
        const now = ctx.currentTime;
        osc.frequency.cancelScheduledValues(now);
        osc.frequency.setValueAtTime(osc.frequency.value, now);
        if (osc.frequency.value < 600) {
          osc.frequency.exponentialRampToValueAtTime(900, now + 0.4);
        } else {
          osc.frequency.exponentialRampToValueAtTime(400, now + 0.4);
        }
      }, 400);

      setSirenTimer(timer);
    } catch (audioErr) {
      console.warn("Audio Context init blocked:", audioErr);
    }

    alert(`🚨 SOS ALERT LOGGED! 🚨\n\nContacting emergency contact number: ${emergencyNum}`);
    window.location.href = `tel:${emergencyNum}`;
  };

  const deactivateSOS = () => {
    if (sirenTimer) {
      clearInterval(sirenTimer);
      setSirenTimer(null);
    }
    try {
      oscillatorRef.current?.stop();
      oscillatorRef.current?.disconnect();
      gainNodeRef.current?.disconnect();
      audioContextRef.current?.close();
    } catch (e) {}
    
    setSosActive(false);
  };

  // --- Chatbot Messaging Logic ---
  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    const newMessages = [...chatMessages, { sender: 'user', text: userMsg }];
    setChatMessages(newMessages);
    setChatInput("");

    // Simple keyword-matching safety bot engine
    setTimeout(() => {
      let botResponse = "";
      const lower = userMsg.toLowerCase();

      if (lower.includes("sos") || lower.includes("emergency") || lower.includes("alarm") || lower.includes("siren")) {
        botResponse = "🚨 To trigger an SOS alert, click the floating red 'SOS' button on the map dashboard. This will sound an audible siren, share your live GPS coordinates with our database, and dial your emergency contact immediately.";
      } else if (lower.includes("crime") || lower.includes("unsafe") || lower.includes("danger") || lower.includes("police")) {
        botResponse = `🛡️ I have analyzed the safety datasets. There are currently ${crimes.length} historical crime incidents mapped across Tamil Nadu. We recommend using our 'Safest AI Route' (green polyline) to avoid crime hotspots and unlit corridors.`;
      } else if (lower.includes("light") || lower.includes("dark") || lower.includes("outage") || lower.includes("illumination")) {
        botResponse = `💡 Streetlight coverage check: We track ${streetlights.length} streetlight nodes. Toggle the 'Smartlight Density Grid' or 'Streetlight Node Pins' in the overlays list to inspect lighting coverage along your path.`;
      } else if (lower.includes("report") || lower.includes("broken") || lower.includes("hazard")) {
        botResponse = "📝 You can report active hazards! Click the blue 'Report Safety Hazard' button in the sidebar, click 'Pick Point on Map' to set coordinates, fill out the form, and submit. An administrator will review and approve it shortly.";
      } else if (lower.includes("hi") || lower.includes("hello") || lower.includes("hey") || lower.includes("help")) {
        botResponse = "Hello! I am your PathPal Safety Assistant. Ask me anything about your route, safety metrics, SOS triggers, or hazard reporting!";
      } else {
        botResponse = "I can assist you with Tamil Nadu route safety. Try asking:\n- 'How do I trigger an SOS alert?'\n- 'Where are the crime hotspots?'\n- 'How do I report a broken streetlight?'";
      }

      setChatMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
    }, 600);
  };

  return (
    <div id="app-container">
      {/* Visual Emergency Overlay */}
      {sosActive && (
        <div id="sos-siren-overlay" style={{ background: 'rgba(239, 68, 68, 0.45)' }}>
          <div className="siren-content">
            <div className="siren-icon"><i className="fa-solid fa-triangle-exclamation fa-beat"></i></div>
            <div className="siren-text">EMERGENCY SOS ACTIVE</div>
            <div className="siren-subtext">Coordinates and logs are being synced with safety services.</div>
            <button onClick={deactivateSOS} className="btn-siren-deactivate">Deactivate Alarm</button>
          </div>
        </div>
      )}

      {/* Sidebar navigation */}
      <aside id="sidebar">
        <div className="sidebar-header">
          <div className="brand-box">
            <div className="brand-icon"><i className="fa-solid fa-shield-halved"></i></div>
            <div className="brand-title">
              <h1>Path Pal AI</h1>
              <div className="brand-subtitle">Smart Safe Navigation System</div>
            </div>
          </div>
          <button onClick={() => setNightMode(!nightMode)} className="night-mode-toggle">
            {nightMode ? "🌙 Night Mode" : "☀️ Day Mode"}
          </button>
        </div>

        <div className="sidebar-content">
          {/* Counters */}
          <div className="stats-summary-grid">
            <div className="stat-card">
              <div className="stat-number">{streetlights.length || "--"}</div>
              <div className="stat-label">Streetlights</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{(crimes.length + reports.length) || "--"}</div>
              <div className="stat-label">Crime Incidents</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{(streetlights.filter(s => s[2] < 0.75).length + reports.filter(r => r.type === "Broken Streetlight").length) || "--"}</div>
              <div className="stat-label">Light Outages</div>
            </div>
          </div>

          {/* Search Card */}
          <div className="control-card">
            <div className="section-title"><span><i className="fa-solid fa-route"></i> Route Corridor Search</span></div>

            <div className="search-input-group" style={{ position: 'relative', marginBottom: '8px' }}>
              <input
                type="text"
                value={startQuery}
                onChange={(e) => handleSearch(e.target.value, true)}
                placeholder="Search Source Address..."
                className="preset-select"
                style={{ paddingLeft: '36px' }}
              />
              <i className="fa-solid fa-location-dot" style={{ position: 'absolute', left: '14px', top: '14px', color: '#06b6d4' }}></i>
              {startSuggestions.length > 0 && (
                <div className="autocomplete-dropdown">
                  {startSuggestions.map((item, idx) => (
                    <div key={idx} className="suggestion-item" onClick={() => {
                      setStartCoords([item.lat, item.lng]);
                      setStartQuery(item.name);
                      setStartSuggestions([]);
                    }}>
                      {item.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="search-input-group" style={{ position: 'relative', marginBottom: '8px' }}>
              <input
                type="text"
                value={endQuery}
                onChange={(e) => handleSearch(e.target.value, false)}
                placeholder="Search Destination Address..."
                className="preset-select"
                style={{ paddingLeft: '36px' }}
              />
              <i className="fa-solid fa-flag-checkered" style={{ position: 'absolute', left: '14px', top: '14px', color: '#10b981' }}></i>
              {endSuggestions.length > 0 && (
                <div className="autocomplete-dropdown">
                  {endSuggestions.map((item, idx) => (
                    <div key={idx} className="suggestion-item" onClick={() => {
                      setEndCoords([item.lat, item.lng]);
                      setEndQuery(item.name);
                      setEndSuggestions([]);
                    }}>
                      {item.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', margin: '2px 0' }}>— OR SELECT CORRIDOR —</div>

            <select onChange={handlePresetChange} value={presetIndex} className="preset-select">
              {PRESET_ROUTES.map((r, i) => (
                <option key={i} value={i}>{r.name}</option>
              ))}
            </select>

            <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', margin: '2px 0' }}>— OR PICK CUSTOM POINTS ON MAP —</div>

            <div className="picker-btn-group">
              <button onClick={() => setPickingMode("start")} className={`btn-pick ${pickingMode === 'start' ? 'active' : ''}`}>
                <i className="fa-solid fa-location-dot" style={{ color: '#06b6d4' }}></i> {pickingMode === 'start' ? 'Click Map...' : 'Set Start'}
              </button>
              <button onClick={() => setPickingMode("end")} className={`btn-pick ${pickingMode === 'end' ? 'active' : ''}`}>
                <i className="fa-solid fa-flag-checkered" style={{ color: '#10b981' }}></i> {pickingMode === 'end' ? 'Click Map...' : 'Set Dest'}
              </button>
            </div>
          </div>

          {/* Route Comparison Card */}
          <div className="section-title"><span><i className="fa-solid fa-arrows-split-up-and-left"></i> Route Comparison (AI Risk Analysis)</span></div>

          {calculatingRoutes ? (
            <div className="no-data"><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Calculating safest path...</div>
          ) : routes ? (
            <>
              <div id="safest-route-card" className="route-card recommended">
                <div className="route-badge badge-safe">🛡️ Safest AI Route Recommended</div>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Safe corridor path</div>
                <div className="route-desc">{routes.safest.description}</div>
                <div className="route-metrics-grid">
                  <div className="metric-item">
                    <div className="metric-val safe-score">{routes.safest.safety_score}/100</div>
                    <div className="metric-lbl">Safety Rating</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-val">{routes.safest.time_min} mins</div>
                    <div className="metric-lbl">ETA</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-val">{routes.safest.lighting_pct}%</div>
                    <div className="metric-lbl">Lit Streets</div>
                  </div>
                </div>
              </div>

              <div id="fastest-route-card" className="route-card">
                <div className="route-badge badge-fast">⚡ Fastest Route</div>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Shortest distance path</div>
                <div className="route-desc">{routes.fastest.description}</div>
                <div className="route-metrics-grid">
                  <div className="metric-item">
                    <div className="metric-val fast-score">{routes.fastest.safety_score}/100</div>
                    <div className="metric-lbl">Safety Rating</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-val">{routes.fastest.time_min} mins</div>
                    <div className="metric-lbl">ETA</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-val">{routes.fastest.lighting_pct}%</div>
                    <div className="metric-lbl">Lit Streets</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-data">Select a route or search coordinates.</div>
          )}

          {/* Map Layer Toggles */}
          <div className="control-card">
            <div className="section-title"><span><i className="fa-solid fa-layer-group"></i> Toggle Map Overlays</span></div>
            <div className="layer-toggles-grid">
              <label className="toggle-item">
                <input type="checkbox" checked={showBoundary} onChange={(e) => setShowBoundary(e.target.checked)} />
                <span>TN State Boundaries</span>
              </label>
              <label className="toggle-item">
                <input type="checkbox" checked={showLightHeat} onChange={(e) => setShowLightHeat(e.target.checked)} />
                <span>Smartlight Density Grid</span>
              </label>
              <label className="toggle-item">
                <input type="checkbox" checked={showCrimeHeat} onChange={(e) => setShowCrimeHeat(e.target.checked)} />
                <span>Crime Hotspot Map</span>
              </label>
              <label className="toggle-item">
                <input type="checkbox" checked={showCrimePins} onChange={(e) => setShowCrimePins(e.target.checked)} />
                <span>Crime Incident Pins</span>
              </label>
              <label className="toggle-item">
                <input type="checkbox" checked={showStreetlightPins} onChange={(e) => setShowStreetlightPins(e.target.checked)} />
                <span>Streetlight Node Pins</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px' }}>
            <button onClick={() => setShowReportModal(true)} className="btn-login" style={{ background: '#3b82f6' }}>
              <i className="fa-solid fa-bullhorn" style={{ marginRight: '6px' }}></i> Report Safety Hazard
            </button>
            
            {role === "admin" && (
              <button onClick={() => onNavigate('admin')} className="btn-login" style={{ background: '#8b5cf6' }}>
                <i className="fa-solid fa-users-gear" style={{ marginRight: '6px' }}></i> Administrator Portal
              </button>
            )}

            <button onClick={onLogout} className="btn-login" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <i className="fa-solid fa-arrow-right-from-bracket" style={{ marginRight: '6px' }}></i> Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Floating SOS Trigger button */}
      <button onClick={triggerSOSAlert} className="btn-sos-floating">SOS</button>

      {/* Map Container */}
      <main id="map" ref={mapRef} style={{ background: '#020617', flex: 1, height: '100%' }}></main>

      {/* Floating AI Chatbot Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '96px', // Shifted left to avoid overlapping the SOS floating button
          zIndex: 9999,
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
          border: 'none',
          boxShadow: '0 8px 24px rgba(6, 182, 212, 0.4)',
          color: 'white',
          fontSize: '20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s'
        }}
      >
        {chatOpen ? <i className="fa-solid fa-xmark"></i> : <i className="fa-solid fa-comment-dots fa-shake"></i>}
      </button>

      {/* Floating Chatbot Window */}
      {chatOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '24px',
            zIndex: 9999,
            width: '320px',
            height: '400px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '16px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'Outfit, system-ui, sans-serif'
          }}
        >
          {/* Chat Header */}
          <div style={{ background: 'linear-gradient(90deg, rgba(6,182,212,0.15), rgba(59,130,246,0.15))', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
              <strong style={{ color: 'white', fontSize: '13px' }}>PathPal AI Assistant</strong>
            </div>
            <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer' }}>&times;</button>
          </div>

          {/* Chat Messages Body */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {chatMessages.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{
                  background: msg.sender === 'user' ? '#06b6d4' : 'rgba(255,255,255,0.05)',
                  color: msg.sender === 'user' ? 'white' : '#cbd5e1',
                  padding: '10px 14px',
                  borderRadius: msg.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  fontSize: '12.5px',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-line',
                  boxShadow: msg.sender === 'user' ? '0 2px 8px rgba(6,182,212,0.2)' : 'none'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatMessagesEndRef}></div>
          </div>

          {/* Chat Input Footer */}
          <form onSubmit={handleSendChatMessage} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px', display: 'flex', gap: '8px', background: 'rgba(2, 6, 23, 0.4)' }}>
            <input
              type="text"
              placeholder="Ask safety questions..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'white',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                background: '#06b6d4',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              <i className="fa-solid fa-paper-plane" style={{ fontSize: '11px' }}></i>
            </button>
          </form>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div id="report-modal" className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3><i className="fa-solid fa-bullhorn" style={{ color: '#ef4444', marginRight: '6px' }}></i> File Safety Report</h3>
              <button onClick={() => setShowReportModal(false)} className="btn-close-modal">&times;</button>
            </div>
            
            <form onSubmit={handleReportSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Hazard Category</label>
                <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="input-field" required>
                  <option value="" disabled>Select Incident Type</option>
                  <option value="Crime">Crime Proximity / Threat</option>
                  <option value="Broken Streetlight">Broken / Faulty Streetlight</option>
                  <option value="Accident">Road Accident / Blockage</option>
                  <option value="Unsafe Area">Unsafe Dark Area</option>
                  <option value="Harassment">Stalking / Harassment Proximity</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Location</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button type="button" onClick={() => {
                    setReportPicking(true);
                    setShowReportModal(false);
                  }} className="btn-pick" style={{ flex: 1, padding: '10px', marginBottom: 0 }}>
                    <i className="fa-solid fa-map-pin" style={{ color: '#ef4444' }}></i> Pick Point on Map
                  </button>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', flex: 1 }}>
                    Coords: <strong>{reportCoords ? `${reportCoords[0].toFixed(4)}, ${reportCoords[1].toFixed(4)}` : "Not Selected"}</strong>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Incident Time</label>
                <input type="time" value={reportTime} onChange={(e) => setReportTime(e.target.value)} className="input-field" required />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description</label>
                <textarea
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  className="input-field"
                  rows="3"
                  placeholder="Describe the hazard context..."
                  required
                  style={{ resize: 'none' }}
                />
              </div>

              <button type="submit" className="btn-login" style={{ marginTop: '10px' }} disabled={submittingReport}>
                {submittingReport ? "Submitting..." : "Submit Report"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
