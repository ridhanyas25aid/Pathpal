/**
 * Path Pal AI - Route Guard
 * Enforces page security, redirects unauthenticated sessions, and protects Admin paths.
 * Executes both immediate localStorage pre-checks (no flickers) and Supabase checks.
 */

(function () {
  const loggedIn = localStorage.getItem("pathpal_logged_in") === "true";
  const role = localStorage.getItem("pathpal_user_role") || "user";
  const pathName = window.location.pathname;
  const page = pathName.substring(pathName.lastIndexOf('/') + 1) || "index.html";

  // 1. Fast pre-guard check to prevent flickering of protected markup
  if (!loggedIn) {
    if (page !== "login.html") {
      window.location.href = "login.html";
      return;
    }
  } else {
    if (page === "login.html") {
      window.location.href = "index.html";
      return;
    }
    if (page === "admin.html" && role !== "admin") {
      window.location.href = "index.html";
      return;
    }
  }

  // 2. Definitive validation handler triggered when Supabase auth state changes
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) {
      console.error("Supabase Client SDK not loaded. Security checks paused.");
      return;
    }

    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      const activePage = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1) || "index.html";
      const user = session ? session.user : null;

      if (!user) {
        // Clear variables and redirect to login if logged out
        localStorage.removeItem("pathpal_logged_in");
        localStorage.removeItem("pathpal_user_role");
        if (activePage !== "login.html") {
          window.location.href = "login.html";
        }
      } else {
        localStorage.setItem("pathpal_logged_in", "true");
        const uid = user.id;

        try {
          const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('name, role')
            .eq('id', uid)
            .maybeSingle();

          if (error) throw error;

          const hasProfile = profile && profile.name;
          const userRole = profile ? (profile.role || "user") : "user";
          
          localStorage.setItem("pathpal_user_role", userRole);

          if (!hasProfile) {
            // Force incomplete profiles to profile setup screen
            if (activePage !== "profile.html") {
              window.location.href = "profile.html";
            }
          } else {
            // Authenticated user with complete profile attempts to visit login/profile pages
            if (activePage === "login.html" || activePage === "profile.html") {
              window.location.href = "index.html";
            }
            // Enforce administrator role security on administrative URLs
            if (activePage === "admin.html" && userRole !== "admin") {
              alert("Access Denied: You do not possess administrator rights.");
              window.location.href = "index.html";
            }
          }
        } catch (dbError) {
          console.error("Failed to query user records in Guard:", dbError);
        }
      }
    });
  });
})();
