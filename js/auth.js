/**
 * Path Pal AI - Authentication Manager
 * Handles Phone Number input, Invisible reCAPTCHA, OTP confirmation, Profile verification, and Sessions.
 */

class AuthManager {
  constructor() {
    this.recaptchaVerifier = null;
    this.confirmationResult = null;
    this.auth = window.auth || firebase.auth();
    this.db = window.db || firebase.firestore();
    window.auth = this.auth;
    window.db = this.db;
    this.setupListeners();
  }

  setupListeners() {
    // Listen for auth state changes to update localStorage session indicators
    this.auth.onAuthStateChanged(user => {
      if (user) {
        localStorage.setItem("pathpal_logged_in", "true");
      } else {
        localStorage.removeItem("pathpal_logged_in");
        localStorage.removeItem("pathpal_user_role");
      }
    });
  }

  /**
   * Initializes the invisible reCAPTCHA verifier.
   * @param {string} containerId - Element ID for reCAPTCHA widget (can be empty for invisible)
   */
  initReCaptcha(containerId = "recaptcha-container") {
    if (this.recaptchaVerifier) return;
    
    try {
      // Clean up container HTML to prevent duplicate render conflicts
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = "";
      }

      this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(containerId, {
        size: 'invisible',
        callback: (response) => {
          console.log("reCAPTCHA solved. Ready to send SMS code.");
        },
        'expired-callback': () => {
          console.warn("reCAPTCHA expired. Resetting...");
          this.resetReCaptcha();
        }
      });
    } catch (error) {
      console.error("Failed to initialize reCAPTCHA verifier:", error);
    }
  }

  /**
   * Sends an OTP verification code to the target phone number.
   * @param {string} phoneNumber - Standard format with country code (e.g. +919876543210)
   * @returns {Promise}
   */
  async sendOTP(phoneNumber) {
    this.initReCaptcha();
    try {
      const confirmationResult = await this.auth.signInWithPhoneNumber(phoneNumber, this.recaptchaVerifier);
      this.confirmationResult = confirmationResult;
      return confirmationResult;
    } catch (error) {
      this.resetReCaptcha();
      throw error;
    }
  }

  /**
   * Validates the verification code submitted by the user.
   * @param {string} code - The 6-digit SMS OTP code
   * @returns {Promise<firebase.User>}
   */
  async verifyOTP(code) {
    if (!this.confirmationResult) {
      throw new Error("No pending verification session found. Request a new OTP.");
    }
    try {
      const result = await this.confirmationResult.confirm(code);
      const user = result.user;
      
      // Update session markers
      localStorage.setItem("pathpal_logged_in", "true");
      
      // Check if user has a completed profile in Firestore
      const profileComplete = await this.checkUserProfileComplete(user.uid);
      return { user, profileComplete };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user profile is already recorded in Firestore
   * @param {string} uid 
   * @returns {Promise<boolean>}
   */
  async checkUserProfileComplete(uid) {
    try {
      const doc = await this.db.collection("users").doc(uid).get();
      if (doc.exists && doc.data().name) {
        // Store user role in localStorage for frontend checks
        const role = doc.data().role || "user";
        localStorage.setItem("pathpal_user_role", role);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error reading user profile:", error);
      return false;
    }
  }

  /**
   * Reset reCAPTCHA container
   */
  resetReCaptcha() {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
  }

  /**
   * Logs out the user from the application and clears cached credentials.
   */
  async logout() {
    try {
      await this.auth.signOut();
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
