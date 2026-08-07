import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("user");
  const [profileComplete, setProfileComplete] = useState(false);
  const [page, setPage] = useState("login"); // 'login' | 'profile' | 'dashboard' | 'admin'
  const [checkingSession, setCheckingSession] = useState(true);

  // Initialize and check active session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleSessionSuccess(session.user);
      } else {
        setCheckingSession(false);
      }
    });

    // Listen for Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        handleSessionSuccess(session.user);
      } else {
        setUser(null);
        setRole("user");
        setProfileComplete(false);
        setPage("login");
        setCheckingSession(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSessionSuccess = async (authUser) => {
    setUser(authUser);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) throw error;

      if (profile && profile.name) {
        setProfileComplete(true);
        setRole(profile.role || "user");
        
        // Preserve admin routing if already navigated there
        setPage(prevPage => {
          if (prevPage === "admin" && profile.role === "admin") return "admin";
          return "dashboard";
        });
      } else {
        setProfileComplete(false);
        setPage("profile");
      }
    } catch (err) {
      console.error("Failed to fetch session profile data:", err);
      setPage("profile");
    } finally {
      setCheckingSession(false);
    }
  };

  const handleAuthSuccess = (authUser, isComplete, userRole) => {
    setUser(authUser);
    setProfileComplete(isComplete);
    setRole(userRole);
    if (isComplete) {
      setPage(userRole === "admin" ? "admin" : "dashboard");
    } else {
      setPage("profile");
    }
  };

  const handleProfileSuccess = (userRole) => {
    setProfileComplete(true);
    setRole(userRole);
    setPage(userRole === "admin" ? "admin" : "dashboard");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole("user");
    setProfileComplete(false);
    setPage("login");
  };

  if (checkingSession) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
        color: 'white',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '48px', color: '#06b6d4', marginBottom: '16px' }}></i>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>Loading session state...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {page === "login" && <Login onAuthSuccess={handleAuthSuccess} />}
      {page === "profile" && <ProfileSetup user={user} onProfileSuccess={handleProfileSuccess} />}
      {page === "dashboard" && <Dashboard user={user} role={role} onNavigate={setPage} onLogout={handleLogout} />}
      {page === "admin" && role === "admin" && <AdminPanel onNavigate={setPage} />}
    </>
  );
}
