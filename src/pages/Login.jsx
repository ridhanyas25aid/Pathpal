import React, { useState } from 'react';
import { supabase } from '../services/supabase';

export default function Login({ onAuthSuccess }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1 = Phone input, 2 = OTP input
  const [loading, setLoading] = useState(false);

  // Send OTP trigger
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) return;
    
    setLoading(true);
    const fullPhone = `+91${phone}`;

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      });

      if (error) throw error;
      setStep(2);
    } catch (err) {
      console.error("SMS Trigger failed:", err);
      alert(`Failed to send verification SMS: ${err.message}. (Note: Real SMS requires setting up an SMS provider like Twilio in your Supabase Console. You can add this phone number as a 'Test Phone Number' in your Supabase Auth settings to log in for free!)`);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP trigger
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setLoading(true);
    const fullPhone = `+91${phone}`;

    try {
      const { data: { session }, error } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;
      if (!session) throw new Error("Could not establish session.");

      // Check if user has a profile completed in profiles table
      const { data: profile, error: dbErr } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (dbErr) throw dbErr;

      const profileComplete = !!(profile && profile.name);
      const role = profile ? (profile.role || "user") : "user";

      // Trigger success callback
      onAuthSuccess(session.user, profileComplete, role);
    } catch (err) {
      console.error("OTP verification failed:", err);
      alert(`Invalid OTP code entered: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Developer bypass helper (Bypasses SMS requirements for testing)
  const handleDevBypass = (isAdmin) => {
    const mockUser = {
      id: "mock-developer-id-000000000000",
      phone: "+918879998795"
    };
    // Logs in immediately with profileComplete = true, role = user or admin
    onAuthSuccess(mockUser, true, isAdmin ? "admin" : "user");
  };

  return (
    <div className="login-page-container">
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <h2 className="login-title">Path Pal AI</h2>
            <div className="login-subtitle">AI Powered Smart Safe Route Navigation System</div>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="slide-section active">
              <div className="form-group">
                <label className="form-label">Enter Mobile Number</label>
                <div className="phone-input-container">
                  <div className="country-code">+91</div>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="10-digit number"
                    maxLength="10"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-login" disabled={phone.length !== 10 || loading}>
                {loading ? (
                  <>
                    <span>Sending...</span> <i className="fa-solid fa-spinner fa-spin"></i>
                  </>
                ) : (
                  <>
                    <span>Send OTP</span> <i className="fa-solid fa-arrow-right"></i>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="slide-section active">
              <div className="form-group">
                <label className="form-label">Enter 6-Digit OTP</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="xxxxxx"
                  maxLength="6"
                  style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '0.3em' }}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  autoComplete="off"
                  required
                />
              </div>

              <button type="submit" className="btn-login" disabled={otp.length !== 6 || loading}>
                {loading ? (
                  <>
                    <span>Verifying...</span> <i className="fa-solid fa-spinner fa-spin"></i>
                  </>
                ) : (
                  <>
                    <span>Verify OTP</span> <i className="fa-solid fa-check"></i>
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setStep(1);
                    setOtp("");
                  }}
                  style={{ color: '#06b6d4', fontSize: '13px', decoration: 'none' }}
                >
                  Change phone number
                </a>
              </div>
            </form>
          )}

          {/* Developer Bypass Panel */}
          <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '15px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', letterSpacing: '0.05em' }}>DEVELOPER BYPASS FOR LOCAL TESTING</div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => handleDevBypass(false)}
                className="btn-dev-bypass"
              >
                🚀 Login as User
              </button>
              <button
                type="button"
                onClick={() => handleDevBypass(true)}
                className="btn-dev-bypass"
              >
                👑 Login as Admin
              </button>
            </div>
          </div>

          <div className="info-footer">
            Secured by Supabase Phone Authentication. By signing in, you agree to enable emergency SOS location tracking.
          </div>
        </div>
      </div>
    </div>
  );
}
