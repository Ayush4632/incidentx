/* =============================================
   IncidentX — My Incidents
   ============================================= */

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;

  const loadingEl = document.getElementById('loading');
  const tableEl = document.getElementById('table-container');
  const emptyEl = document.getElementById('empty-state');
  const tbody = document.getElementById('incidents-tbody');

  try {
    const data = await api('/incidents/my');

    loadingEl.classList.add('d-none');

    if (!data.incidents || data.incidents.length === 0) {
      emptyEl.classList.remove('d-none');
      return;
    }

    tbody.innerHTML = data.incidents.map((inc, idx) => `
      <tr class="stagger-item">
        <td><strong>#${inc.incidentID}</strong></td>
        <td>${typeBadge(inc.incidentType)}</td>
        <td>${severityBadge(inc.severity)}</td>
        <td>${formatDate(inc.reportedDate)}</td>
        <td>${statusBadge(inc.status)}</td>
        <td>
          <a href="/incident-detail.html?id=${inc.incidentID}" class="btn btn-cyber-outline btn-sm">
            View
          </a>
        </td>
      </tr>
    `).join('');

    tableEl.classList.remove('d-none');
  } catch (err) {
    loadingEl.classList.add('d-none');
    showToast(err.message, 'error');
  }
});
