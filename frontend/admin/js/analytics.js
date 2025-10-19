document.addEventListener('DOMContentLoaded', async () => {
  console.log('📊 [Analytics] Page Loaded');

  // -----------------------------
  // Element References
  // -----------------------------
  const totalInquiriesEl = document.getElementById('kpiTotalInquiries');
  const totalFeedbacksEl = document.getElementById('kpiTotalFeedbacks');
  const topServiceNameEl = document.getElementById('topServiceName');
  const growthEl = document.getElementById('kpiGrowth');
  const inquiriesMiniEl = document.getElementById('inquiriesMiniChart');
  const inquiriesTrendCanvas = document.getElementById('inquiriesTrendChart');
  const servicesBreakdownCanvas = document.getElementById('servicesBreakdownChart');
  const inquiriesPeriodSelect = document.getElementById('inquiriesPeriod');

  // -----------------------------
  // Helper: Update Inquiries KPI mini chart
  // -----------------------------
  async function updateInquiriesKPI(period = 'month') {
    try {
      const url = `http://localhost:5000/api/analytics/inquiries?period=${encodeURIComponent(period)}&mode=summary`;
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();

      if (totalInquiriesEl) totalInquiriesEl.textContent = data.total ?? 0;

      // Mini chart for visual feedback
      if (inquiriesMiniEl) {
        const ctx = inquiriesMiniEl.getContext('2d');
        if (window.miniInquiriesChart) window.miniInquiriesChart.destroy();
        const randomTrend = Array.from({ length: 6 }, () => Math.floor(Math.random() * (data.total / 2 + 1)));
        window.miniInquiriesChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: randomTrend.map((_, i) => i + 1),
            datasets: [{
              data: randomTrend,
              borderColor: '#673AB7',
              backgroundColor: 'rgba(103,58,183,0.2)',
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
    } catch (err) {
      console.error('[analytics] Error updating KPI:', err);
    }
  }

  // -----------------------------
  // Helper: Load all KPIs
  // -----------------------------
  async function loadKPIs() {
    try {
      const res = await fetch('http://localhost:5000/api/analytics/kpis', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'KPI fetch failed');

      totalInquiriesEl.textContent = data.totalInquiries ?? 0;
      totalFeedbacksEl.textContent = data.totalFeedbacks ?? 0;
      growthEl.textContent = `${data.growth >= 0 ? '+' : ''}${data.growth ?? 0}%`;
      topServiceNameEl.textContent = data.topService ?? 'N/A';

      // -----------------------------
      // Ratings Bar Chart (all 6 categories)
      // -----------------------------
      if (servicesBreakdownCanvas && data.avgRatings) {
        new Chart(servicesBreakdownCanvas, {
          type: 'bar',
          data: {
            labels: ['Overall', 'Service', 'Satisfaction', 'Professionalism', 'Communication', 'Facility & Ambiance'],
            datasets: [{
              label: 'Average Rating',
              data: [
                data.avgRatings.overall ?? 0,
                data.avgRatings.service ?? 0,
                data.avgRatings.satisfaction ?? 0,
                data.avgRatings.professionalism ?? 0,
                data.avgRatings.communication ?? 0,
                data.avgRatings.facility ?? 0
              ],
              backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4', '#FFC107']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 5 } },
            plugins: { legend: { display: false } }
          }
        });
      }

      console.log('✅ KPI Data Loaded');
    } catch (err) {
      console.error('❌ KPI Load Error:', err);
      totalInquiriesEl.textContent = 'Error';
      totalFeedbacksEl.textContent = 'Error';
      growthEl.textContent = 'Error';
      topServiceNameEl.textContent = 'Error';
    }
  }

  // -----------------------------
  // Helper: Update inquiries trend chart
  // -----------------------------
  async function updateInquiriesChart(period = 'month') {
    const titleEl = document.querySelector('.chart-container h3');
    if (titleEl) {
      titleEl.textContent = `${period.charAt(0).toUpperCase() + period.slice(1)} Inquiries Trend`;
    }
    try {
      const url = `http://localhost:5000/api/analytics/inquiries?period=${encodeURIComponent(period)}&mode=trend`;
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();

      const labels = data.map(d => d.label);
      const counts = data.map(d => Number(d.count));

      if (window.inquiriesTrendChartInstance) window.inquiriesTrendChartInstance.destroy();

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
          scales: { y: { beginAtZero: true } }
        }
      });
    } catch (err) {
      console.error('❌ Error updating trend chart:', err);
    }
  }

  // -----------------------------
  // Initialize Analytics Page
  // -----------------------------
  await loadKPIs();
  await updateInquiriesChart('month');

  // -----------------------------
  // Period dropdown listener
  // -----------------------------
  if (inquiriesPeriodSelect) {
    inquiriesPeriodSelect.addEventListener('change', async e => {
      const periodMap = { weekly: 'week', monthly: 'month', yearly: 'year' };
      const period = periodMap[e.target.value] || e.target.value;

      await updateInquiriesChart(period);
      await updateInquiriesKPI(period);
    });

    inquiriesPeriodSelect.value = 'month';
    await updateInquiriesChart('month');
    await updateInquiriesKPI('month');
  }
});
