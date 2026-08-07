/**
 * Path Pal AI - Administration Dashboard Script
 * Implements real-time synchronization with Firestore collections for user reports and profiles.
 * Provides functions to Approve, Reject, and Delete safety hazards.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Stats Elements
  const totalReportsEl = document.getElementById("stat-total-reports");
  const pendingReportsEl = document.getElementById("stat-pending-reports");
  const approvedReportsEl = document.getElementById("stat-approved-reports");
  const activeUsersEl = document.getElementById("stat-active-users");

  // Content Containers
  const reportsListContainer = document.getElementById("reports-list-container");
  const usersListContainer = document.getElementById("users-list-container");

  // 1. Establish Real-Time Listener on user reports
  db.collection("reports").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
    reportsListContainer.innerHTML = "";

    let total = 0;
    let pending = 0;
    let approved = 0;

    if (snapshot.empty) {
      reportsListContainer.innerHTML = `<div class="no-data">No safety reports have been logged in the system.</div>`;
      updateReportCounters(0, 0, 0);
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const id = doc.id;
      total++;
      
      if (data.status === "Pending") pending++;
      else if (data.status === "Approved") approved++;

      const dateStr = data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleString() : "Just now";
      
      const item = document.createElement("div");
      item.className = "report-item";
      item.innerHTML = `
        <div class="report-header">
          <span class="report-type-txt"><i class="fa-solid fa-triangle-exclamation" style="color:#ef4444; margin-right:6px;"></i> ${data.type}</span>
          <span class="report-badge ${data.status.toLowerCase()}">${data.status}</span>
        </div>
        <div class="report-body">${data.description}</div>
        
        ${data.photoUrl ? `<img src="${data.photoUrl}" class="report-photo-thumb" alt="Report image"/>` : ''}

        <div class="report-meta-row">
          <div class="report-meta-item"><i class="fa-solid fa-user"></i> By: <b>${data.userName || 'Anonymous'}</b></div>
          <div class="report-meta-item"><i class="fa-solid fa-clock"></i> Time: <b>${data.time}</b></div>
          <div class="report-meta-item"><i class="fa-solid fa-location-crosshairs"></i> Pos: <b>${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}</b></div>
          <div class="report-meta-item"><i class="fa-solid fa-calendar-day"></i> Logged: <b>${dateStr}</b></div>
        </div>

        <div class="report-actions">
          ${data.status === "Pending" ? `
            <button onclick="approveReport('${id}')" class="btn-action btn-approve"><i class="fa-solid fa-check"></i> Approve</button>
            <button onclick="rejectReport('${id}')" class="btn-action btn-reject"><i class="fa-solid fa-xmark"></i> Reject</button>
          ` : ''}
          <button onclick="deleteReport('${id}')" class="btn-action btn-delete"><i class="fa-solid fa-trash-can"></i> Delete</button>
        </div>
      `;
      reportsListContainer.appendChild(item);
    });

    updateReportCounters(total, pending, approved);
  }, (error) => {
    console.error("Failed to sync reports:", error);
    reportsListContainer.innerHTML = `<div class="no-data" style="color:#ef4444;">Access Denied. Ensure your account role is set as 'admin'.</div>`;
  });

  // 2. Establish Real-Time Listener on users profiles
  db.collection("users").orderBy("name", "asc").onSnapshot((snapshot) => {
    usersListContainer.innerHTML = "";
    
    if (snapshot.empty) {
      usersListContainer.innerHTML = `<div class="no-data">No users registered.</div>`;
      activeUsersEl.textContent = "0";
      return;
    }

    activeUsersEl.textContent = snapshot.size;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const initials = data.name ? data.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "U";

      const item = document.createElement("div");
      item.className = "user-item";
      item.innerHTML = `
        <div class="user-avatar">${initials}</div>
        <div class="user-info">
          <div class="user-name">${data.name}</div>
          <div class="user-phone">${data.phone} • Emergency: ${data.emergencyContact}</div>
        </div>
        <span class="user-badge ${data.role}">${data.role}</span>
      `;
      usersListContainer.appendChild(item);
    });
  }, (error) => {
    console.error("Failed to sync users list:", error);
    usersListContainer.innerHTML = `<div class="no-data" style="color:#ef4444;">Failed to sync users database.</div>`;
  });

  // Update Stats Counters
  function updateReportCounters(total, pending, approved) {
    totalReportsEl.textContent = total;
    pendingReportsEl.textContent = pending;
    approvedReportsEl.textContent = approved;
  }
});

// GLOBAL ACTIONS (Exposed to window so HTML inline click works)

/**
 * Approve a user report. Sets status to "Approved" and integrates it into active routing maps.
 * @param {string} id 
 */
window.approveReport = async function(id) {
  if (!confirm("Are you sure you want to approve this hazard report? It will immediately influence safety scoring in routing.")) return;
  try {
    await db.collection("reports").doc(id).update({
      status: "Approved"
    });
    alert("Report approved. System safety matrix updated.");
  } catch (error) {
    console.error("Approve failed:", error);
    alert(`Action failed: ${error.message}`);
  }
};

/**
 * Reject a user report. Sets status to "Rejected".
 * @param {string} id 
 */
window.rejectReport = async function(id) {
  if (!confirm("Are you sure you want to reject this hazard report?")) return;
  try {
    await db.collection("reports").doc(id).update({
      status: "Rejected"
    });
    alert("Report rejected.");
  } catch (error) {
    console.error("Reject failed:", error);
    alert(`Action failed: ${error.message}`);
  }
};

/**
 * Deletes a user report record permanently.
 * @param {string} id 
 */
window.deleteReport = async function(id) {
  if (!confirm("Are you sure you want to permanently delete this report record? This cannot be undone.")) return;
  try {
    await db.collection("reports").doc(id).delete();
    alert("Report deleted permanently.");
  } catch (error) {
    console.error("Delete failed:", error);
    alert(`Action failed: ${error.message}`);
  }
};
