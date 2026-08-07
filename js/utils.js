/**
 * Path Pal AI - Utility Helpers & Autocomplete Engine
 * Implements debounced Nominatim location queries restricted to the Tamil Nadu boundary.
 */

window.AppUtils = (function () {
  
  /**
   * Debounces a function execution.
   * @param {Function} func 
   * @param {number} delayMs 
   */
  function debounce(func, delayMs) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delayMs);
    };
  }

  /**
   * Restricts search query and returns Nominatim autocompletions.
   * Bounding box coordinates for Tamil Nadu:
   * Min Lat: 8.08, Max Lat: 13.5, Min Lng: 76.22, Max Lng: 80.34
   * @param {string} query 
   * @returns {Promise<Array>}
   */
  async function searchLocations(query) {
    if (!query || query.length < 3) return [];
    
    // Explicit viewbox bounds representing Tamil Nadu to keep searches local
    const viewbox = "76.22,13.5,80.34,8.08"; 
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${viewbox}&bounded=1&countrycodes=in&limit=6`;
    
    try {
      const response = await fetch(url, {
        headers: {
          "Accept-Language": "en-US,en;q=0.9"
        }
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.map(item => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }));
    } catch (err) {
      console.warn("Nominatim autocomplete query failed:", err);
      return [];
    }
  }

  /**
   * Binds autocomplete list behavior to text inputs.
   * @param {HTMLInputElement} inputEl - Text input element
   * @param {HTMLElement} listEl - Target dropdown element to hold suggestion list
   * @param {Function} onSelectCallback - Function(selectedObj) triggered upon item click
   */
  function setupAutocomplete(inputEl, listEl, onSelectCallback) {
    const handleInput = debounce(async (e) => {
      const val = e.target.value.trim();
      if (val.length < 3) {
        listEl.innerHTML = "";
        listEl.style.display = "none";
        return;
      }

      listEl.innerHTML = `<div style="padding:10px; color:#64748b; font-size:12px;"><i class="fa-solid fa-spinner fa-spin"></i> Searching Tamil Nadu...</div>`;
      listEl.style.display = "block";

      const results = await searchLocations(val);
      listEl.innerHTML = "";

      if (results.length === 0) {
        listEl.innerHTML = `<div style="padding:10px; color:#64748b; font-size:12px;">No locations found in Tamil Nadu.</div>`;
        return;
      }

      results.forEach(res => {
        const item = document.createElement("div");
        item.className = "autocomplete-item";
        item.style.padding = "10px 12px";
        item.style.cursor = "pointer";
        item.style.fontSize = "12px";
        item.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
        item.style.color = "#cbd5e1";
        item.style.transition = "background 0.2s";
        item.innerHTML = `<i class="fa-solid fa-location-dot" style="color:#06b6d4; margin-right:8px;"></i> ${res.name}`;
        
        item.addEventListener("mouseenter", () => {
          item.style.background = "rgba(255, 255, 255, 0.08)";
        });
        item.addEventListener("mouseleave", () => {
          item.style.background = "transparent";
        });

        item.addEventListener("click", () => {
          inputEl.value = res.name;
          listEl.innerHTML = "";
          listEl.style.display = "none";
          onSelectCallback(res);
        });

        listEl.appendChild(item);
      });
    }, 450);

    inputEl.addEventListener("input", handleInput);

    // Hide dropdown list when clicking outside
    document.addEventListener("click", (e) => {
      if (e.target !== inputEl && e.target !== listEl) {
        listEl.innerHTML = "";
        listEl.style.display = "none";
      }
    });
  }

  return {
    debounce,
    searchLocations,
    setupAutocomplete
  };
})();
