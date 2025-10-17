document.addEventListener('DOMContentLoaded', async () => {
  // -----------------------------
  // KPI elements
  // -----------------------------
  const totalInquiriesEl = document.getElementById('kpiTotalInquiries');
  const totalFeedbacksEl = document.getElementById('kpiTotalFeedbacks');
  const topServiceNameEl = document.getElementById('topServiceName');
  const growthEl = document.getElementById('kpiGrowth');

  // Mini chart canvases
  const inquiriesMiniEl = document.getElementById('inquiriesMiniChart');
  const feedbacksMiniEl = document.getElementById('feedbacksMiniChart');
  const servicesMiniEl = document.getElementById('servicesMiniChart');
  const growthMiniEl = document.getElementById('growthMiniChart');

  // Main chart canvases
  const inquiriesTrendCanvas = document.getElementById('inquiriesTrendChart');
  const servicesBreakdownCanvas = document.getElementById('servicesBreakdownChart');

  try {
    // -----------------------------
    // Fetch KPI data
    // -----------------------------
    const kpiRes = await fetch('http://localhost:5000/api/analytics/kpis');
    const kpiData = await kpiRes.json();

    totalInquiriesEl.textContent = kpiData.totalInquiries ?? 0;
    totalFeedbacksEl.textContent = kpiData.totalFeedbacks ?? 0;
    topServiceNameEl.textContent = `Top Service: ${kpiData.topService ?? 'N/A'}`;
    growthEl.textContent = `${kpiData.growth >= 0 ? '+' : ''}${kpiData.growth ?? 0}%`;

    // -----------------------------
    // Fetch feedbacks
    // -----------------------------
    const feedbackRes = await fetch('http://localhost:5000/api/feedbacks');
    const feedbacks = await feedbackRes.json();

    const avgOverall = feedbacks.length
      ? (feedbacks.reduce((sum, f) => sum + f.overall, 0) / feedbacks.length).toFixed(2)
      : 0;
    const avgService = feedbacks.length
      ? (feedbacks.reduce((sum, f) => sum + f.service, 0) / feedbacks.length).toFixed(2)
      : 0;
    const avgSatisfaction = feedbacks.length
      ? (feedbacks.reduce((sum, f) => sum + f.satisfaction, 0) / feedbacks.length).toFixed(2)
      : 0;

    // -----------------------------
    // Feedback ratings per service (bar chart)
    // -----------------------------
    const servicesMap = {};
    feedbacks.forEach(f => {
      const svc = f.serviceAvailed || "Unknown";
      if (!servicesMap[svc]) servicesMap[svc] = { overall: 0, service: 0, satisfaction: 0, count: 0 };
      servicesMap[svc].overall += f.overall;
      servicesMap[svc].service += f.service;
      servicesMap[svc].satisfaction += f.satisfaction;
      servicesMap[svc].count += 1;
    });

    const serviceLabels = Object.keys(servicesMap);
    const avgOverallPerService = serviceLabels.map(s => (servicesMap[s].overall / servicesMap[s].count).toFixed(2));
    const avgServicePerService = serviceLabels.map(s => (servicesMap[s].service / servicesMap[s].count).toFixed(2));
    const avgSatisfactionPerService = serviceLabels.map(s => (servicesMap[s].satisfaction / servicesMap[s].count).toFixed(2));

    if (servicesBreakdownCanvas) {
      new Chart(servicesBreakdownCanvas, {
        type: 'bar',
        data: {
          labels: serviceLabels,
          datasets: [
            { label: 'Overall', data: avgOverallPerService, backgroundColor: '#4CAF50' },
            { label: 'Service', data: avgServicePerService, backgroundColor: '#2196F3' },
            { label: 'Satisfaction', data: avgSatisfactionPerService, backgroundColor: '#FF9800' }
          ]
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } } }
      });
    }

    // -----------------------------
    // Inquiries trend (line chart)
    // -----------------------------
    const inquiriesRes = await fetch('http://localhost:5000/api/inquiries');
    const inquiries = await inquiriesRes.json();

    const monthlyCounts = {};
    inquiries.forEach(i => {
      const month = new Date(i.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
    });

    const months = Object.keys(monthlyCounts);
    const counts = Object.values(monthlyCounts);

    if (inquiriesTrendCanvas) {
      new Chart(inquiriesTrendCanvas, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Inquiries per Month',
            data: counts,
            borderColor: '#673AB7',
            backgroundColor: 'rgba(103, 58, 183, 0.2)',
            fill: true
          }]
        },
        options: { responsive: true }
      });
    }

    // -----------------------------
    // Mini charts (sparklines) for KPI cards
    // -----------------------------
    function createMiniChart(ctx, data, color) {
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: months.length ? months : ['Jan','Feb','Mar','Apr','May','Jun'],
          datasets: [{
            data,
            borderColor: color,
            backgroundColor: `${color}33`,
            fill: true,
            tension: 0.4,
            pointRadius: 0
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { x: { display: false }, y: { display: false } }
        }
      });
    }

    createMiniChart(inquiriesMiniEl.getContext('2d'), counts, '#673AB7');
    createMiniChart(feedbacksMiniEl.getContext('2d'), avgOverallPerService.map(Number), '#4CAF50');
    createMiniChart(servicesMiniEl.getContext('2d'), avgServicePerService.map(Number), '#2196F3');
    createMiniChart(growthMiniEl.getContext('2d'), counts.map(c => c / Math.max(...counts) * 100), '#FF9800');

  } catch (err) {
    console.error('Error fetching Analytics data:', err);
    if (totalInquiriesEl) totalInquiriesEl.textContent = 'Error';
    if (totalFeedbacksEl) totalFeedbacksEl.textContent = 'Error';
    if (topServiceNameEl) topServiceNameEl.textContent = '';
    if (growthEl) growthEl.textContent = 'Error';
  }
});
// ==============================
// 🧭 Dynamic Inquiries Chart Filter (Year / Month / Week)
// ==============================
const inquiriesPeriodSelect = document.getElementById('inquiriesPeriod');

if (inquiriesPeriodSelect && inquiriesTrendCanvas) {
  inquiriesPeriodSelect.addEventListener('change', async (e) => {
    const period = e.target.value;

    try {
      const res = await fetch(`http://localhost:5000/api/analytics/inquiries?period=${period}`);
      const data = await res.json();

      const labels = data.map(row => row.label);
      const counts = data.map(row => row.count);

      // Destroy old chart if it exists
      if (window.inquiriesTrendChartInstance) {
        window.inquiriesTrendChartInstance.destroy();
      }

      // Create new chart
      window.inquiriesTrendChartInstance = new Chart(inquiriesTrendCanvas, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: `Inquiries (${period})`,
            data: counts,
            borderColor: '#007bff',
            backgroundColor: 'rgba(0,123,255,0.2)',
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });

    } catch (err) {
      console.error('❌ Error fetching filtered inquiries:', err);
    }
  });
}





