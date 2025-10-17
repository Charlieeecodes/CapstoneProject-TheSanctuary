document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("feedback-container");

  async function loadFeedbacks() {
    try {
      const res = await fetch("http://localhost:5000/api/feedbacks");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const feedbacks = await res.json();

      container.innerHTML = "";

      if (!feedbacks.length) {
        container.innerHTML = "<p>No feedbacks found.</p>";
        return;
      }

      feedbacks.forEach(fb => {
        // Ensure numeric values
        const overall = Number(fb.overall_rating) || 0;
        const service = Number(fb.service_rating) || 0;
        const satisfaction = Number(fb.satisfaction_rating) || 0;

        const card = document.createElement("div");
        card.className = "feedback-card";
        card.innerHTML = `
          <div class="client-info">
            <h3>${fb.name}</h3>
            <p>${fb.email}</p>
          </div>
          <div class="ratings">
            <p>Overall: ${overall}/5</p>
            <p>Service: ${service}/5</p>
            <p>Satisfaction: ${satisfaction}/5</p>
          </div>
          <div class="message"><p>"${fb.message}"</p></div>
          <div class="date">Submitted on: ${new Date(fb.created_at).toLocaleDateString()}</div>
        `;
        container.appendChild(card);
      });
    } catch (err) {
      console.error("Error loading feedbacks:", err);
      container.innerHTML = "<p style='color:red;'>Failed to load feedbacks.</p>";
    }
  }

  loadFeedbacks();
});
