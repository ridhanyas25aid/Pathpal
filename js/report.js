/**
 * Path Pal AI - Safety Reporting Controller
 * Handles user hazard reporting (Crimes, Outages, Accidents, Harassment) with map pin picking,
 * picture capture/upload, and pending Firestore status writes.
 */

class ReportManager {
  constructor() {
    this.reportLatLng = null;
    this.reportMarker = null;
    this.mapPickingMode = false;
    this.mapInstance = null;
  }

  /**
   * Set the Leaflet map reference
   * @param {L.Map} map 
   */
  setMap(map) {
    this.mapInstance = map;
  }

  /**
   * Activates map picking mode for reporting coordinates
   */
  startMapPicking() {
    this.mapPickingMode = true;
    alert("📍 Click anywhere on the map to mark the hazard location.");
    
    // Close the reporting modal temporarily to allow selection
    this.toggleModal(false);

    if (this.mapInstance) {
      this.mapInstance.once("click", (e) => {
        this.reportLatLng = [e.latlng.lat, e.latlng.lng];
        this.mapPickingMode = false;
        
        // Show selected feedback in console/UI
        console.log("Selected hazard coordinates:", this.reportLatLng);
        
        // Show report marker on map temporarily
        if (this.reportMarker) {
          this.mapInstance.removeLayer(this.reportMarker);
        }
        this.reportMarker = L.marker(this.reportLatLng, {
          icon: L.divIcon({
            html: '<div class="custom-report-pin">⚠️</div>',
            className: 'custom-leaflet-icon',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          })
        }).addTo(this.mapInstance);

        // Update the coords text in UI
        const coordsText = document.getElementById("report-coords-text");
        if (coordsText) {
          coordsText.textContent = `${this.reportLatLng[0].toFixed(5)}, ${this.reportLatLng[1].toFixed(5)}`;
        }

        // Reopen the modal
        this.toggleModal(true);
      });
    }
  }

  /**
   * Toggles the visibility of the report modal.
   * @param {boolean} visible 
   */
  toggleModal(visible) {
    const modal = document.getElementById("report-modal");
    if (modal) {
      modal.style.display = visible ? "flex" : "none";
    }
  }

  /**
   * Compress and convert file to Base64 string as fallback for Firestore
   * @param {File} file 
   * @returns {Promise<string>}
   */
  compressAndConvertImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          
          // Output compressed jpeg quality 0.7
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  /**
   * Submits the hazard report to Firebase.
   */
  async submitReport() {
    const type = document.getElementById("report-type").value;
    const desc = document.getElementById("report-desc").value.trim();
    const time = document.getElementById("report-time").value;
    const fileInput = document.getElementById("report-photo");
    const submitBtn = document.getElementById("btn-submit-report");

    if (!type || !desc || !time) {
      alert("Please fill in the incident category, description, and time.");
      return;
    }

    if (!this.reportLatLng) {
      alert("Please select a location on the map using the 'Pick Location' button.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Submitting...</span> <i class="fa-solid fa-spinner fa-spin"></i>`;

    const user = auth.currentUser;
    let uid = "anonymous";
    let userName = "Anonymous Reporter";

    if (user) {
      uid = user.uid;
      try {
        const userDoc = await db.collection("users").doc(uid).get();
        if (userDoc.exists) {
          userName = userDoc.data().name || userName;
        }
      } catch (err) {
        console.warn("Could not load user profile for report:", err);
      }
    }

    let photoUrl = "";
    
    // Process image attachment if present
    if (fileInput && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      try {
        // Attempt upload to Firebase Storage
        const storageRef = storage.ref(`reports/${Date.now()}_${uid}_${file.name}`);
        const snapshot = await storageRef.put(file);
        photoUrl = await snapshot.ref.getDownloadURL();
        console.log("Image uploaded to Firebase Storage:", photoUrl);
      } catch (storageErr) {
        console.warn("Firebase Storage unavailable or permission denied. Falling back to compressed Base64 inline storage in Firestore...", storageErr);
        try {
          photoUrl = await this.compressAndConvertImage(file);
        } catch (compressErr) {
          console.error("Failed to compress image:", compressErr);
        }
      }
    }

    // Save report document in Firestore under 'reports'
    try {
      await db.collection("reports").add({
        type: type,
        description: desc,
        time: time,
        latitude: this.reportLatLng[0],
        longitude: this.reportLatLng[1],
        photoUrl: photoUrl,
        status: "Pending", // Reports remain pending until approved by admin
        userId: uid,
        userName: userName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      alert("Thank you! Your report has been submitted for review. It will be added to the navigation risk assessments once approved by an administrator.");
      
      // Clear variables and close modal
      document.getElementById("report-form").reset();
      const coordsText = document.getElementById("report-coords-text");
      if (coordsText) coordsText.textContent = "Not Selected";
      
      if (this.reportMarker && this.mapInstance) {
        this.mapInstance.removeLayer(this.reportMarker);
        this.reportMarker = null;
      }
      this.reportLatLng = null;
      this.toggleModal(false);

    } catch (fsErr) {
      console.error("Failed to write report to Firestore:", fsErr);
      alert(`Database Error: ${fsErr.message}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Submit Report</span>`;
    }
  }
}

window.Report = new ReportManager();
