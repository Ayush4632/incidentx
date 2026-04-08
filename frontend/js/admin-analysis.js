/* =============================================
   IncidentX — Admin Analysis (Charts)
   ============================================= */

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAdmin();
  if (!user) return;

  const loadingEl = document.getElementById('loading');
  const chartsEl = document.getElementById('charts-container');
  const emptyEl = document.getElementById('empty-state');

  try {
    const data = await api('/admin/analytics');

    loadingEl.classList.add('d-none');

    // Check if there's any data
    const hasData = (data.byType && data.byType.length > 0) ||
                    (data.bySeverity && data.bySeverity.length > 0) ||
                    (data.byMonth && data.byMonth.length > 0);

    if (!hasData) {
      emptyEl.classList.remove('d-none');
      return;
    }

    chartsEl.classList.remove('d-none');

    // Global Chart.js defaults for dark theme
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(148, 163, 184, 0.1)';
    Chart.defaults.font.family = "'Inter', sans-serif";

    // ==========================================
    // Chart 1: Incidents by Type (Doughnut)
    // ==========================================
    if (data.byType && data.byType.length > 0) {
      const ctx1 = document.getElementById('chart-type').getContext('2d');
      new Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels: data.byType.map(d => d.type),
          datasets: [{
            data: data.byType.map(d => d.count),
            backgroundColor: [
              'rgba(0, 212, 255, 0.8)',   // Cyan - Phishing
              'rgba(168, 85, 247, 0.8)',   // Purple - Malware
              'rgba(249, 115, 22, 0.8)',   // Orange - Data Breach
              'rgba(0, 255, 136, 0.8)'     // Green - Online Fraud
            ],
            borderColor: [
              'rgba(0, 212, 255, 1)',
              'rgba(168, 85, 247, 1)',
              'rgba(249, 115, 22, 1)',
              'rgba(0, 255, 136, 1)'
            ],
            borderWidth: 2,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true,
                pointStyleWidth: 12,
                font: { size: 13, weight: '500' }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              titleFont: { size: 14, weight: '600' },
              bodyFont: { size: 13 },
              padding: 12,
              cornerRadius: 10,
              borderColor: 'rgba(0, 212, 255, 0.3)',
              borderWidth: 1,
              callbacks: {
                label: function(ctx) {
                  const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                  const pct = ((ctx.raw / total) * 100).toFixed(1);
                  return ` ${ctx.label}: ${ctx.raw} (${pct}%)`;
                }
              }
            }
          },
          cutout: '60%'
        }
      });
    }

    // ==========================================
    // Chart 2: Incidents by Severity (Bar)
    // ==========================================
    if (data.bySeverity && data.bySeverity.length > 0) {
      const severityOrder = ['Low', 'Medium', 'High', 'Critical'];
      const severityColors = {
        'Low': { bg: 'rgba(34, 197, 94, 0.7)', border: 'rgba(34, 197, 94, 1)' },
        'Medium': { bg: 'rgba(245, 158, 11, 0.7)', border: 'rgba(245, 158, 11, 1)' },
        'High': { bg: 'rgba(239, 68, 68, 0.7)', border: 'rgba(239, 68, 68, 1)' },
        'Critical': { bg: 'rgba(220, 38, 38, 0.85)', border: 'rgba(220, 38, 38, 1)' }
      };

      // Sort data by severity order
      const sortedSeverity = severityOrder
        .map(sev => {
          const found = data.bySeverity.find(d => d.severity === sev);
          return { severity: sev, count: found ? found.count : 0 };
        });

      const ctx2 = document.getElementById('chart-severity').getContext('2d');
      new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: sortedSeverity.map(d => d.severity),
          datasets: [{
            label: 'Incidents',
            data: sortedSeverity.map(d => d.count),
            backgroundColor: sortedSeverity.map(d => severityColors[d.severity].bg),
            borderColor: sortedSeverity.map(d => severityColors[d.severity].border),
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
            barThickness: 50
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              titleFont: { size: 14, weight: '600' },
              bodyFont: { size: 13 },
              padding: 12,
              cornerRadius: 10,
              borderColor: 'rgba(0, 212, 255, 0.3)',
              borderWidth: 1
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 13, weight: '600' } }
            },
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                font: { size: 12 }
              },
              grid: { color: 'rgba(148, 163, 184, 0.06)' }
            }
          }
        }
      });
    }

    // ==========================================
    // Chart 3: Monthly Trend (Line)
    // ==========================================
    if (data.byMonth && data.byMonth.length > 0) {
      const monthLabels = data.byMonth.map(d => {
        const [year, month] = d.month.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      });

      const ctx3 = document.getElementById('chart-trend').getContext('2d');

      // Create gradient
      const gradient = ctx3.createLinearGradient(0, 0, 0, 350);
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 212, 255, 0.0)');

      new Chart(ctx3, {
        type: 'line',
        data: {
          labels: monthLabels,
          datasets: [{
            label: 'Incidents',
            data: data.byMonth.map(d => d.count),
            fill: true,
            backgroundColor: gradient,
            borderColor: 'rgba(0, 212, 255, 1)',
            borderWidth: 3,
            pointBackgroundColor: 'rgba(0, 212, 255, 1)',
            pointBorderColor: '#0a0e1a',
            pointBorderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 9,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              titleFont: { size: 14, weight: '600' },
              bodyFont: { size: 13 },
              padding: 12,
              cornerRadius: 10,
              borderColor: 'rgba(0, 212, 255, 0.3)',
              borderWidth: 1,
              callbacks: {
                label: function(ctx) {
                  return ` ${ctx.raw} incident${ctx.raw !== 1 ? 's' : ''}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(148, 163, 184, 0.06)' },
              ticks: { font: { size: 12, weight: '500' } }
            },
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                font: { size: 12 }
              },
              grid: { color: 'rgba(148, 163, 184, 0.06)' }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });
    }

  } catch (err) {
    loadingEl.classList.add('d-none');
    showToast(err.message, 'error');
  }
});
