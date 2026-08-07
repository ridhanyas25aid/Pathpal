import React from 'react';

export default function Home({ user, onNavigate }) {
  const handleLaunch = () => {
    if (user) {
      onNavigate("dashboard");
    } else {
      onNavigate("login");
    }
  };

  return (
    <div className="home-container">
      {/* Navigation Header */}
      <header className="home-header">
        <div className="home-brand">
          <div className="home-logo">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <span className="home-title">Path Pal AI</span>
        </div>
        <nav className="home-nav">
          <a href="#features">Features</a>
          {user ? (
            <button className="nav-btn" onClick={() => onNavigate("dashboard")}>
              <i className="fa-solid fa-chart-line"></i> Dashboard
            </button>
          ) : (
            <button className="nav-btn" onClick={() => onNavigate("login")}>
              <i className="fa-solid fa-arrow-right-to-bracket"></i> Sign In
            </button>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-glow"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <i className="fa-solid fa-shield-halved"></i> Real-time Corridor Safety Routing
          </div>
          <h1 className="hero-title">
            Navigate Safely, <br />
            <span>Avoid Risks in Real-Time</span>
          </h1>
          <p className="hero-subtitle">
            Path Pal AI calculates route safety using lit streets, neighborhood hazard alerts, 
            and real-time incident reports, guiding you through the safest corridor path.
          </p>
          <div className="hero-actions">
            <button className="btn-hero-primary" onClick={handleLaunch}>
              <i className="fa-solid fa-location-arrow"></i> Launch Safe Map
            </button>
            <a href="#features" className="btn-hero-secondary">
              Learn More <i className="fa-solid fa-arrow-down"></i>
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="features-section">
        <div className="section-header-centered">
          <h2>Engineered for Personal Security</h2>
          <p>Real-time analytics and emergency tools combined into a single, intuitive interface.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon bg-blue">
              <i className="fa-solid fa-arrows-split-up-and-left"></i>
            </div>
            <h3>Safest AI Routing</h3>
            <p>Compares routes dynamically, scoring lighting levels, incident report proximity, and state border safety.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-orange">
              <i className="fa-solid fa-bullhorn"></i>
            </div>
            <h3>Hazard Reporter</h3>
            <p>Crowdsourced hazard mapping allows community members to flag crime, lighting issues, and blockages instantly.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-red">
              <i className="fa-solid fa-kit-medical"></i>
            </div>
            <h3>Emergency SOS Siren</h3>
            <p>Instant audio alerting system with frequency oscillator signals to deter danger and dispatch locations to contacts.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-cyan">
              <i className="fa-solid fa-comments"></i>
            </div>
            <h3>PathPal AI Assistant</h3>
            <p>A smart safety assistant chatbot always ready in your dashboard to help query hazard statuses or routing steps.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <p>© 2026 Path Pal AI. All rights reserved.</p>
          <p style={{ opacity: 0.5, fontSize: '11px', marginTop: '4px' }}>Secured by Supabase and Leaflet mapping networks.</p>
        </div>
      </footer>
    </div>
  );
}
