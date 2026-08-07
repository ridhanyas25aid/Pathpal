/**
 * India SafeNav - Seed National Data
 * Dataset containing Streetlights, Crime Incidents, and Preset Routes across India.
 */

window.SEED_DATA = (function () {
  // --- STREETLIGHTS DATA (100+ Nodes across India urban & highway corridors) ---
  const streetlights = [
    // Delhi - Jaipur Corridor (NH48)
    { id: "SL-DEL-01", lat: 28.6139, lng: 77.2090, status: "working", lumens: 12000, type: "Smart LED", pole: "NDMC-DEL-01", street: "Rajpath, New Delhi" },
    { id: "SL-DEL-02", lat: 28.5605, lng: 77.1700, status: "working", lumens: 12000, type: "Smart LED", pole: "NDMC-DEL-02", street: "RTR Flyover Outer Ring" },
    { id: "SL-GGN-01", lat: 28.4595, lng: 77.0266, status: "working", lumens: 14000, type: "Smart LED Corridor", pole: "GMDA-GGN-01", street: "IFFCO Chowk, Gurugram" },
    { id: "SL-GGN-02", lat: 28.4350, lng: 77.0020, status: "working", lumens: 10000, type: "Solar LED", pole: "GMDA-GGN-02", street: "Sohna Road Stretch" },
    { id: "SL-GGN-03", lat: 28.3516, lng: 76.9427, status: "faulty", lumens: 0, type: "Sodium Vapor", pole: "NHAI-MNS-01", street: "Manesar industrial Corridor" },
    { id: "SL-NH48-01", lat: 28.2120, lng: 76.7915, status: "working", lumens: 15000, type: "High-Bay LED", pole: "NHAI-NH48-01", street: "Dharuhera Toll Plaza" },
    { id: "SL-NH48-02", lat: 28.0500, lng: 76.6100, status: "dim", lumens: 3500, type: "Halogen", pole: "NHAI-NH48-02", street: "Bawal Bypass highway" },
    { id: "SL-NH48-03", lat: 27.8900, lng: 76.3800, status: "working", lumens: 15000, type: "High-Bay LED", pole: "NHAI-NH48-03", street: "Behror Bypass" },
    { id: "SL-NH48-04", lat: 27.7051, lng: 76.2045, status: "faulty", lumens: 0, type: "Sodium Vapor", pole: "NHAI-NH48-04", street: "Kotputli Junction Underpass" },
    { id: "SL-NH48-05", lat: 27.3500, lng: 75.9800, status: "working", lumens: 12000, type: "Smart LED", pole: "NHAI-NH48-05", street: "Shahpura Highway Sec" },
    { id: "SL-JAI-01", lat: 26.9124, lng: 75.7873, status: "working", lumens: 12000, type: "Heritage LED", pole: "JDA-JAI-01", street: "Ajmeri Gate, Jaipur" },
    { id: "SL-JAI-02", lat: 26.9200, lng: 75.8200, status: "working", lumens: 10000, type: "Smart LED", pole: "JDA-JAI-02", street: "Pink City Walled Gate" },

    // Mumbai - Pune Corridor (Expressway vs. Old Highway)
    { id: "SL-MUM-01", lat: 19.0760, lng: 72.8777, status: "working", lumens: 12000, type: "Smart LED", pole: "MCGM-MUM-01", street: "Bandra-Worli Sea Link Entrance" },
    { id: "SL-MUM-02", lat: 19.0200, lng: 72.8500, status: "working", lumens: 12000, type: "Smart LED", pole: "MCGM-MUM-02", street: "Dadar TT Circle Corridor" },
    { id: "SL-MUM-03", lat: 19.0330, lng: 73.0297, status: "working", lumens: 14000, type: "High-Bay LED", pole: "NMMC-VSH-01", street: "Vashi Bridge Highway Deck" },
    { id: "SL-MUM-04", lat: 19.0150, lng: 73.0900, status: "faulty", lumens: 0, type: "Sodium Vapor", pole: "NMMC-BEL-02", street: "CBD Belapur Underpass" },
    { id: "SL-MPE-01", lat: 18.9100, lng: 73.1900, status: "working", lumens: 15000, type: "High-Bay LED", pole: "MSRDC-MPE-01", street: "Panvel Expressway Bypass" },
    { id: "SL-MPE-02", lat: 18.7900, lng: 73.3200, status: "working", lumens: 15000, type: "High-Bay LED", pole: "MSRDC-MPE-02", street: "Khalapur Toll Plaza" },
    { id: "SL-MPE-03", lat: 18.7557, lng: 73.4091, status: "working", lumens: 14000, type: "Smart LED Corridor", pole: "MSRDC-LNV-01", street: "Lonavala Khandala Tunnel Area" },
    { id: "SL-MPE-04", lat: 18.7302, lng: 73.6826, status: "faulty", lumens: 0, type: "Sodium Vapor", pole: "MSRDC-TLG-01", street: "Talegaon Toll Exit Ramp" },
    { id: "SL-PUN-01", lat: 18.5204, lng: 73.8567, status: "working", lumens: 12000, type: "Smart LED", pole: "PMC-PUN-01", street: "Shivajinagar Chowk, Pune" },
    { id: "SL-PUN-02", lat: 18.5600, lng: 73.8000, status: "working", lumens: 10000, type: "Solar LED", pole: "PMC-PUN-02", street: "Aundh Main Road" },
    { id: "SL-PUN-03", lat: 18.4900, lng: 73.9300, status: "dim", lumens: 4500, type: "Sodium Vapor", pole: "PMC-PUN-03", street: "Hadapsar Industrial Alley" },

    // Bengaluru - Chennai Corridor (NH44 & NH48)
    { id: "SL-BLR-01", lat: 12.9716, lng: 77.5946, status: "working", lumens: 12000, type: "Smart LED", pole: "BBMP-BLR-01", street: "MG Road Metro Boulevard, Bengaluru" },
    { id: "SL-BLR-02", lat: 12.9352, lng: 77.6245, status: "working", lumens: 11000, type: "Smart LED", pole: "BBMP-BLR-02", street: "Koramangala 80ft Road" },
    { id: "SL-BLR-03", lat: 12.9150, lng: 77.6250, status: "working", lumens: 14000, type: "High-Bay LED", pole: "BBMP-BLR-03", street: "Silk Board Flyover Entrance" },
    { id: "SL-BLR-04", lat: 12.8450, lng: 77.6600, status: "working", lumens: 12000, type: "Smart LED", pole: "BBMP-BLR-04", street: "Electronic City Expressway Deck" },
    { id: "SL-BLR-05", lat: 12.8520, lng: 77.6400, status: "faulty", lumens: 0, type: "Sodium Vapor", pole: "BBMP-BLR-05", street: "Singasandra Service Lane" },
    { id: "SL-HSR-01", lat: 12.7409, lng: 77.8253, status: "working", lumens: 12000, type: "Smart LED", pole: "NHAI-HSR-01", street: "Hosur Outer Ring Road" },
    { id: "SL-KRI-01", lat: 12.5186, lng: 78.2137, status: "working", lumens: 15000, type: "High-Bay LED", pole: "NHAI-KRI-01", street: "Krishnagiri Highway Interchange" },
    { id: "SL-NH48-C1", lat: 12.7800, lng: 78.7100, status: "dim", lumens: 3800, type: "Halogen", pole: "NHAI-NH48-C1", street: "Ambur Highway Section" },
    { id: "SL-VEL-01", lat: 12.9165, lng: 79.1325, status: "working", lumens: 12000, type: "Smart LED", pole: "VMC-VEL-01", street: "Vellore Bypass Road" },
    { id: "SL-KAN-01", lat: 12.8342, lng: 79.7036, status: "faulty", lumens: 0, type: "Halogen", pole: "NHAI-KAN-01", street: "Kanchipuram Outer Bypass" },
    { id: "SL-CHE-01", lat: 13.0827, lng: 80.2707, status: "working", lumens: 12000, type: "Smart LED", pole: "GCC-CHE-01", street: "Marina Beach Road, Chennai" },
    { id: "SL-CHE-02", lat: 13.0400, lng: 80.2500, status: "working", lumens: 10000, type: "Solar LED", pole: "GCC-CHE-02", street: "T-Nagar Commercial Zone" },

    // Kolkata - Siliguri Corridor (NH12)
    { id: "SL-KOL-01", lat: 22.5726, lng: 88.3639, status: "working", lumens: 12000, type: "Smart LED", pole: "KMC-KOL-01", street: "Park Street Boulevard, Kolkata" },
    { id: "SL-KOL-02", lat: 22.5850, lng: 88.3450, status: "working", lumens: 14000, type: "High-Bay LED", pole: "KMC-KOL-02", street: "Howrah Bridge Deck Corridor" },
    { id: "SL-KOL-03", lat: 22.7300, lng: 88.3700, status: "faulty", lumens: 0, type: "Sodium Vapor", pole: "KMC-KOL-03", street: "Kalyani Expressway Ramp" },
    { id: "SL-NH12-01", lat: 23.4000, lng: 88.5000, status: "working", lumens: 11000, type: "Smart LED", pole: "NHAI-NH12-01", street: "Krishnanagar Junction" },
    { id: "SL-NH12-02", lat: 24.1000, lng: 88.2500, status: "dim", lumens: 3500, type: "Halogen", pole: "NHAI-NH12-02", street: "Baharampur Outer Bypass" },
    { id: "SL-NH12-03", lat: 24.7900, lng: 87.9300, status: "faulty", lumens: 0, type: "Sodium Vapor", pole: "NHAI-NH12-03", street: "Farakka Barrage Dark Section" },
    { id: "SL-MLD-01", lat: 25.0000, lng: 88.1400, status: "working", lumens: 12000, type: "Smart LED", pole: "NBDD-MLD-01", street: "Malda Town Bypass" },
    { id: "SL-RGN-01", lat: 25.6200, lng: 88.1200, status: "working", lumens: 11000, type: "Solar LED", pole: "NHAI-RGN-01", street: "Raiganj Main Highway" },
    { id: "SL-SLG-01", lat: 26.7271, lng: 88.3953, status: "working", lumens: 12000, type: "Smart LED", pole: "SMC-SLG-01", street: "Hill Cart Road, Siliguri" },
    { id: "SL-SLG-02", lat: 26.7150, lng: 88.4300, status: "working", lumens: 10000, type: "Solar LED", pole: "SMC-SLG-02", street: "Sevoke Road Corridor" },

    // National Highway 44 (Kashmir to Kanyakumari - sample points in Central India)
    { id: "SL-HYD-01", lat: 17.3850, lng: 78.4867, status: "working", lumens: 12000, type: "Smart LED", pole: "GHMC-HYD-01", street: "Charminar Heritage Area, Hyderabad" },
    { id: "SL-HYD-02", lat: 17.4400, lng: 78.3800, status: "working", lumens: 12000, type: "Smart LED", pole: "GHMC-HYD-02", street: "Gachibowli Tech Corridor" },
    { id: "SL-HYD-03", lat: 17.2500, lng: 78.4300, status: "faulty", lumens: 0, type: "Sodium Vapor", pole: "GHMC-HYD-03", street: "Shamshabad Airport Exit Underpass" },
    { id: "SL-NGP-01", lat: 21.1458, lng: 79.0882, status: "working", lumens: 12000, type: "Smart LED", pole: "NMC-NGP-01", street: "Zero Mile Stone Circle, Nagpur" },
    { id: "SL-NGP-02", lat: 21.1800, lng: 79.1500, status: "dim", lumens: 4000, type: "Sodium Vapor", pole: "NMC-NGP-02", street: "Pardi Flyover Construction road" }
  ];

  // Populate synthetic intermediate highway lights (generating up to 100 streetlights total)
  // We generate programmatic streetlight points along coordinate ranges to ensure data density
  const syntheticBases = [
    { start: [28.6139, 77.2090], end: [26.9124, 75.7873], prefix: "SL-NH48-S", count: 12 }, // Delhi-Jaipur
    { start: [19.0760, 72.8777], end: [18.5204, 73.8567], prefix: "SL-MPE-S", count: 12 },  // Mumbai-Pune
    { start: [12.9716, 77.5946], end: [13.0827, 80.2707], prefix: "SL-BLRCHE-S", count: 15 }, // BLR-CHE
    { start: [22.5726, 88.3639], end: [26.7271, 88.3953], prefix: "SL-KOLSLG-S", count: 18 }  // KOL-SLG
  ];

  syntheticBases.forEach(group => {
    for (let i = 1; i <= group.count; i++) {
      const ratio = i / (group.count + 1);
      const lat = group.start[0] + (group.end[0] - group.start[0]) * ratio;
      const lng = group.start[1] + (group.end[1] - group.start[1]) * ratio;
      const status = (i % 6 === 0) ? "faulty" : (i % 8 === 0) ? "dim" : "working";
      const lumens = status === "working" ? 12000 : status === "dim" ? 4000 : 0;
      streetlights.push({
        id: `${group.prefix}-${i}`,
        lat: parseFloat(lat.toFixed(5)),
        lng: parseFloat(lng.toFixed(5)),
        status: status,
        lumens: lumens,
        type: status === "working" ? "Smart LED" : "Sodium Vapor",
        pole: `NHAI-GEN-${group.prefix}-${i}`,
        street: `National Highway Section Mile ${i * group.count}`
      });
    }
  });


  // --- CRIME INCIDENTS DATA (45 Seed points with Severity, Time, Type & Lighting context) ---
  const crimeIncidents = [
    // Delhi NCR & NH48 Corridor
    { id: "CRM-DEL-01", lat: 28.5300, lng: 77.1500, type: "Snatching", severity: "Medium", time: "21:30", risk_score: 70, lighting: "Dim Lights", desc: "Chain snatching on poorly lit ring road service lane.", date: "2026-07-28" },
    { id: "CRM-GGN-01", lat: 28.4800, lng: 77.0800, type: "Vehicle Theft", severity: "High", time: "23:45", risk_score: 85, lighting: "Unlit Parking Area", desc: "Car theft reported from unmonitored dark lane near commercial hub.", date: "2026-07-29" },
    { id: "CRM-MNS-01", lat: 28.3516, lng: 76.9427, type: "Snatching", severity: "High", time: "22:15", risk_score: 80, lighting: "Complete Outage", desc: "Phone snatching near dark industrial factory gate.", date: "2026-07-27" },
    { id: "CRM-NH48-01", lat: 28.1800, lng: 76.7500, type: "Highway Robbery", severity: "High", time: "01:20", risk_score: 95, lighting: "No Lighting", desc: "Forced vehicle stop and robbery by bike gang.", date: "2026-07-26" },
    { id: "CRM-NH48-02", lat: 27.7051, lng: 76.2045, type: "Vehicle Theft", severity: "Medium", time: "02:30", risk_score: 68, lighting: "Faulty Streetlights", desc: "Theft of motorcycle parked near highway dhaba underpass.", date: "2026-07-22" },
    { id: "CRM-JAI-01", lat: 26.8900, lng: 75.7500, type: "Pickpocketing", severity: "Low", time: "19:40", risk_score: 45, lighting: "Working Lights", desc: "Wallet stolen in crowded but dim bus depot shelter.", date: "2026-07-18" },

    // Mumbai - Pune Corridor
    { id: "CRM-MUM-01", lat: 19.0400, lng: 72.8600, type: "Phone Snatching", severity: "Medium", time: "20:50", risk_score: 65, lighting: "Dim Corridor", desc: "Pedestrian phone snatching near suburban rail entry.", date: "2026-07-30" },
    { id: "CRM-BEL-01", lat: 19.0150, lng: 73.0900, type: "Harassment", severity: "High", time: "23:05", risk_score: 90, lighting: "Unlit Underpass", desc: "Verbal harassment of female commuter in dark subway.", date: "2026-07-28" },
    { id: "CRM-KHP-01", lat: 18.7910, lng: 73.3210, type: "Vandalism", severity: "Low", time: "02:00", risk_score: 40, lighting: "Dim Light", desc: "Stone throwing incident reported on expressway service track.", date: "2026-07-24" },
    { id: "CRM-LNV-01", lat: 18.7565, lng: 73.4095, type: "Theft", severity: "Medium", time: "22:40", risk_score: 60, lighting: "Faulty Lights", desc: "Luggage stolen from parked tourist vehicle at scenic point.", date: "2026-07-20" },
    { id: "CRM-TLG-01", lat: 18.7302, lng: 73.6826, type: "Highway Robbery", severity: "High", time: "00:45", risk_score: 92, lighting: "Complete Darkness", desc: "Robbery targeting truck drivers resting at unlit exit.", date: "2026-07-15" },
    { id: "CRM-PUN-01", lat: 18.4905, lng: 73.9305, type: "Vehicle Theft", severity: "Medium", time: "03:15", risk_score: 72, lighting: "Unlit Stretch", desc: "Two-wheeler stolen outside industrial workshop.", date: "2026-07-12" },

    // Bengaluru - Chennai Corridor
    { id: "CRM-BLR-01", lat: 12.8525, lng: 77.6405, type: "Attempted Robbery", severity: "High", time: "01:10", risk_score: 95, lighting: "Complete Darkness", desc: "Attempted mugging near unlit railway line underpass.", date: "2026-07-25" },
    { id: "CRM-HSR-01", lat: 12.7415, lng: 77.8258, type: "Snatching", severity: "Medium", time: "21:15", risk_score: 64, lighting: "Dim Lights", desc: "Chain snatching incident near border checkpost lane.", date: "2026-07-23" },
    { id: "CRM-AMB-01", lat: 12.7805, lng: 78.7105, type: "Vehicle Theft", severity: "Medium", time: "23:50", risk_score: 70, lighting: "Unlit Service Lane", desc: "Motorcycle stolen outside highway eatery.", date: "2026-07-19" },
    { id: "CRM-KAN-01", lat: 12.8345, lng: 79.7040, type: "Highway Robbery", severity: "High", time: "02:10", risk_score: 88, lighting: "No Lighting", desc: "Vehicle tires slashed and occupants mugged on unlit bypass.", date: "2026-07-14" },
    { id: "CRM-CHE-01", lat: 13.0600, lng: 80.2600, type: "Phone Snatching", severity: "Medium", time: "22:00", risk_score: 62, lighting: "Dim Corner", desc: "Phone snatched from pedestrian walking near beach alley.", date: "2026-07-10" },

    // Kolkata - Siliguri Corridor
    { id: "CRM-KOL-01", lat: 22.7305, lng: 88.3705, type: "Attempted Robbery", severity: "High", time: "23:30", risk_score: 89, lighting: "Unlit Expressway Ramp", desc: "Armed robbery attempt near deserted expressway crossing.", date: "2026-07-28" },
    { id: "CRM-BHP-01", lat: 24.1005, lng: 88.2505, type: "Snatching", severity: "Medium", time: "20:45", risk_score: 66, lighting: "Broken Streetlamps", desc: "Bag snatching near poorly lit bus terminus.", date: "2026-07-25" },
    { id: "CRM-FAR-01", lat: 24.7905, lng: 87.9305, type: "Highway Robbery", severity: "High", time: "01:50", risk_score: 96, lighting: "Complete Darkness", desc: "Highway gang intercepted goods vehicle on dark bridge section.", date: "2026-07-21" },
    { id: "CRM-RGN-01", lat: 25.6205, lng: 88.1205, type: "Vehicle Theft", severity: "Medium", time: "22:30", risk_score: 60, lighting: "Dim Highway Area", desc: "Truck parts stolen while driver slept on unlit shoulder.", date: "2026-07-17" },
    { id: "CRM-SLG-01", lat: 26.7155, lng: 88.4305, type: "Snatching", severity: "Medium", time: "21:00", risk_score: 68, lighting: "Dim Lights", desc: "Snatching near junction access path.", date: "2026-07-11" }
  ];

  // Generate synthetic incidents to reach 40+ nodes total
  const syntheticCrimeBases = [
    { start: [28.6139, 77.2090], end: [26.9124, 75.7873], prefix: "CRM-NH48-S", count: 6 }, // Delhi-Jaipur
    { start: [19.0760, 72.8777], end: [18.5204, 73.8567], prefix: "CRM-MPE-S", count: 5 },  // Mumbai-Pune
    { start: [12.9716, 77.5946], end: [13.0827, 80.2707], prefix: "CRM-BLRCHE-S", count: 6 }, // BLR-CHE
    { start: [22.5726, 88.3639], end: [26.7271, 88.3953], prefix: "CRM-KOLSLG-S", count: 6 }  // KOL-SLG
  ];

  syntheticCrimeBases.forEach(group => {
    for (let i = 1; i <= group.count; i++) {
      const ratio = (i - 0.5) / group.count; // Offset to avoid overlapping streetlights
      const lat = group.start[0] + (group.end[0] - group.start[0]) * ratio + (Math.random() - 0.5) * 0.02;
      const lng = group.start[1] + (group.end[1] - group.start[1]) * ratio + (Math.random() - 0.5) * 0.02;
      const severity = i % 3 === 0 ? "High" : i % 3 === 1 ? "Medium" : "Low";
      const risk_score = severity === "High" ? 85 + i : severity === "Medium" ? 65 + i : 40 + i;
      crimeIncidents.push({
        id: `${group.prefix}-${i}`,
        lat: parseFloat(lat.toFixed(5)),
        lng: parseFloat(lng.toFixed(5)),
        type: severity === "High" ? "Highway Robbery" : severity === "Medium" ? "Snatching" : "Pickpocketing",
        severity: severity,
        time: `${20 + i % 4}:${i * 10 % 60}`,
        risk_score: risk_score,
        lighting: severity === "High" ? "Complete Darkness" : "Dim Lighting",
        desc: "Synthesized security concern near highway milestone.",
        date: "2026-07-20"
      });
    }
  });


  // --- PRESET ROUTE SCENARIOS IN INDIA ---
  const presetRoutes = [
    {
      id: "route-del-jai",
      name: "New Delhi (Rajpath) ➔ Jaipur (Ajmeri Gate)",
      city: "Delhi NCR ➔ Rajasthan",
      distance_km: "268.0 km",
      fastest: {
        time_min: 290,
        safety_score: 52,
        lighting_pct: 48,
        high_risk_zones: 3,
        description: "Via NH 48 Direct Highway. Fast but features dark underpasses near Manesar (SL-GGN-03) and Kotputli (SL-NH48-04, CRM-NH48-02) with active robbery spots.",
        path: [
          [28.6139, 77.2090], // Delhi Start
          [28.4595, 77.0266], // Gurugram
          [28.3516, 76.9427], // Manesar Outage
          [28.2120, 76.7915], // Dharuhera Toll
          [28.0500, 76.6100], // Bawal bypass
          [27.7051, 76.2045], // Kotputli Crime Hotspot
          [27.3500, 75.9800], // Shahpura
          [26.9124, 75.7873]  // Jaipur End
        ]
      },
      safest: {
        time_min: 320,
        safety_score: 93,
        lighting_pct: 95,
        high_risk_zones: 0,
        description: "Via NH 48 smart green corridor with detour to bypass dark underpasses. Incorporates 100% working LEDs, highway patrols, and emergency help desks.",
        path: [
          [28.6139, 77.2090], // Delhi Start
          [28.5605, 77.1700], // Safely lit Ring Rd
          [28.4595, 77.0266], // Gurugram Smart LED
          [28.4350, 77.0020], // Sohna Road Solar lights
          [28.2120, 76.7915], // Dharuhera Toll
          [27.8900, 76.3800], // Behror Bypass Smart lights
          [27.3500, 75.9800], // Shahpura
          [26.9124, 75.7873]  // Jaipur End
        ]
      }
    },
    {
      id: "route-mum-pun",
      name: "Mumbai (Dadar) ➔ Pune (Shivajinagar)",
      city: "Mumbai ➔ Pune Corridor",
      distance_km: "148.0 km",
      fastest: {
        time_min: 165,
        safety_score: 48,
        lighting_pct: 42,
        high_risk_zones: 4,
        description: "Via Old Mumbai-Pune Highway cut-roads. Narrow lanes, poor lighting near Talegaon (SL-MPE-04, CRM-TLG-01), and winding dark turns with high theft index.",
        path: [
          [19.0200, 72.8500], // Dadar Start
          [19.0150, 73.0900], // CBD Belapur Outage (CRM-BEL-01)
          [18.9100, 73.1900], // Panvel bypass
          [18.7557, 73.4091], // Lonavala Old Rd
          [18.7302, 73.6826], // Talegaon dark zone (CRM-TLG-01)
          [18.5204, 73.8567]  // Pune End
        ]
      },
      safest: {
        time_min: 190,
        safety_score: 95,
        lighting_pct: 97,
        high_risk_zones: 0,
        description: "Via Yashwantrao Chavan Mumbai-Pune Expressway. 6-lane high-bay lighting, illuminated tunnels, CCTV cameras, and 24/7 motorway highway patrol.",
        path: [
          [19.0760, 72.8777], // Bandra Start
          [19.0330, 73.0297], // Vashi Bridge Deck
          [18.9100, 73.1900], // Panvel Expressway Entry
          [18.7900, 73.3200], // Khalapur Toll Plaza
          [18.7557, 73.4091], // Lonavala Smart Tunnel Area
          [18.5600, 73.8000], // Aundh road
          [18.5204, 73.8567]  // Pune End
        ]
      }
    },
    {
      id: "route-blr-che",
      name: "Bengaluru (MG Road) ➔ Chennai (Marina Beach)",
      city: "Bengaluru ➔ Chennai Corridor",
      distance_km: "346.0 km",
      fastest: {
        time_min: 360,
        safety_score: 55,
        lighting_pct: 52,
        high_risk_zones: 3,
        description: "Via Hosur Road direct NH 48. High commercial truck traffic, dim stretches near Ambur (SL-NH48-C1) and complete dark bypass at Kanchipuram (SL-KAN-01, CRM-KAN-01).",
        path: [
          [12.9716, 77.5946], // Bengaluru Start
          [12.8520, 77.6400], // Singasandra Outage
          [12.7409, 77.8253], // Hosur
          [12.5186, 78.2137], // Krishnagiri
          [12.7800, 78.7100], // Ambur dim stretch
          [12.8342, 79.7036], // Kanchipuram bypass (CRM-KAN-01)
          [13.0827, 80.2707]  // Chennai End
        ]
      },
      safest: {
        time_min: 395,
        safety_score: 92,
        lighting_pct: 94,
        high_risk_zones: 0,
        description: "Via NH 44 and NH 48 smart lit corridor, with well-illuminated bypass corridors and regular emergency helpline call boxes.",
        path: [
          [12.9716, 77.5946], // Bengaluru Start
          [12.9352, 77.6245], // Koramangala Smart Rd
          [12.9150, 77.6250], // Silk Board Elevated Entry
          [12.8450, 77.6600], // E-City Express Deck
          [12.7409, 77.8253], // Hosur Outer Ring
          [12.5186, 78.2137], // Krishnagiri Interchange
          [12.9165, 79.1325], // Vellore Bypass
          [13.0400, 80.2500], // T-Nagar Chennai
          [13.0827, 80.2707]  // Chennai End
        ]
      }
    },
    {
      id: "route-kol-slg",
      name: "Kolkata (Park Street) ➔ Siliguri (Hill Cart Rd)",
      city: "Kolkata ➔ North Bengal Corridor",
      distance_km: "585.0 km",
      fastest: {
        time_min: 710,
        safety_score: 45,
        lighting_pct: 35,
        high_risk_zones: 5,
        description: "Via direct NH 12 and rural cut-roads. Avoids primary routes but hits unlit state roads and the dark Farakka Barrage section (SL-NH12-03, CRM-FAR-01).",
        path: [
          [22.5726, 88.3639], // Kolkata Start
          [22.7300, 88.3700], // Kalyani Ramp Outage
          [23.4000, 88.5000], // Krishnanagar
          [24.1000, 88.2500], // Baharampur (CRM-BHP-01)
          [24.7900, 87.9300], // Farakka Barrage Outage (CRM-FAR-01)
          [25.0000, 88.1400], // Malda
          [25.6200, 88.1200], // Raiganj
          [26.7271, 88.3953]  // Siliguri End
        ]
      },
      safest: {
        time_min: 760,
        safety_score: 90,
        lighting_pct: 92,
        high_risk_zones: 0,
        description: "Via primary NH 12 highway with full high-bay illumination on bridges and major crossings, regular police checkpoint gates, and toll area coverage.",
        path: [
          [22.5726, 88.3639], // Kolkata Start
          [22.5850, 88.3450], // Howrah Bridge
          [23.4000, 88.5000], // Krishnanagar Smart section
          [25.0000, 88.1400], // Malda Town Bypass
          [25.6200, 88.1200], // Raiganj Main highway
          [26.7150, 88.4300], // Sevoke Road
          [26.7271, 88.3953]  // Siliguri End
        ]
      }
    }
  ];

  return {
    streetlights,
    crimeIncidents,
    presetRoutes
  };
})();
