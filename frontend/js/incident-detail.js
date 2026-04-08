/* =============================================
   IncidentX — Incident Detail View
   ============================================= */

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;

  const loadingEl = document.getElementById('loading');
  const detailEl = document.getElementById('detail-card');
  const errorEl = document.getElementById('error-state');

  // Get incident ID from URL
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    loadingEl.classList.add('d-none');
    errorEl.classList.remove('d-none');
    return;
  }

  try {
    const inc = await api(`/incidents/${id}`);

    loadingEl.classList.add('d-none');

    // Populate details
    document.getElementById('detail-type').textContent = inc.incidentType;
    document.getElementById('detail-badges').innerHTML = `
      ${severityBadge(inc.severity)}
      ${statusBadge(inc.status)}
    `;
    document.getElementById('detail-id').textContent = `#${inc.incidentID}`;
    document.getElementById('detail-date').textContent = formatDate(inc.reportedDate);
    document.getElementById('detail-location').textContent = inc.location || 'Not specified';
    document.getElementById('detail-user').textContent = inc.username || 'Unknown';
    document.getElementById('detail-desc').textContent = inc.description;
    document.getElementById('detail-created').textContent = formatDate(inc.created_at);
    document.getElementById('detail-updated').textContent = formatDate(inc.updated_at);

    // Update page title
    document.title = `${inc.incidentType} #${inc.incidentID} — IncidentX`;

    detailEl.classList.remove('d-none');
  } catch (err) {
    loadingEl.classList.add('d-none');
    errorEl.classList.remove('d-none');
  }
});
