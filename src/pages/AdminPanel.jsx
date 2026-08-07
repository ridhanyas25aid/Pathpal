import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export default function AdminPanel({ onNavigate }) {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    usersCount: 0
  });

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchUsers();

    // Subscribe to real-time changes
    const reportsChannel = supabase
      .channel('admin-reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchReports();
      })
      .subscribe();

    const profilesChannel = supabase
      .channel('admin-profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(reportsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  // Recalculate stats whenever reports or users change
  useEffect(() => {
    let pending = 0;
    let approved = 0;
    reports.forEach((rep) => {
      if (rep.status === "Pending") pending++;
      else if (rep.status === "Approved") approved++;
    });

    setStats({
      total: reports.length,
      pending,
      approved,
      usersCount: users.length
    });
  }, [reports, users]);

  // Actions
  const handleApprove = async (id) => {
    if (!window.confirm("Are you sure you want to approve this hazard report?")) return;
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: "Approved" })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to reject this hazard report?")) return;
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: "Rejected" })
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this report record?")) return;
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    }
  };

  return (
    <div id="admin-container">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-title-box">
          <h1>Path Pal AI Administrator Panel</h1>
          <div className="admin-subtitle">Manage user safety reports, verify hazards, and coordinate security indices.</div>
        </div>
        <button onClick={() => onNavigate('dashboard')} className="btn-back-dash" style={{ border: 'none', background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}>
          <i className="fa-solid fa-arrow-left-long"></i> Back to Dashboard
        </button>
      </header>

      {/* Stats Grid */}
      <section className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <div className="num">{stats.total}</div>
            <div className="lbl">Total Submissions</div>
          </div>
          <div className="admin-stat-icon"><i class="fa-solid fa-folder-open"></i></div>
        </div>

        <div className="admin-stat-card pending">
          <div className="admin-stat-info">
            <div className="num">{stats.pending}</div>
            <div className="lbl">Pending Review</div>
          </div>
          <div className="admin-stat-icon"><i class="fa-solid fa-clock-rotate-left"></i></div>
        </div>

        <div className="admin-stat-card approved">
          <div className="admin-stat-info">
            <div className="num">{stats.approved}</div>
            <div className="lbl">Approved & Active</div>
          </div>
          <div className="admin-stat-icon"><i class="fa-solid fa-circle-check"></i></div>
        </div>

        <div className="admin-stat-card users">
          <div className="admin-stat-info">
            <div className="num">{stats.usersCount}</div>
            <div className="lbl">Registered Users</div>
          </div>
          <div className="admin-stat-icon"><i class="fa-solid fa-users"></i></div>
        </div>
      </section>

      {/* Main Content */}
      <main className="admin-main-grid">
        {/* Left Column: Reports Management */}
        <section className="panel-box">
          <div className="panel-title">
            <i className="fa-solid fa-list-check" style={{ color: '#06b6d4', marginRight: '8px' }}></i> Safety Reports Queue
          </div>

          <div className="reports-list">
            {loadingReports ? (
              <div className="no-data"><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Loading reports database...</div>
            ) : reports.length === 0 ? (
              <div className="no-data">No safety reports have been logged in the system.</div>
            ) : (
              reports.map((data) => (
                <div key={data.id} className="report-item">
                  <div className="report-header">
                    <span className="report-type-txt">
                      <i className="fa-solid fa-triangle-exclamation" style={{ color: '#ef4444', marginRight: '6px' }}></i> {data.type}
                    </span>
                    <span className={`report-badge ${data.status.toLowerCase()}`}>{data.status}</span>
                  </div>
                  <div className="report-body">{data.description}</div>

                  {data.photo_url && (
                    <img src={data.photo_url} className="report-photo-thumb" alt="Report visual" />
                  )}

                  <div className="report-meta-row">
                    <div className="report-meta-item"><i className="fa-solid fa-user"></i> By: <b>{data.user_name || 'Anonymous'}</b></div>
                    <div className="report-meta-item"><i className="fa-solid fa-clock"></i> Time: <b>{data.time}</b></div>
                    <div className="report-meta-item"><i className="fa-solid fa-location-crosshairs"></i> Pos: <b>{data.latitude?.toFixed(5)}, {data.longitude?.toFixed(5)}</b></div>
                    <div className="report-meta-item"><i className="fa-solid fa-calendar-day"></i> Logged: <b>{data.timestamp ? new Date(data.timestamp).toLocaleString() : 'Just now'}</b></div>
                  </div>

                  <div className="report-actions">
                    {data.status === "Pending" && (
                      <>
                        <button onClick={() => handleApprove(data.id)} className="btn-action btn-approve"><i className="fa-solid fa-check"></i> Approve</button>
                        <button onClick={() => handleReject(data.id)} className="btn-action btn-reject"><i className="fa-solid fa-xmark"></i> Reject</button>
                      </>
                    )}
                    <button onClick={() => handleDelete(data.id)} className="btn-action btn-delete"><i className="fa-solid fa-trash-can"></i> Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right Column: Registered Users list */}
        <section className="panel-box">
          <div className="panel-title">
            <i className="fa-solid fa-users-gear" style={{ color: '#8b5cf6', marginRight: '8px' }}></i> System Users
          </div>

          <div className="users-list">
            {loadingUsers ? (
              <div className="no-data"><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Loading user records...</div>
            ) : users.length === 0 ? (
              <div className="no-data">No users registered.</div>
            ) : (
              users.map((data) => {
                const initials = data.name
                  ? data.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
                  : "U";

                return (
                  <div key={data.id} className="user-item">
                    <div className="user-avatar">{initials}</div>
                    <div className="user-info">
                      <div className="user-name">{data.name}</div>
                      <div className="user-phone">{data.phone} • Emergency: {data.emergency_contact}</div>
                    </div>
                    <span className={`user-badge ${data.role}`}>{data.role}</span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
