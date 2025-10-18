document.addEventListener('DOMContentLoaded', async () => {
  // -----------------------------
  // Elements
  // -----------------------------
  const totalInquiriesEl = document.getElementById('kpiTotalInquiries');
  const totalFeedbacksEl = document.getElementById('kpiTotalFeedbacks');
  const topServiceNameEl = document.getElementById('topServiceName');
  const growthEl = document.getElementById('kpiGrowth');

  const inquiriesMiniEl = document.getElementById('inquiriesMiniChart');
  const feedbacksMiniEl = document.getElementById('feedbacksMiniChart');
  const servicesMiniEl = document.getElementById('servicesMiniChart');
  const growthMiniEl = document.getElementById('growthMiniChart');

  const inquiriesTrendCanvas = document.getElementById('inquiriesTrendChart');
  const servicesBreakdownCanvas = document.getElementById('servicesBreakdownChart');

  // -----------------------------
  // Fetch KPI Data
  // -----------------------------
  try {
    const kpiRes = await fetch('http://localhost:5000/api/analytics/kpis');
    const kpiData = await kpiRes.json();

    totalInquiriesEl.textContent = kpiData.totalInquiries ?? 0;
    totalFeedbacksEl.textContent = kpiData.totalFeedbacks ?? 0;
    topServiceNameEl.textContent = kpiData.topService ?? 'N/A';
    growthEl.textContent = `${kpiData.growth >= 0 ? '+' : ''}${kpiData.growth ?? 0}%`;

    // -----------------------------
    // Mini KPI Charts
    // -----------------------------
    function createMiniChart(ctx, data, color) {
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map((_, i) => i + 1),
          datasets: [{
            data,
            borderColor: color,
            backgroundColor: `${color}33`,
            fill: true,
            tension: 0.3,
            pointRadius: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { display: false }, y: { display: false } }
        }
      });
    }

    if (inquiriesMiniEl) createMiniChart(inquiriesMiniEl.getContext('2d'), kpiData.inquiriesTrend ?? [12,19,3,5,2,3], '#673AB7');
    if (feedbacksMiniEl) createMiniChart(feedbacksMiniEl.getContext('2d'), kpiData.feedbackTrend ?? [5,9,7,11,8,10], '#4CAF50');
    if (servicesMiniEl) createMiniChart(servicesMiniEl.getContext('2d'), kpiData.servicesTrend ?? [8,10,9,12,14,11], '#2196F3');
    if (growthMiniEl) createMiniChart(growthMiniEl.getContext('2d'), kpiData.growthTrend ?? [3,5,2,6,8,4], '#FF9800');

    // -----------------------------
    // Main Charts
    // -----------------------------
    // Feedback Ratings per Service
    if (servicesBreakdownCanvas) {
      new Chart(servicesBreakdownCanvas, {
        type: 'bar',
        data: {
          labels: ['Overall', 'Service', 'Satisfaction', 'Response'],
          datasets: [{
            label: 'Average Rating',
            data: [
              kpiData.avgOverall ?? 0,
              kpiData.avgService ?? 0,
              kpiData.avgSatisfaction ?? 0,
              kpiData.avgResponse ?? 0
            ],
            backgroundColor: ['#4CAF50','#2196F3','#FF9800','#9C27B0']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: 10 },
          scales: {
            y: { beginAtZero: true, max: 5 }
          },
          plugins: { legend: { display: false }, tooltip: { enabled: true } }
        }
      });
    }

    // Inquiries Trend Chart (dynamic by period)
    async function updateInquiriesChart(period = 'month') {
      try {
        const res = await fetch(`http://localhost:5000/api/analytics/inquiries?period=${period}`);
        const data = await res.json();
        const labels = data.map(row => row.label);
        const counts = data.map(row => row.count);

        if (window.inquiriesTrendChartInstance) window.inquiriesTrendChartInstance.destroy();

        window.inquiriesTrendChartInstance = new Chart(inquiriesTrendCanvas, {
          type: 'line',
          data: { labels, datasets: [{ label: `Inquiries (${period})`, data: counts, borderColor: '#007bff', backgroundColor: 'rgba(0,123,255,0.2)', fill: true, tension: 0.3 }] },
          options: { responsive: true, maintainAspectRatio: false, layout: { padding: 10 }, scales: { y: { beginAtZero: true } } }
        });
      } catch (err) {
        console.error('Error updating inquiries chart:', err);
      }
    }

    const inquiriesPeriodSelect = document.getElementById('inquiriesPeriod');
    if (inquiriesPeriodSelect) {
      inquiriesPeriodSelect.addEventListener('change', e => updateInquiriesChart(e.target.value));
      inquiriesPeriodSelect.value = 'month';
      updateInquiriesChart('month');
    }

  } catch (err) {
    console.error('Error fetching analytics data:', err);
    totalInquiriesEl.textContent = 'Error';
    totalFeedbacksEl.textContent = 'Error';
    topServiceNameEl.textContent = 'Error';
    growthEl.textContent = 'Error';
  }
});
