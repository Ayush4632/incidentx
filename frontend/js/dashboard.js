/* =============================================
   IncidentX — User Dashboard
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth();
  if (!user) return;

  let currentPage = 1;
  const limit = 20;

  // DOM refs
  const loadingEl = document.getElementById('loading');
  const listEl = document.getElementById('incidents-list');
  const emptyEl = document.getElementById('empty-state');
  const paginationEl = document.getElementById('pagination');

  // Load incidents
  fetchIncidents();

  // Apply filters
  document.getElementById('apply-filters').addEventListener('click', () => {
    currentPage = 1;
    fetchIncidents();
  });

  // Also trigger on Enter key in search
  document.getElementById('filter-keyword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      currentPage = 1;
      fetchIncidents();
    }
  });

  async function fetchIncidents() {
    // Show loading
    loadingEl.classList.remove('d-none');
    listEl.classList.add('d-none');
    emptyEl.classList.add('d-none');
    paginationEl.classList.add('d-none');

    const keyword = document.getElementById('filter-keyword').value.trim();
    const timeRange = document.getElementById('filter-time').value;
    const type = document.getElementById('filter-type').value;
    const severity = document.getElementById('filter-severity').value;

    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit,
        keyword,
        timeRange,
        type,
        severity
      });

      const data = await api(`/incidents?${params}`);

      loadingEl.classList.add('d-none');

      if (data.incidents.length === 0) {
        emptyEl.classList.remove('d-none');
        return;
      }

      renderIncidents(data.incidents);
      renderPagination(data.page, data.pages, data.total);
    } catch (err) {
      loadingEl.classList.add('d-none');
      showToast(err.message, 'error');
    }
  }

  function renderIncidents(incidents) {
    listEl.innerHTML = incidents.map((inc, idx) => `
      <div class="incident-card stagger-item" onclick="window.location.href='/incident-detail.html?id=${inc.incidentID}'">
        <div class="incident-header">
          <div>
            ${typeBadge(inc.incidentType)}
            ${severityBadge(inc.severity)}
            ${statusBadge(inc.status)}
          </div>
          <span style="color: var(--text-muted); font-size: 0.8rem;">#${inc.incidentID}</span>
        </div>
        <div class="incident-desc">${escapeHtml(truncate(inc.description, 150))}</div>
        <div class="incident-meta">
          <span>📅 ${formatDate(inc.reportedDate)}</span>
          ${inc.location ? `<span>📍 ${escapeHtml(inc.location)}</span>` : ''}
          <span>👤 ${escapeHtml(inc.username)}</span>
        </div>
      </div>
    `).join('');

    listEl.classList.remove('d-none');
  }

  function renderPagination(page, pages, total) {
    if (pages <= 1) {
      paginationEl.classList.add('d-none');
      return;
    }

    paginationEl.innerHTML = `
      <button class="page-btn" onclick="goToPage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>← Previous</button>
      <span class="page-info">Page ${page} of ${pages} (${total} total)</span>
      <button class="page-btn" onclick="goToPage(${page + 1})" ${page >= pages ? 'disabled' : ''}>Next →</button>
    `;
    paginationEl.classList.remove('d-none');
  }

  // Make goToPage globally accessible
  window.goToPage = function(page) {
    currentPage = page;
    fetchIncidents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
});
