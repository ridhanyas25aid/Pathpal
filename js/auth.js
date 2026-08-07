/**
 * Path Pal AI - Supabase Authentication Manager
 * Handles Phone OTP request triggers, verification confirmation, and sessions.
 */

class AuthManager {
  constructor() {
    this.supabase = window.supabaseClient || null;
    this.setupListeners();
  }

  setupListeners() {
    if (this.supabase) {
      // Listen for auth state changes to update localStorage session indicators
      this.supabase.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
          localStorage.setItem("pathpal_logged_in", "true");
        } else {
          localStorage.removeItem("pathpal_logged_in");
          localStorage.removeItem("pathpal_user_role");
        }
      });
    }
  }

  /**
   * Sends an OTP verification code to the target phone number.
   * @param {string} phoneNumber - E.164 format with country code (e.g. +918879998795)
   * @returns {Promise}
   */
  async sendOTP(phoneNumber) {
    if (!this.supabase) throw new Error("Supabase client is not initialized. Check js/supabase.js and ensure the anon key is configured.");
    
    const { data, error } = await this.supabase.auth.signInWithOtp({
      phone: phoneNumber
    });
    
    if (error) throw error;
    return data;
  }

  /**
   * Validates the verification code submitted by the user.
   * @param {string} phoneNumber - The destination phone number
   * @param {string} code - The 6-digit SMS OTP code
   * @returns {Promise}
   */
  async verifyOTP(phoneNumber, code) {
    if (!this.supabase) throw new Error("Supabase client is not initialized. Check js/supabase.js and ensure the anon key is configured.");
    
    const { data, error } = await this.supabase.auth.verifyOtp({
      phone: phoneNumber,
      token: code,
      type: 'sms'
    });
    
    if (error) throw error;
    
    const user = data.user;
    localStorage.setItem("pathpal_logged_in", "true");
    
    // Check if user has completed profile details in the public.profiles database table
    const profileComplete = await this.checkUserProfileComplete(user.id);
    return { user, profileComplete };
  }

  /**
   * Query profiles table to verify if the profile document exists
   * @param {string} uid 
   * @returns {Promise<boolean>}
   */
  async checkUserProfileComplete(uid) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('name, role')
        .eq('id', uid)
        .maybeSingle();

      if (error) throw error;
      
      if (data && data.name) {
        localStorage.setItem("pathpal_user_role", data.role || "user");
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error reading profile from Supabase:", err);
      return false;
    }
  }

  /**
   * Logs out the user session and redirects to the login screen.
   */
  async logout() {
    try {
      if (this.supabase) {
        await this.supabase.auth.signOut();
      }
      localStorage.removeItem("pathpal_logged_in");
      localStorage.removeItem("pathpal_user_role");
      window.location.href = "login.html";
    } catch (error) {
      console.error("Logout failure:", error);
      alert("Error logging out. Please try again.");
    }
  }
}

// Instantiate global auth service
window.Auth = new AuthManager();
