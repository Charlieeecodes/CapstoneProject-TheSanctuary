function adminAuthHeaders() {
  const token = localStorage.getItem("adminToken");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("feedback-container");
  const paginationContainer = document.getElementById("feedbackPaginationContainer");
  const resultCount = document.getElementById("feedbackResultCount");

  const searchInput = document.getElementById("feedbackSearch");
  const ratingCategoryFilter = document.getElementById("ratingCategoryFilter");
  const starFilter = document.getElementById("starFilter");
  const sortFilter = document.getElementById("sortFilter");
  const dateFromFilter = document.getElementById("dateFromFilter");
  const dateToFilter = document.getElementById("dateToFilter");
  const resetFiltersBtn = document.getElementById("resetFilters");

  const summaryTotal = document.getElementById("summaryTotal");
  const summaryOverall = document.getElementById("summaryOverall");
  const summarySelected = document.getElementById("summarySelected");
  const summaryTop = document.getElementById("summaryTop");
  const summaryLowest = document.getElementById("summaryLowest");

  const API_URL = "http://localhost:5000/api/feedbacks";

  let allFeedbacks = [];
  let filteredFeedbacks = [];
  let currentPage = 1;
  const feedbacksPerPage = 6;

  const ratingLabels = {
    overall_rating: "Overall",
    service_rating: "Service",
    satisfaction_rating: "Satisfaction",
    professionalism_rating: "Professionalism",
    communication_rating: "Communication",
    facility_rating: "Facility & Ambiance",
  };

  function getValue(feedback, keys, fallback = "") {
    for (const key of keys) {
      if (feedback[key] !== undefined && feedback[key] !== null && feedback[key] !== "") {
        return feedback[key];
      }
    }

    return fallback;
  }

  function getRating(feedback, key) {
    return Number(feedback[key]) || 0;
  }

  function getDateValue(feedback) {
    return getValue(feedback, ["created_at", "createdAt", "date", "submitted_at"], "");
  }

  function formatDate(value) {
    if (!value) return "N/A";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getRatingClass(value) {
    const rating = Number(value) || 0;

    if (rating >= 4) return "rating-good";
    if (rating >= 3) return "rating-mid";
    return "rating-low";
  }

  function stars(value) {
    const rating = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  }

  async function loadFeedbacks() {
    container.innerHTML = `<div class="no-feedback">Loading feedbacks...</div>`;

    try {
      const res = await fetch(API_URL, {
        headers: { ...adminAuthHeaders() },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("❌ Failed to load feedbacks:", res.status, text);
        container.innerHTML = `<div class="no-feedback">Failed to load feedbacks.</div>`;
        return;
      }

      const data = await res.json();
      allFeedbacks = Array.isArray(data) ? data : [];
      applyFilters();
    } catch (err) {
      console.error("❌ Error loading feedbacks:", err);
      container.innerHTML = `<div class="no-feedback">Unable to connect to feedback server.</div>`;
    }
  }

  function applyFilters() {
    const keyword = searchInput.value.trim().toLowerCase();
    const selectedCategory = ratingCategoryFilter.value;
    const selectedStar = starFilter.value;
    const sortValue = sortFilter.value;
    const fromDate = dateFromFilter.value;
    const toDate = dateToFilter.value;

    filteredFeedbacks = allFeedbacks.filter((feedback) => {
      const name = String(getValue(feedback, ["name", "client_name", "full_name"], "")).toLowerCase();
      const email = String(getValue(feedback, ["email"], "")).toLowerCase();
      const message = String(getValue(feedback, ["message", "feedback", "comments", "comment"], "")).toLowerCase();

      const matchesKeyword =
        !keyword ||
        name.includes(keyword) ||
        email.includes(keyword) ||
        message.includes(keyword);

      const ratingValue = getRating(feedback, selectedCategory);
      const matchesStar = !selectedStar || ratingValue === Number(selectedStar);

      const feedbackDateRaw = getDateValue(feedback);
      const feedbackDate = feedbackDateRaw ? new Date(feedbackDateRaw) : null;

      let matchesDate = true;

      if (fromDate && feedbackDate) {
        const from = new Date(fromDate);
        matchesDate = matchesDate && feedbackDate >= from;
      }

      if (toDate && feedbackDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && feedbackDate <= to;
      }

      if ((fromDate || toDate) && !feedbackDate) {
        matchesDate = false;
      }

      return matchesKeyword && matchesStar && matchesDate;
    });

    filteredFeedbacks.sort((a, b) => {
      const selectedCategory = ratingCategoryFilter.value;

      const dateA = new Date(getDateValue(a)).getTime() || 0;
      const dateB = new Date(getDateValue(b)).getTime() || 0;

      const ratingA = getRating(a, selectedCategory);
      const ratingB = getRating(b, selectedCategory);

      if (sortValue === "oldest") return dateA - dateB;
      if (sortValue === "highest") return ratingB - ratingA;
      if (sortValue === "lowest") return ratingA - ratingB;

      return dateB - dateA;
    });

    currentPage = 1;
    updateSummary();
    renderPaginatedFeedbacks();
  }

  function renderPaginatedFeedbacks() {
    container.innerHTML = "";

    if (!filteredFeedbacks.length) {
      container.innerHTML = `<div class="no-feedback">No feedbacks found.</div>`;
      if (resultCount) resultCount.textContent = "Showing 0 feedbacks";
      renderPagination();
      return;
    }

    const startIndex = (currentPage - 1) * feedbacksPerPage;
    const endIndex = startIndex + feedbacksPerPage;
    const pageFeedbacks = filteredFeedbacks.slice(startIndex, endIndex);

    pageFeedbacks.forEach((feedback) => {
      const name = getValue(feedback, ["name", "client_name", "full_name"], "Anonymous");
      const email = getValue(feedback, ["email"], "No email");
      const message = getValue(feedback, ["message", "feedback", "comments", "comment"], "No message provided.");
      const date = formatDate(getDateValue(feedback));

      const card = document.createElement("div");
      card.className = "feedback-card";

      card.innerHTML = `
        <div class="feedback-card-header">
          <div class="feedback-user">
            <h3>${escapeHTML(name)}</h3>
            <p>${escapeHTML(email)}</p>
          </div>
          <span class="feedback-date">${date}</span>
        </div>

        <div class="feedback-message">
          ${escapeHTML(message)}
        </div>

        <div class="rating-grid">
          ${Object.keys(ratingLabels).map((key) => {
            const value = getRating(feedback, key);

            return `
              <div class="rating-item">
                <span>${ratingLabels[key]}</span>
                <strong class="rating-badge ${getRatingClass(value)}">
                  ${value}/5 ${stars(value)}
                </strong>
              </div>
            `;
          }).join("")}
        </div>
      `;

      container.appendChild(card);
    });

    if (resultCount) {
      const start = startIndex + 1;
      const end = Math.min(endIndex, filteredFeedbacks.length);

      resultCount.textContent = `Showing ${start}-${end} of ${filteredFeedbacks.length} feedback(s)`;
    }

    renderPagination();
  }

  function renderPagination() {
    if (!paginationContainer) return;

    paginationContainer.innerHTML = "";

    const totalPages = Math.ceil(filteredFeedbacks.length / feedbacksPerPage);

    if (totalPages <= 1) return;

    const maxVisiblePages = 5;

    const createButton = (text, disabled, onClick, active = false) => {
      const btn = document.createElement("button");
      btn.textContent = text;
      btn.disabled = disabled;

      if (active) {
        btn.classList.add("active");
      }

      btn.addEventListener("click", onClick);
      paginationContainer.appendChild(btn);
    };

    createButton("«", currentPage === 1, () => {
      currentPage = 1;
      renderPaginatedFeedbacks();
    });

    createButton("‹", currentPage === 1, () => {
      if (currentPage > 1) {
        currentPage--;
        renderPaginatedFeedbacks();
      }
    });

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      createButton("1", false, () => {
        currentPage = 1;
        renderPaginatedFeedbacks();
      });

      if (startPage > 2) {
        const dots = document.createElement("span");
        dots.className = "pagination-dots";
        dots.textContent = "...";
        paginationContainer.appendChild(dots);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      createButton(
        i,
        false,
        () => {
          currentPage = i;
          renderPaginatedFeedbacks();
        },
        i === currentPage
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        const dots = document.createElement("span");
        dots.className = "pagination-dots";
        dots.textContent = "...";
        paginationContainer.appendChild(dots);
      }

      createButton(totalPages, false, () => {
        currentPage = totalPages;
        renderPaginatedFeedbacks();
      });
    }

    createButton("›", currentPage === totalPages, () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderPaginatedFeedbacks();
      }
    });

    createButton("»", currentPage === totalPages, () => {
      currentPage = totalPages;
      renderPaginatedFeedbacks();
    });
  }

  function updateSummary() {
    const selectedCategory = ratingCategoryFilter.value;

    if (summaryTotal) summaryTotal.textContent = filteredFeedbacks.length;

    if (!filteredFeedbacks.length) {
      if (summaryOverall) summaryOverall.textContent = "0/5";
      if (summarySelected) summarySelected.textContent = "0/5";
      if (summaryTop) summaryTop.textContent = "N/A";
      if (summaryLowest) summaryLowest.textContent = "N/A";
      return;
    }

    const avg = (key) => {
      const total = filteredFeedbacks.reduce((sum, item) => {
        return sum + getRating(item, key);
      }, 0);

      return total / filteredFeedbacks.length;
    };

    const overallAvg = avg("overall_rating");
    const selectedAvg = avg(selectedCategory);

    if (summaryOverall) summaryOverall.textContent = `${overallAvg.toFixed(1)}/5`;
    if (summarySelected) summarySelected.textContent = `${selectedAvg.toFixed(1)}/5`;

    const categoryAverages = Object.keys(ratingLabels).map((key) => ({
      key,
      label: ratingLabels[key],
      average: avg(key),
    }));

    categoryAverages.sort((a, b) => b.average - a.average);
    if (summaryTop) summaryTop.textContent = categoryAverages[0]?.label || "N/A";

    categoryAverages.sort((a, b) => a.average - b.average);
    if (summaryLowest) summaryLowest.textContent = categoryAverages[0]?.label || "N/A";
  }

  function resetFilters() {
    searchInput.value = "";
    ratingCategoryFilter.value = "overall_rating";
    starFilter.value = "";
    sortFilter.value = "latest";
    dateFromFilter.value = "";
    dateToFilter.value = "";

    applyFilters();
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  searchInput.addEventListener("input", applyFilters);
  ratingCategoryFilter.addEventListener("change", applyFilters);
  starFilter.addEventListener("change", applyFilters);
  sortFilter.addEventListener("change", applyFilters);
  dateFromFilter.addEventListener("change", applyFilters);
  dateToFilter.addEventListener("change", applyFilters);
  resetFiltersBtn.addEventListener("click", resetFilters);

  await loadFeedbacks();
});