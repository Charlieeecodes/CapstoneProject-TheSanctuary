document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("feedback-container");

  function getRatingClass(value) {
    if (value >= 4) return "high";
    if (value >= 3) return "mid";
    return "low";
  }

  function createRatingItem(label, value) {
    const percentage = Math.max(0, Math.min((value / 5) * 100, 100));
    const ratingClass = getRatingClass(value);

    return `
      <div class="rating-item">
        <div class="rating-top">
          <span>${label}</span>
          <span>${value}/5</span>
        </div>
        <div class="rating-bar">
          <div class="rating-fill ${ratingClass}" style="width: ${percentage}%"></div>
        </div>
      </div>
    `;
  }

  async function loadFeedbacks() {
    try {
      const res = await fetch("http://localhost:5000/api/feedbacks");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const feedbacks = await res.json();
      container.innerHTML = "";

      if (!feedbacks.length) {
        container.innerHTML = `<div class="no-feedback">No feedbacks found.</div>`;
        return;
      }

      feedbacks.forEach((fb) => {
        const overall = Number(fb.overall_rating) || 0;
        const service = Number(fb.service_rating) || 0;
        const satisfaction = Number(fb.satisfaction_rating) || 0;
        const professionalism = Number(fb.professionalism_rating) || 0;
        const communication = Number(fb.communication_rating) || 0;
        const facility = Number(fb.facility_rating) || 0;

        const card = document.createElement("div");
        card.className = "feedback-card";

        card.innerHTML = `
          <div class="feedback-header">
            <div class="client-info">
              <h3>${fb.name || "Anonymous"}</h3>
              <p>${fb.email || "No email provided"}</p>
            </div>
            <div class="feedback-date">
              Submitted on: ${new Date(fb.created_at).toLocaleDateString()}
            </div>
          </div>

          <div class="ratings">
            ${createRatingItem("Overall", overall)}
            ${createRatingItem("Service", service)}
            ${createRatingItem("Satisfaction", satisfaction)}
            ${createRatingItem("Professionalism", professionalism)}
            ${createRatingItem("Communication", communication)}
            ${createRatingItem("Facility & Ambiance", facility)}
          </div>

          <div class="message">
            "${fb.message || "No feedback message provided."}"
          </div>
        `;

        container.appendChild(card);
      });
    } catch (err) {
      console.error("Error loading feedbacks:", err);
      container.innerHTML = `<div class="error-feedback">Failed to load feedbacks.</div>`;
    }
  }

  loadFeedbacks();
});