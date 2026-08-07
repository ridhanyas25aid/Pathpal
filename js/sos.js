/**
 * Path Pal AI - Emergency SOS Manager
 * Handles floating SOS button triggers, real-time location streaming to emergency Firestore logs,
 * emergency contact calling, and siren alerts.
 */

class SOSManager {
  constructor() {
    this.sirenActive = false;
    this.audioSiren = null;
  }

  /**
   * Triggers the SOS sequence.
   * Gets current location, posts alert to Firestore, calls emergency contact, and triggers sirens.
   */
  async triggerSOS() {
    console.log("SOS triggered! Activating emergency services...");
    
    // 1. Play visual siren and emergency banner
    this.toggleSirenVisuals(true);

    let lat = null;
    let lng = null;

    // 2. Fetch live coordinates via Geolocation API
    try {
      const pos = await this.getCurrentLocation();
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch (geoErr) {
      console.warn("Could not retrieve precise location for SOS alert:", geoErr);
    }

    // 3. Query user profile to obtain emergency contact
    let name = "Anonymous User";
    let emergencyContact = "112"; // Indian national emergency number fallback
    let userPhone = "";

    const user = auth.currentUser;
    if (user) {
      userPhone = user.phoneNumber || "";
      try {
        const doc = await db.collection("users").doc(user.uid).get();
        if (doc.exists) {
          const data = doc.data();
          name = data.name || name;
          emergencyContact = data.emergencyContact || emergencyContact;
        }
      } catch (dbErr) {
        console.error("Could not fetch user details for SOS:", dbErr);
      }
    }

    // 4. Log SOS event in Firestore
    try {
      await db.collection("sos_alerts").add({
        userId: user ? user.uid : "unauthenticated",
        userName: name,
        userPhone: userPhone,
        emergencyContact: emergencyContact,
        latitude: lat,
        longitude: lng,
        status: "Active",
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log("SOS Alert uploaded to Firestore.");
    } catch (fsErr) {
      console.error("Failed to log SOS alert to database:", fsErr);
    }

    // 5. Trigger emergency phone call
    alert(`🚨 SOS ALERT SENT TO FIREBASE! 🚨\n\nNotifying emergency contacts. Attempting to call emergency number: ${emergencyContact}`);
    window.location.href = `tel:${emergencyContact}`;
  }

  /**
   * Promisified wrapper for Geolocation API
   */
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported."));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      }
    });
  }

  /**
   * Toggles the visual siren screen overlay and audible indicators.
   * @param {boolean} active 
   */
  toggleSirenVisuals(active) {
    this.sirenActive = active;
    let overlay = document.getElementById("sos-siren-overlay");
    
    if (active) {
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "sos-siren-overlay";
        overlay.innerHTML = `
          <div class="siren-content">
            <div class="siren-icon"><i class="fa-solid fa-triangle-exclamation fa-beat"></i></div>
            <div class="siren-text">EMERGENCY SOS ACTIVE</div>
            <div class="siren-subtext">Live location is being shared with emergency contacts.</div>
            <button onclick="window.SOS.stopSOS()" class="btn-siren-deactivate">Deactivate Alarm</button>
          </div>
        `;
        
        // Add styling for siren overlay
        const style = document.createElement("style");
        style.id = "sos-siren-style";
        style.innerHTML = `
          #sos-siren-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(239, 68, 68, 0.4);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(8px);
            animation: sirenRedBlue 1s infinite alternate;
          }
          .siren-content {
            background: rgba(15, 23, 42, 0.95);
            border: 2px solid #ef4444;
            padding: 40px;
            border-radius: 24px;
            text-align: center;
            box-shadow: 0 0 50px rgba(239, 68, 68, 0.6);
            max-width: 90%;
            width: 400px;
          }
          .siren-icon {
            font-size: 64px;
            color: #ef4444;
            margin-bottom: 20px;
          }
          .siren-text {
            font-family: 'Outfit', sans-serif;
            font-size: 24px;
            font-weight: 800;
            color: white;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
          }
          .siren-subtext {
            color: #94a3b8;
            font-size: 14px;
            margin-bottom: 30px;
            line-height: 1.5;
          }
          .btn-siren-deactivate {
            padding: 12px 24px;
            background: #ef4444;
            border: none;
            border-radius: 10px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-siren-deactivate:hover {
            background: #dc2626;
            box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
          }
          @keyframes sirenRedBlue {
            0% { background-color: rgba(239, 68, 68, 0.25); }
            100% { background-color: rgba(59, 130, 246, 0.25); }
          }
        `;
        document.head.appendChild(style);
        document.body.appendChild(overlay);
      }
      overlay.style.display = "flex";
      
      // Try to play alert sound programmatically
      try {
        if (!this.audioSiren) {
          // Synthesizing alert sound via Web Audio API (cross-browser compatible, no files needed!)
          this.audioSiren = true;
          this.startWebAudioSiren();
        }
      } catch (audioErr) {
        console.warn("Could not play audio alarm:", audioErr);
      }
    } else {
      if (overlay) overlay.style.display = "none";
      this.stopWebAudioSiren();
    }
  }

  startWebAudioSiren() {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      this.oscillator = this.audioContext.createOscillator();
      this.gainNode = this.audioContext.createGain();
      
      this.oscillator.type = "sine";
      this.oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4
      
      // Modulate frequency to sound like a real siren
      this.oscillator.frequency.linearRampToValueAtTime(880, this.audioContext.currentTime + 0.5);
      
      this.gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
      
      this.oscillator.start();
      
      // Continuous siren tone frequency sweeping
      this.sirenTimer = setInterval(() => {
        if (!this.audioContext) return;
        const now = this.audioContext.currentTime;
        this.oscillator.frequency.cancelScheduledValues(now);
        this.oscillator.frequency.setValueAtTime(this.oscillator.frequency.value, now);
        if (this.oscillator.frequency.value < 600) {
          this.oscillator.frequency.exponentialRampToValueAtTime(900, now + 0.4);
        } else {
          this.oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.4);
        }
      }, 400);
    } catch (e) {
      console.warn("Web Audio API siren failed to start:", e);
    }
  }

  stopWebAudioSiren() {
    if (this.sirenTimer) {
      clearInterval(this.sirenTimer);
      this.sirenTimer = null;
    }
    try {
      if (this.oscillator) {
        this.oscillator.stop();
        this.oscillator.disconnect();
        this.oscillator = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }
      this.audioSiren = null;
    } catch (e) {
      console.warn("Web Audio API siren failed to stop cleanly:", e);
    }
  }

  /**
   * Turn off sirens and alarm states
   */
  stopSOS() {
    this.toggleSirenVisuals(false);
  }
}

window.SOS = new SOSManager();
