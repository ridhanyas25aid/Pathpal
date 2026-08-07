import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export default function ProfileSetup({ user, onProfileSuccess }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergency, setEmergency] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (emergency.length !== 10) {
      alert("Please enter a valid 10-digit emergency contact number.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name,
          phone,
          emergency_contact: emergency,
          gender,
          city,
          role,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      alert("Profile updated successfully!");
      onProfileSuccess(role);
    } catch (err) {
      console.error("Profile registration failed:", err);
      alert(`Database Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-wrapper">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-logo">
            <i className="fa-solid fa-user-gear"></i>
          </div>
          <h2 className="profile-title">Setup Profile</h2>
          <div className="profile-subtitle">Please complete registration details to secure your routes.</div>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="profile-name">Full Name</label>
            <input
              type="text"
              id="profile-name"
              className="input-field"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          {/* Phone (Readonly) */}
          <div className="form-group">
            <label className="form-label" htmlFor="profile-phone">Phone Number</label>
            <input
              type="tel"
              id="profile-phone"
              className="input-field"
              value={phone}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>

          {/* Emergency Contact */}
          <div className="form-group">
            <label className="form-label" htmlFor="profile-emergency">Emergency Contact Mobile</label>
            <input
              type="tel"
              id="profile-emergency"
              className="input-field"
              placeholder="Emergency contact phone number"
              maxLength="10"
              value={emergency}
              onChange={(e) => setEmergency(e.target.value.replace(/\D/g, ""))}
              required
              autoComplete="off"
            />
          </div>

          {/* Gender */}
          <div className="form-group">
            <label className="form-label" htmlFor="profile-gender">Gender</label>
            <select
              id="profile-gender"
              className="input-field select-field"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
            >
              <option value="" disabled>Select Gender</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          {/* City */}
          <div className="form-group">
            <label className="form-label" htmlFor="profile-city">City</label>
            <input
              type="text"
              id="profile-city"
              className="input-field"
              placeholder="E.g. Chennai, Coimbatore, Madurai"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          {/* Account Type Option */}
          <div className="form-group" style={{ marginTop: '5px' }}>
            <label className="form-label" htmlFor="profile-role">Choose Account Type</label>
            <select
              id="profile-role"
              className="input-field select-field"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="user">Standard User (Safe Navigation & SOS)</option>
              <option value="admin">Administrator (Approve & Manage Reports)</option>
            </select>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <>
                <span>Saving...</span> <i className="fa-solid fa-spinner fa-spin"></i>
              </>
            ) : (
              <>
                <span>Save & Proceed</span> <i className="fa-solid fa-arrow-right-to-bracket"></i>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
