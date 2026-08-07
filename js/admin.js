/**
 * Path Pal AI - Supabase Administration Dashboard Script
 * Implements real-time synchronization with Supabase tables for user reports and profiles.
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

  // Fetch and render reports
  async function fetchAndRenderReports() {
    try {
      const { data: reports, error } = await supabaseClient
        .from('reports')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      reportsListContainer.innerHTML = "";

      let total = 0;
      let pending = 0;
      let approved = 0;

      if (!reports || reports.length === 0) {
        reportsListContainer.innerHTML = `<div class="no-data">No safety reports have been logged in the system.</div>`;
        updateReportCounters(0, 0, 0);
        return;
      }

      reports.forEach((data) => {
        const id = data.id;
        total++;
        
        if (data.status === "Pending") pending++;
        else if (data.status === "Approved") approved++;

        const dateStr = data.timestamp ? new Date(data.timestamp).toLocaleString() : "Just now";
        
        const item = document.createElement("div");
        item.className = "report-item";
        item.innerHTML = `
          <div class="report-header">
            <span class="report-type-txt"><i class="fa-solid fa-triangle-exclamation" style="color:#ef4444; margin-right:6px;"></i> ${data.type}</span>
            <span class="report-badge ${data.status.toLowerCase()}">${data.status}</span>
          </div>
          <div class="report-body">${data.description}</div>
          
          ${data.photo_url ? `<img src="${data.photo_url}" class="report-photo-thumb" alt="Report image"/>` : ''}

          <div class="report-meta-row">
            <div class="report-meta-item"><i class="fa-solid fa-user"></i> By: <b>${data.user_name || 'Anonymous'}</b></div>
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
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      reportsListContainer.innerHTML = `<div class="no-data" style="color:#ef4444;">Failed to sync reports. Check database policies.</div>`;
    }
  }

  // Fetch and render users
  async function fetchAndRenderUsers() {
    try {
      const { data: users, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      usersListContainer.innerHTML = "";
      
      if (!users || users.length === 0) {
        usersListContainer.innerHTML = `<div class="no-data">No users registered.</div>`;
        activeUsersEl.textContent = "0";
        return;
      }

      activeUsersEl.textContent = users.length;

      users.forEach((data) => {
        const initials = data.name ? data.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "U";

        const item = document.createElement("div");
        item.className = "user-item";
        item.innerHTML = `
          <div class="user-avatar">${initials}</div>
          <div class="user-info">
            <div class="user-name">${data.name}</div>
            <div class="user-phone">${data.phone} • Emergency: ${data.emergency_contact}</div>
          </div>
          <span class="user-badge ${data.role}">${data.role}</span>
        `;
        usersListContainer.appendChild(item);
      });
    } catch (error) {
      console.error("Failed to fetch users:", error);
      usersListContainer.innerHTML = `<div class="no-data" style="color:#ef4444;">Failed to sync users database.</div>`;
    }
  }

  // Set up realtime subscriptions for reports and profiles tables
  if (typeof supabaseClient !== 'undefined' && supabaseClient) {
    fetchAndRenderReports();
    fetchAndRenderUsers();

    // Listen for database changes on reports table
    supabaseClient
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => { fetchAndRenderReports(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => { fetchAndRenderUsers(); }
      )
      .subscribe();
  }

  // Update Stats Counters
  function updateReportCounters(total, pending, approved) {
    totalReportsEl.textContent = total;
    pendingReportsEl.textContent = pending;
    approvedReportsEl.textContent = approved;
  }
});

// GLOBAL ACTIONS (Exposed to window so HTML inline click works)

/**
 * Approve a user report.
 * @param {string} id 
 */
window.approveReport = async function(id) {
  if (!confirm("Are you sure you want to approve this hazard report?")) return;
  try {
    const { error } = await supabaseClient
      .from('reports')
      .update({ status: "Approved" })
      .eq('id', id);

    if (error) throw error;
    alert("Report approved. System safety matrix updated.");
  } catch (error) {
    console.error("Approve failed:", error);
    alert(`Action failed: ${error.message}`);
  }
};

/**
 * Reject a user report.
 * @param {string} id 
 */
window.rejectReport = async function(id) {
  if (!confirm("Are you sure you want to reject this hazard report?")) return;
  try {
    const { error } = await supabaseClient
      .from('reports')
      .update({ status: "Rejected" })
      .eq('id', id);

    if (error) throw error;
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
  if (!confirm("Are you sure you want to permanently delete this report record?")) return;
  try {
    const { error } = await supabaseClient
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) throw error;
    alert("Report deleted permanently.");
  } catch (error) {
    console.error("Delete failed:", error);
    alert(`Action failed: ${error.message}`);
  }
};
