document.addEventListener("DOMContentLoaded", () => {
  const chatbotToggle = document.getElementById("chatbot-toggle");
  const chatbotPanel = document.getElementById("chatbot-panel");
  const chatbotClose = document.getElementById("chatbot-close");
  const chatbotSend = document.getElementById("chatbot-send");
  const chatbotInput = document.getElementById("chatbot-input");
  const chatbotMessages = document.getElementById("chatbot-messages");

  if (!chatbotToggle || !chatbotPanel || !chatbotSend || !chatbotInput || !chatbotMessages) return;

  function appendMessage(text, role) {
    const messageEl = document.createElement("div");
    messageEl.className = `chatbot-message ${role}`;
    messageEl.textContent = text;
    chatbotMessages.appendChild(messageEl);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  function respondToUser(message) {
    const normalized = message.trim().toLowerCase();
    let response = "I can help you with safe routes, streetlight status, crime incident details, and map overlay questions.";

    if (/\b(hello|hi|hey|greetings|good morning|good evening)\b/.test(normalized)) {
      response = "Hello! I'm the Path Pal AI assistant. Ask me about route safety, streetlights, crime hotspots, or how to use the map.";
    } else if (/\b(route|safe route|safest route|fastest route)\b/.test(normalized)) {
      response = "To get route guidance, choose a start and end point with the search boxes or preset routes. I then evaluate streetlights, crime zones, and outages to recommend the safest path.";
    } else if (/\b(streetlight|lighting|light outage|outage|faulty light|light status)\b/.test(normalized)) {
      response = "Streetlights are displayed when zoomed into the route area. Faulty lights are counted as outages and can increase the route risk score.";
    } else if (/\b(crime|incident|danger|risk|hotspot)\b/.test(normalized)) {
      response = "Crime data is shown as red incident markers and risk zones. The safer route avoids areas with high-risk crime incidents where possible.";
    } else if (/\b(location|map|position|geolocation|gps)\b/.test(normalized)) {
      response = "Use the map controls to track your live location or recenter the view. The stats update for the route and visible area currently shown on the map.";
    } else if (/\b(help|what can you|what do you|how do i|how to)\b/.test(normalized)) {
      response = "I can explain the dashboard, point out safe routes, and help you understand streetlights, crime incidents, and outages.";
    } else {
      response = "I understand questions about routes, streetlights, crime incidents, and map controls. Try asking something like 'How does the safest route work?' or 'What causes light outages?'";
    }

    appendMessage(response, "bot");
  }

  chatbotToggle.addEventListener("click", () => {
    chatbotPanel.style.display = chatbotPanel.style.display === "none" ? "flex" : "none";
    if (chatbotPanel.style.display === "flex") chatbotInput.focus();
  });

  chatbotClose.addEventListener("click", () => {
    chatbotPanel.style.display = "none";
  });

  chatbotSend.addEventListener("click", () => {
    const text = chatbotInput.value.trim();
    if (!text) return;
    appendMessage(text, "user");
    chatbotInput.value = "";
    setTimeout(() => respondToUser(text), 450);
  });

  chatbotInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      chatbotSend.click();
    }
  });
});