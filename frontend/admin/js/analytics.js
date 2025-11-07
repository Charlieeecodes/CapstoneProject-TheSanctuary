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
  let currentInquiriesPeriod = 'month';


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
      // ✅ Mini chart using real trend data instead of random values
      if (inquiriesMiniEl) {
        const ctx = inquiriesMiniEl.getContext('2d');
        if (window.miniInquiriesChart) window.miniInquiriesChart.destroy();

        // Fetch small trend data from backend
        const trendRes = await fetch(`http://localhost:5000/api/analytics/inquiries?period=${period}&mode=trend`);
        const trendData = await trendRes.json();

        const labels = trendData.map(d => d.label);
        const values = trendData.map(d => Number(d.count));

        window.miniInquiriesChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              data: values,
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
      currentInquiriesPeriod = periodMap[e.target.value] || e.target.value; 
      await updateInquiriesChart(currentInquiriesPeriod);
      await updateInquiriesKPI(currentInquiriesPeriod);
    });

    inquiriesPeriodSelect.value = 'month';
    currentInquiriesPeriod = 'month';
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
    // 🧹 Ensure no old Chart.js instance is active on the canvas
    if (window.insightsChartInstance) {
      try {
        window.insightsChartInstance.destroy();
        window.insightsChartInstance = null;
        console.log('🧹 Destroyed previous insights chart before creating a new one');
      } catch (err) {
        console.warn('[InsightsModal] Chart destroy error:', err);
      }
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

      function generatePrescriptiveInsight(labels, shares) {
        const totalServices = labels.length;
        const maxIndex = shares.indexOf(Math.max(...shares));
        const minIndex = shares.indexOf(Math.min(...shares));
        const avgShare = shares.reduce((a, b) => a + b, 0) / totalServices;
        const diversity = shares.filter(s => s > avgShare * 1.1).length;

        const topService = labels[maxIndex];
        const topShare = shares[maxIndex];
        const lowService = labels[minIndex];
        const lowShare = shares[minIndex];

        let recommendation = '';

        // 🌟 Case 1: One dominant service
        if (topShare >= 60) {
          recommendation = `
            🔥 <b>${topService}</b> is the clear favorite — capturing <b>${topShare.toFixed(1)}%</b> of all completed services!<br>
            Demand is strong and consistent. Make sure your staff and supplies can keep up, and consider showcasing client stories or add-ons related to this service.
          `;
        }

        // 📊 Case 2: Leading but others growing
        else if (topShare >= 35 && diversity <= 2) {
          recommendation = `
            📈 <b>${topService}</b> leads the way with <b>${topShare.toFixed(1)}%</b> — but other services are beginning to catch attention.<br>
            Try offering bundled promotions or linking <b>${topService}</b> with <b>${lowService}</b> to encourage clients to explore more options.
          `;
        }

        // ⚖️ Case 3: Balanced distribution
        else if (topShare < 35 && diversity >= totalServices / 2) {
          recommendation = `
            ⚖️ Demand looks well balanced across your services.<br>
            Clients are exploring a variety of offerings, which shows healthy engagement. 
            Keep monitoring for new favorites and ensure each service stays visible and well-supported.
          `;
        }

        // 📉 Case 4: Weak engagement overall
        else if (Math.max(...shares) < 20) {
          recommendation = `
            📉 Engagement seems low across the board.<br>
            Consider refreshing your promotions, running a themed campaign, or highlighting seasonal services to reignite interest.
          `;
        }

        // 🎯 Case 5: Underserved / least popular service
        else {
          recommendation = `
            🎯 <b>${lowService}</b> has the lowest engagement at only <b>${lowShare.toFixed(1)}%</b>.<br>
            It may need a boost — review pricing, improve visibility, or create a short-term promo to spark awareness.
          `;
        }

        // 💬 Bonus: motivational rotating tip
        const tips = [
          '✅ Track these trends weekly to spot rising favorites early.',
          '💡 Post a short success story or testimonial for your top service.',
          '📊 Compare this chart with feedback ratings for deeper insights.',
          '🕒 Review underperforming services each month for fresh ideas.',
        ];
        const randomTip = tips[Math.floor(Math.random() * tips.length)];

        return `${recommendation}<br><br><i>${randomTip}</i>`;
      }

      // 👇 Call it when setting your prescriptive text
      prescriptiveText.innerHTML = generatePrescriptiveInsight(labels, shares);



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

      // 🧠 Always fetch fresh KPI data before displaying insights
      let avgRatings = null;
      try {
        const res = await fetch('http://localhost:5000/api/analytics/kpis', { cache: 'no-store' });
        const data = await res.json();
        avgRatings = data.avgRatings;
        window.kpiData = data; // 🔁 update global cache for next time
      } catch (err) {
        console.error('❌ Failed to refresh feedback KPI data:', err);
      }

      // 🧩 Fallback if fetch fails
      if (!avgRatings) {
        avgRatings = {
          overall: 4.5, service: 4.3, satisfaction: 4.1,
          professionalism: 4.7, communication: 3.9, facility: 4.0
        };
      }

      // 🔍 Calculate feedback insights
      const categories = Object.keys(avgRatings);
      const values = Object.values(avgRatings).map(Number);
      const weakestIndex = values.indexOf(Math.min(...values));
      const strongestIndex = values.indexOf(Math.max(...values));
      const overallAvg = values.reduce((a, b) => a + b, 0) / values.length;

      const topCategory = categories[strongestIndex];
      const lowCategory = categories[weakestIndex];
      const topValue = values[strongestIndex].toFixed(1);
      const lowValue = values[weakestIndex].toFixed(1);
      const avg = overallAvg.toFixed(2);

      // 🌟 Predictive — what’s happening right now
      let predictiveMessage = '';
      if (overallAvg >= 4.5) {
        predictiveMessage = `
          🌟 <b>Outstanding feedback overall!</b><br>
          Clients are <b>highly satisfied</b> with an average rating of <b>${avg}⭐</b>.<br>
          <b>${topCategory}</b> is your strongest area (${topValue}⭐), showing genuine client trust.<br>
          Even <b>${lowCategory}</b> (${lowValue}⭐) remains strong — an excellent sign of consistency.
        `;
      } 
      else if (overallAvg >= 4.0) {
        predictiveMessage = `
          😊 <b>Very positive overall feedback!</b><br>
          You’re holding a solid <b>${avg}⭐</b> average. Clients especially appreciate <b>${topCategory}</b> (${topValue}⭐).<br>
          <b>${lowCategory}</b> (${lowValue}⭐) could use small refinements to push scores even higher.
        `;
      } 
      else if (overallAvg >= 3.0) {
        predictiveMessage = `
          😐 <b>Mixed impressions detected.</b><br>
          Average rating is <b>${avg}⭐</b>. Clients like <b>${topCategory}</b> (${topValue}⭐), 
          but <b>${lowCategory}</b> (${lowValue}⭐) might be lowering satisfaction.<br>
          Take time to listen and address key concerns in that area.
        `;
      } 
      else {
        predictiveMessage = `
          ⚠️ <b>Low feedback ratings overall (${avg}⭐).</b><br>
          While <b>${topCategory}</b> (${topValue}⭐) remains relatively positive, 
          <b>${lowCategory}</b> (${lowValue}⭐) shows clear dissatisfaction.<br>
          A focused quality review or retraining session may be needed.
        `;
      }

      predictiveText.innerHTML = predictiveMessage;

      // 💡 Prescriptive — what to do next
      let prescriptiveMessage = '';
      if (values[weakestIndex] < 3.5) {
        prescriptiveMessage = `
          📉 <b>Action needed:</b> Improve <b>${lowCategory}</b> by reviewing service flow, 
          providing staff refreshers, or gathering direct client input to understand pain points.
        `;
      } 
      else if (values[weakestIndex] < 4.0) {
        prescriptiveMessage = `
          🔍 <b>Opportunity to improve:</b> <b>${lowCategory}</b> scores slightly lower than others. 
          Small changes — like faster responses or clearer communication — could lift ratings further.
        `;
      } 
      else {
        prescriptiveMessage = `
          ✅ <b>Great balance across all areas!</b><br>
          Ratings are consistently strong, showing reliable service quality. 
          Keep recognizing staff performance and maintaining your communication standards.
        `;
      }

      prescriptiveText.innerHTML = prescriptiveMessage;

      // 📊 Render the chart visualization
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
    // ==============================
    // 🧠 Enhanced Predictive & Prescriptive Logic
    // ==============================

    // Step 1: Smooth data with 3-point moving average to reduce spikes
    const smoothed = counts.map((_, i, arr) => {
      const prev = arr[i - 1] ?? arr[i];
      const next = arr[i + 1] ?? arr[i];
      return Math.round((prev + arr[i] + next) / 3);
    });

    // Step 2: Forecast using smoothed data
    const predictedNext = linearRegressionForecast(smoothed);
    const lastValue = smoothed[smoothed.length - 1] || 0;
    const growthRate = lastValue ? ((predictedNext - lastValue) / lastValue) * 100 : 0;

    // Step 3: Compute forecast range for realism
    const lowerBound = Math.round(predictedNext * 0.9);
    const upperBound = Math.round(predictedNext * 1.1);

    // Step 4: Context-aware predictive analysis
    let timeframeContext = '';
    if (period === 'week') timeframeContext = 'this week';
    else if (period === 'month') timeframeContext = 'this month';
    else if (period === 'year') timeframeContext = 'this year';

    // Enhanced Predictive Text based on trend forecast
    if (chartType === 'inquiriesTrend') {
      if (growthRate > 15) {
        predictiveText.innerHTML = `
          🔮 <b>Busy days ahead!</b><br>
          Inquiries are expected to <b>rise sharply</b> over the next ${period}. 
          Get ready for a wave of new questions and requests — a great sign of growing interest!
        `;
      } 
      else if (growthRate > 5) {
        predictiveText.innerHTML = `
          📈 <b>Steady climb expected.</b><br>
          Inquiries should keep growing at a healthy pace. Keep your response times quick — momentum is on your side.
        `;
      } 
      else if (growthRate > -5) {
        predictiveText.innerHTML = `
          🟦 <b>Holding steady.</b><br>
          Inquiry activity is expected to stay about the same in the coming ${period}. 
          Consistency is good — use this time to plan your next outreach push.
        `;
      } 
      else if (growthRate > -15) {
        predictiveText.innerHTML = `
          ⚠️ <b>Slight slowdown ahead.</b><br>
          You may notice fewer inquiries than usual. It might just be a quiet week — stay visible and check if any service pages need updates.
        `;
      } 
      else {
        predictiveText.innerHTML = `
          🔻 <b>Inquiries may dip noticeably.</b><br>
          A drop is expected in the next ${period}. 
          Consider re-engaging your audience or running a small reminder campaign to boost interest again.
        `;
      }
    }

    else if (chartType === 'serviceTrend') {
      if (growthRate > 15) {
        predictiveText.innerHTML = `
          💼 <b>High demand coming!</b><br>
          Service completions are predicted to jump significantly. 
          Make sure staff and resources are ready for a busier period ahead.
        `;
      } 
      else if (growthRate > 5) {
        predictiveText.innerHTML = `
          📊 <b>Good news — demand is growing.</b><br>
          Expect a few more service requests in the next ${period}. 
          A great time to keep quality high and clients happy.
        `;
      } 
      else if (growthRate > -5) {
        predictiveText.innerHTML = `
          🟦 <b>Stable week ahead.</b><br>
          Service activity should remain consistent. 
          Keep doing what’s working, and use this calm period to prepare for future growth.
        `;
      } 
      else if (growthRate > -15) {
        predictiveText.innerHTML = `
          ⚠️ <b>Minor slowdown predicted.</b><br>
          You might see a few fewer bookings than usual. 
          Stay connected with clients and consider offering follow-up reminders.
        `;
      } 
      else {
        predictiveText.innerHTML = `
          🔻 <b>Services may slow down soon.</b><br>
          A noticeable drop could be coming. 
          Check for scheduling issues, recent feedback, or seasonal factors that might be affecting demand.
        `;
      }
    }


    // Step 5: Smarter, Insightful Prescriptive Texts
    if (chartType === 'inquiriesTrend') {
      if (growthRate > 20) {
        prescriptiveText.innerHTML = `
          🚀 <b>Massive Surge in Inquiries (+${growthRate.toFixed(1)}%)</b><br>
          This strong upward trend indicates growing community engagement and high visibility of your services.
          <br><br>
          <b>Next Steps:</b> Increase staff availability, extend office hours, or promote bundled service offers 
          to sustain and capitalize on this momentum.
        `;
      } 
      else if (growthRate > 10) {
        prescriptiveText.innerHTML = `
          📈 <b>Healthy Inquiry Growth (+${growthRate.toFixed(1)}%)</b><br>
          The steady climb suggests consistent outreach effectiveness.
          <br><br>
          <b>Recommendation:</b> Maintain active communication channels, ensure prompt responses, 
          and highlight top-performing services in upcoming campaigns.
        `;
      } 
      else if (growthRate > 0) {
        prescriptiveText.innerHTML = `
          🟢 <b>Minor Increase in Inquiries (+${growthRate.toFixed(1)}%)</b><br>
          Growth is modest but positive — customers remain engaged.
          <br><br>
          <b>Tip:</b> Review which days or channels generate more inquiries, and 
          reallocate attention toward those with higher engagement.
        `;
      } 
      else if (growthRate < -15) {
        prescriptiveText.innerHTML = `
          🔻 <b>Significant Drop in Inquiries (${growthRate.toFixed(1)}%)</b><br>
          A sharp decline could reflect reduced visibility or delays in responses.
          <br><br>
          <b>Immediate Action:</b> Audit recent marketing activities, ensure inquiry forms 
          are working properly, and reach out to past clients with follow-up messages.
        `;
      } 
      else if (growthRate < -5) {
        prescriptiveText.innerHTML = `
          📉 <b>Moderate Decline (${growthRate.toFixed(1)}%)</b><br>
          Engagement is slipping slightly — may be seasonal or due to reduced exposure.
          <br><br>
          <b>Suggestion:</b> Refresh online posts, feature success stories, 
          or collaborate with local partners to regain attention.
        `;
      } 
      else {
        prescriptiveText.innerHTML = `
          🟦 <b>Stable Inquiry Levels (${growthRate.toFixed(1)}%)</b><br>
          No major fluctuations detected — stability indicates operational consistency.
          <br><br>
          <b>Keep it up:</b> Maintain your response speed and customer follow-ups, 
          while experimenting with small engagement boosts (e.g., feedback posts, polls).
        `;
      }
    }

    else if (chartType === 'serviceTrend') {
      if (growthRate > 20) {
        prescriptiveText.innerHTML = `
          💼 <b>Strong Service Uptake (+${growthRate.toFixed(1)}%)</b><br>
          A major surge in completed services — demand is scaling quickly.
          <br><br>
          <b>Next Steps:</b> Monitor team workload, streamline scheduling, 
          and ensure quality control to avoid service fatigue.
        `;
      } 
      else if (growthRate > 10) {
        prescriptiveText.innerHTML = `
          📊 <b>Consistent Service Growth (+${growthRate.toFixed(1)}%)</b><br>
          Indicates healthy client satisfaction and effective follow-through.
          <br><br>
          <b>Recommendation:</b> Reward top-performing staff, 
          and document successful service workflows for standardization.
        `;
      } 
      else if (growthRate > 0) {
        prescriptiveText.innerHTML = `
          🟢 <b>Slight Service Increase (+${growthRate.toFixed(1)}%)</b><br>
          Positive but gentle progress — service demand remains steady.
          <br><br>
          <b>Tip:</b> Introduce referral incentives or client loyalty programs 
          to turn small gains into sustainable growth.
        `;
      } 
      else if (growthRate < -15) {
        prescriptiveText.innerHTML = `
          ⚠️ <b>Major Drop in Services (${growthRate.toFixed(1)}%)</b><br>
          Potential causes: cancellations, scheduling gaps, or service quality issues.
          <br><br>
          <b>Immediate Action:</b> Conduct quick client surveys, review recent feedback, 
          and retrain staff where bottlenecks appear.
        `;
      } 
      else if (growthRate < -5) {
        prescriptiveText.innerHTML = `
          📉 <b>Minor Decline in Service Completions (${growthRate.toFixed(1)}%)</b><br>
          A temporary dip — may relate to external factors or limited availability.
          <br><br>
          <b>Suggestion:</b> Check for scheduling overlaps and evaluate 
          whether peak-hour demand is being handled efficiently.
        `;
      } 
      else {
        prescriptiveText.innerHTML = `
          🟦 <b>Stable Service Volume (${growthRate.toFixed(1)}%)</b><br>
          Demand remains balanced — a sign of predictable workflows.
          <br><br>
          <b>Keep it steady:</b> Maintain quality assurance routines and track 
          client satisfaction to ensure continued reliability.
        `;
      }
    }


    // Step 6: Optional color styling
    predictiveText.className = growthRate > 10 ? 'high' : growthRate < -5 ? 'low' : 'neutral';


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

    // 🧩 If viewing inquiries trend, pass current period dynamically
    if (chartType === 'inquiriesTrend') {
      openInsightsModal(chartType, currentInquiriesPeriod);
    } else {
      openInsightsModal(chartType);
    }
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
