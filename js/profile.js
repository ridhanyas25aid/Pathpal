/**
 * Path Pal AI - Profile Setup Controller
 * Backs profile.html to save new registrations to the Supabase database.
 */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profile-form");
  const nameInput = document.getElementById("profile-name");
  const phoneInput = document.getElementById("profile-phone");
  const emergencyInput = document.getElementById("profile-emergency");
  const genderSelect = document.getElementById("profile-gender");
  const cityInput = document.getElementById("profile-city");
  const roleSelect = document.getElementById("profile-role");
  const submitBtn = document.getElementById("btn-save-profile");

  let currentUser = null;

  // Retrieve auth state to prepopulate phone number
  if (typeof supabaseClient !== 'undefined' && supabaseClient) {
    supabaseClient.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        currentUser = user;
        phoneInput.value = user.phone || "";
      } else {
        // Not logged in, redirect to login
        window.location.href = "login.html";
      }
    }).catch(err => {
      console.error("Failed to load authenticated user:", err);
      window.location.href = "login.html";
    });
  }

  // Ensure emergency contact is numeric 10 digits
  emergencyInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").substring(0, 10);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Authentication error: No active user session.");
      return;
    }

    const name = nameInput.value.trim();
    const phone = phoneInput.value;
    const emergency = emergencyInput.value.trim();
    const gender = genderSelect.value;
    const city = cityInput.value.trim();
    const role = roleSelect.value || "user";

    if (!name || !emergency || !gender || !city) {
      alert("Please fill in all mandatory fields.");
      return;
    }

    if (emergency.length !== 10) {
      alert("Please enter a valid 10-digit emergency contact number.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Saving...</span> <i class="fa-solid fa-spinner fa-spin"></i>`;

    try {
      // Save profile to Supabase public.profiles table
      const { data, error } = await supabaseClient
        .from('profiles')
        .upsert({
          id: currentUser.id,
          name: name,
          phone: phone,
          emergency_contact: emergency,
          gender: gender,
          city: city,
          role: role,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update cached session information
      localStorage.setItem("pathpal_logged_in", "true");
      localStorage.setItem("pathpal_user_role", role);

      alert("Profile updated successfully!");

      // Redirect depending on chosen role
      if (role === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "index.html";
      }
    } catch (error) {
      console.error("Profile registration failed:", error);
      alert(`Supabase Database Error: ${error.message}`);
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Save & Proceed</span> <i class="fa-solid fa-arrow-right-to-bracket"></i>`;
    }
  });
});
