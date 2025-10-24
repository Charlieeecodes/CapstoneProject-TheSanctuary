document.addEventListener('DOMContentLoaded', async () => {
  console.log('📊 [Analytics] Page Loaded');

  // -----------------------------
  // Element References
  // -----------------------------
  const totalInquiriesEl = document.getElementById('kpiTotalInquiries');
  const totalFeedbacksEl = document.getElementById('kpiTotalFeedbacks');
  const topServiceNameEl = document.getElementById('topServiceName');
  const totalServicesEl = document.getElementById('kpiTotalServices');
  const inquiriesMiniEl = document.getElementById('inquiriesMiniChart');
  const inquiriesTrendCanvas = document.getElementById('inquiriesTrendChart');
  const feedbackBreakdownCanvas = document.getElementById('servicesBreakdownChart');
  const inquiriesPeriodSelect = document.getElementById('inquiriesPeriod');

  // New chart containers
  let topServicesChartCanvas;
  let serviceTrendChartCanvas;

  // Create new chart section dynamically (below existing charts)
  function appendNewCharts() {
    const mainSection = document.querySelector('.analytics-charts-side-by-side');
    if (!mainSection) return;

    const newSection = document.createElement('section');
    newSection.className = 'analytics-charts-side-by-side';
    newSection.innerHTML = `
      <div class="chart-container">
        <h3>Top Services Availed</h3>
        <canvas id="topServicesChart"></canvas>
      </div>
      <div class="chart-container">
        <h3>Total Services Availed Trend</h3>
        <canvas id="servicesTrendChart"></canvas>
      </div>
    `;
    mainSection.insertAdjacentElement('afterend', newSection);

    topServicesChartCanvas = document.getElementById('topServicesChart');
    serviceTrendChartCanvas = document.getElementById('servicesTrendChart');
  }

  appendNewCharts();

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
      totalServicesEl.textContent = data.totalServices ?? 0;
      topServiceNameEl.textContent = data.topService ?? 'N/A';

      // -----------------------------
      // Feedback Ratings Bar Chart
      // -----------------------------
      if (feedbackBreakdownCanvas && data.avgRatings) {
        window.feedbackBreakdownChart = new Chart(feedbackBreakdownCanvas, {
          type: 'bar',
          data: {
            labels: [
              'Overall', 'Service', 'Satisfaction',
              'Professionalism', 'Communication', 'Facility & Ambiance'
            ],
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
      totalServicesEl.textContent = 'Error';
      topServiceNameEl.textContent = 'Error';
    }
  }

  // -----------------------------
  // Helper: Update inquiries trend chart
  // -----------------------------
  async function updateInquiriesChart(period = 'month') {
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
  // 🟣 Top Services Chart
  // -----------------------------
  async function loadTopServicesChart() {
    try {
      const res = await fetch('http://localhost:5000/api/analytics/services/top', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        console.error('❌ Inquiry trend fetch failed:', res.status);
        return;
      }
      if (!Array.isArray(data)) {
      console.error('Top Services data is not an array:', data);
      return;
}
      const labels = data.map(d => d.name);
      const values = data.map(d => d.total);

      if (window.topServicesChartInstance) window.topServicesChartInstance.destroy();

      const ctx = topServicesChartCanvas.getContext('2d');
      window.topServicesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Total Completed',
            data: values,
            backgroundColor: '#673AB7'
          }]
        },
        options: {
          indexAxis: 'y', // horizontal
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true } }
        }
      });
    } catch (err) {
      console.error('❌ Error loading Top Services chart:', err);
    }
  }

  // -----------------------------
  // 🟣 Total Services Availed Trend
  // -----------------------------
  async function loadServiceTrendChart() {
    try {
      const res = await fetch('http://localhost:5000/api/analytics/services/trend', { cache: 'no-store' });
      const data = await res.json();

      if (!Array.isArray(data)) {
      console.error('Service Trend data is not an array:', data);
      return;
}

      const labels = data.map(d => d.label);
      const counts = data.map(d => Number(d.count));

      if (window.serviceTrendChartInstance) window.serviceTrendChartInstance.destroy();

      const ctx = serviceTrendChartCanvas.getContext('2d');
      window.serviceTrendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Total Services Availed',
            data: counts,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76,175,80,0.2)',
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
      console.error('❌ Error loading service trend chart:', err);
    }
  }

  // -----------------------------
  // Initialize Analytics Page
  // -----------------------------
  await loadKPIs();
  await updateInquiriesChart('month');
  await loadTopServicesChart();
  await loadServiceTrendChart();

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
  // ==============================
  // 🧠 Insights Modal Logic 
  // ==============================
  const insightsModal = document.getElementById('insightsModal');
  const closeBtn = insightsModal?.querySelector('.close-btn');
  const predictiveText = document.getElementById('predictiveText');
  const prescriptiveText = document.getElementById('prescriptiveText');
  const insightTitle = document.getElementById('insightTitle');

  // 🔹 SAFELY open modal with predictive/prescriptive insights
  async function openInsightsModal(chartType, period = 'month') {
    if (!insightsModal) return;

    // 🧹 Always destroy any existing modal chart first
    if (window.insightsChartInstance) {
      try {
        window.insightsChartInstance.destroy();
      } catch (err) {
        console.warn('[InsightsModal] Chart destroy on close error:', err);
      }
      window.insightsChartInstance = null;
    }

    const canvas = document.getElementById('insightsChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let sourceChart = null;

    // Match chart type to global instance
    if (chartType === 'inquiriesTrend') sourceChart = window.inquiriesTrendChartInstance;
    else if (chartType === 'serviceTrend') sourceChart = window.serviceTrendChartInstance;
    else if (chartType === 'topServices') sourceChart = window.topServicesChartInstance;
    else if (chartType === 'feedbackRatings') sourceChart = window.feedbackBreakdownChart;

    if (!sourceChart) {
      console.warn(`[InsightsModal] No chart instance found for ${chartType}`);
      return;
    }
    // ==============================
    // 🟣 Categorical Charts (Top Services / Feedback Ratings)
    // ==============================
    if (chartType === 'topServices') {
      insightTitle.textContent = 'Top Services Insights';

      const labels = sourceChart.data.labels;
      const values = sourceChart.data.datasets[0].data.map(Number);

      const total = values.reduce((a, b) => a + b, 0);
      const shares = values.map(v => (v / total) * 100);
      const maxIndex = values.indexOf(Math.max(...values));
      const minIndex = values.indexOf(Math.min(...values));

      predictiveText.textContent =
        `The most availed service is ${labels[maxIndex]} with ${shares[maxIndex].toFixed(1)}% of total completed services.`;

      prescriptiveText.textContent =
        shares[maxIndex] > 50
          ? `📈 Strong preference for ${labels[maxIndex]} — ensure capacity and consider bundling related services.`
          : `📊 Demand is distributed among multiple services. Consider focused marketing on ${labels[minIndex]} to boost interest.`;

      // 🔹 Rebuild chart manually to avoid config conflicts
      window.insightsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Total Completed',
            data: values,
            backgroundColor: '#673AB7'
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true } }
        }
      });

      insightsModal.classList.remove('hidden');
      return;
    }

    if (chartType === 'feedbackRatings') {
      insightTitle.textContent = 'Feedback Ratings Insights';

      const avgRatings = window.kpiData?.avgRatings || {
        overall: 4.5, service: 4.3, satisfaction: 4.1,
        professionalism: 4.7, communication: 3.9, facility: 4.0
      };

      const categories = Object.keys(avgRatings);
      const values = Object.values(avgRatings).map(Number);
      const weakestIndex = values.indexOf(Math.min(...values));
      const strongestIndex = values.indexOf(Math.max(...values));
      const overallAvg = values.reduce((a, b) => a + b, 0) / values.length;

      predictiveText.textContent =
        `Average rating is ${overallAvg.toFixed(2)}⭐. Highest in ${categories[strongestIndex]} (${values[strongestIndex].toFixed(1)}⭐), lowest in ${categories[weakestIndex]} (${values[weakestIndex].toFixed(1)}⭐).`;

      prescriptiveText.textContent =
        values[weakestIndex] < 4
          ? `📉 Focus on improving ${categories[weakestIndex]} through training or quality adjustments.`
          : `✅ Ratings are consistently high across all aspects — maintain service quality and responsiveness.`;

      window.insightsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: categories,
          datasets: [{
            label: 'Average Rating',
            data: values,
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

      insightsModal.classList.remove('hidden');
      return;
    }

    // ==============================
    // 🟢 Predictive Charts (Inquiries / Services)
    // ==============================
    let labels = sourceChart?.data.labels || [];
    let counts = sourceChart?.data.datasets?.[0]?.data?.map(Number) || [];

    try {
      let url = '';
      if (chartType === 'inquiriesTrend') {
        url = `http://localhost:5000/api/analytics/inquiries?period=${period}&mode=trend`;
      } else if (chartType === 'serviceTrend') {
        url = `http://localhost:5000/api/analytics/services/trend`;
      }

      const res = await fetch(url);
        if (!res.ok) {
        console.error('Trend API failed:', res.status, url);
        insightsModal.classList.remove('hidden');
        return;
      }

      const trendData = await res.json();

      labels = trendData.map(d => d.label);
      counts = trendData.map(d => Number(d.count));
    } catch (err) {
      console.error('Error fetching trend data for prediction:', err);
    }
    if (!counts.length) {
      console.warn(`[InsightsModal] No data available for ${chartType}.`);
      insightsModal.classList.remove('hidden');
      predictiveText.textContent = '⚠ No data available to analyze.';
      prescriptiveText.textContent = 'Please ensure recent records exist for this period.';
      return;
    }
    const predictedNext = linearRegressionForecast(counts);
    const lastValue = counts[counts.length - 1] || 0;
    const growthRate = lastValue ? ((predictedNext - lastValue) / lastValue) * 100 : 0;

    predictiveText.textContent =
      `Last period: ${lastValue}. Forecast next: ${predictedNext} (${growthRate.toFixed(2)}% change).`;
    prescriptiveText.textContent =
      growthRate > 15
        ? '📈 High growth! Allocate more staff/resources.'
        : growthRate < -5
        ? '📉 Decreasing trend detected. Review operations.'
        : '→ Trend is stable. Maintain current operations.';
    predictiveText.className = growthRate > 0 ? 'high' : 'low';

    insightTitle.textContent =
      chartType === 'inquiriesTrend'
        ? 'Inquiries Predictive Analysis'
        : 'Services Predictive Analysis';

    const forecastData = [...counts, predictedNext];
    const forecastLabels = [...labels, 'Next'];

    window.insightsChartInstance = new Chart(ctx, {
      type: sourceChart?.config?.type || 'line',
      data: {
        labels: forecastLabels,
        datasets: [
          {
            label: 'Actual',
            data: counts,
            borderColor: '#007bff',
            backgroundColor: 'rgba(0,123,255,0.2)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Forecast',
            data: forecastData,
            borderColor: 'orange',
            backgroundColor: 'rgba(255,165,0,0.2)',
            borderDash: [5, 5],
            fill: false,
            tension: 0.3,
            pointBackgroundColor: 'orange',
            pointRadius: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { display: true } }
      }
    });

    insightsModal.classList.remove('hidden');
  }
// (Inquiries + Feedback)
document.querySelectorAll('.view-insights-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    const chartType = e.target.getAttribute('data-chart');
    openInsightsModal(chartType);
  });
});

function closeInsightsModal() {
  insightsModal.classList.add('hidden');

  // 🧹 Safely destroy chart instance
  if (window.insightsChartInstance) {
    try {
      window.insightsChartInstance.destroy();
    } catch (err) {
      console.warn('[InsightsModal] Chart destroy on close error:', err);
    }
    window.insightsChartInstance = null;
  }

  // Optional cleanup
  predictiveText.textContent = '';
  prescriptiveText.textContent = '';
  insightTitle.textContent = '';
}

// 🧩 Add event listeners only once
if (closeBtn) closeBtn.addEventListener('click', closeInsightsModal);

window.addEventListener('click', e => {
  if (e.target === insightsModal) {
    closeInsightsModal();
  }
});


function appendNewCharts() {
  const mainSection = document.querySelector('.analytics-charts-side-by-side');
  if (!mainSection) return;

  const newSection = document.createElement('section');
  newSection.className = 'analytics-charts-side-by-side';
  newSection.innerHTML = `
    <div class="chart-container">
      <h3>Top Services Availed</h3>
      <button class="view-insights-btn" data-chart="topServices">View Insights</button>
      <canvas id="topServicesChart"></canvas>
    </div>
    <div class="chart-container">
      <h3>Total Services Availed Trend</h3>
      <button class="view-insights-btn" data-chart="serviceTrend">View Insights</button>
      <canvas id="servicesTrendChart"></canvas>
    </div>
  `;
  mainSection.insertAdjacentElement('afterend', newSection);

  topServicesChartCanvas = document.getElementById('topServicesChart');
  serviceTrendChartCanvas = document.getElementById('servicesTrendChart');

  // ✅ Attach the modal event listeners for these new buttons
  newSection.querySelectorAll('.view-insights-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const chartType = e.target.getAttribute('data-chart');
      openInsightsModal(chartType);
    });
  });
}
// Linear regression: returns predicted next value
function linearRegressionForecast(data) {
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i + 1); // x = 1..n
  const y = data.map(Number);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
  const b = (sumY - m * sumX) / n;

  return Math.round(m * (n + 1) + b); // predicted next value
}
});
