/* =============================================
   IncidentX — Admin Dashboard
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  const user = requireAdmin();
  if (!user) return;

  let currentStatus = 'All';
  let currentPage = 1;
  const limit = 20;

  // Initial load
  fetchIncidents();

  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentStatus = tab.dataset.status;
      currentPage = 1;
      fetchIncidents();
    });
  });

  // Save edit handler
  document.getElementById('save-edit-btn').addEventListener('click', saveEdit);

  // Confirm delete handler
  document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);

  // ==========================================
  // Fetch Incidents
  // ==========================================
  async function fetchIncidents() {
    const loadingEl = document.getElementById('loading');
    const tbody = document.getElementById('incidents-tbody');

    loadingEl.classList.remove('d-none');

    try {
      const params = new URLSearchParams({
        status: currentStatus,
        page: currentPage,
        limit
      });

      const data = await api(`/admin/incidents?${params}`);

      // Update stats
      document.getElementById('stat-total').textContent = data.counts.total;
      document.getElementById('stat-pending').textContent = data.counts.pending;
      document.getElementById('stat-verified').textContent = data.counts.verified;
      document.getElementById('stat-rejected').textContent = data.counts.rejected;

      loadingEl.classList.add('d-none');

      if (data.incidents.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center py-4" style="color: var(--text-muted);">
              No incidents found with status "${currentStatus}"
            </td>
          </tr>
        `;
        document.getElementById('pagination').classList.add('d-none');
        return;
      }

      // Render table rows
      tbody.innerHTML = data.incidents.map(inc => `
        <tr class="stagger-item">
          <td><strong>#${inc.incidentID}</strong></td>
          <td>${typeBadge(inc.incidentType)}</td>
          <td>${severityBadge(inc.severity)}</td>
          <td>${escapeHtml(inc.username)}</td>
          <td>${formatDate(inc.reportedDate)}</td>
          <td>${statusBadge(inc.status)}</td>
          <td>
            <div class="d-flex gap-1 flex-wrap">
              ${inc.status !== 'Verified' ? `
                <button class="action-btn action-btn-verify" onclick="verifyIncident(${inc.incidentID})" title="Verify">
                  ✓ Verify
                </button>
              ` : ''}
              ${inc.status !== 'Rejected' ? `
                <button class="action-btn action-btn-reject" onclick="rejectIncident(${inc.incidentID})" title="Reject">
                  ✗ Reject
                </button>
              ` : ''}
              <button class="action-btn action-btn-edit" onclick="openEdit(${inc.incidentID})" title="Edit">
                ✏ Edit
              </button>
              <button class="action-btn action-btn-delete" onclick="openDelete(${inc.incidentID})" title="Delete">
                🗑 Delete
              </button>
            </div>
          </td>
        </tr>
      `).join('');

      // Render pagination
      renderPagination(data.page, data.pages, data.total);
    } catch (err) {
      loadingEl.classList.add('d-none');
      showToast(err.message, 'error');
    }
  }

  function renderPagination(page, pages, total) {
    const paginationEl = document.getElementById('pagination');
    if (pages <= 1) {
      paginationEl.classList.add('d-none');
      return;
    }

    paginationEl.innerHTML = `
      <button class="page-btn" onclick="adminGoToPage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>← Previous</button>
      <span class="page-info">Page ${page} of ${pages} (${total} total)</span>
      <button class="page-btn" onclick="adminGoToPage(${page + 1})" ${page >= pages ? 'disabled' : ''}>Next →</button>
    `;
    paginationEl.classList.remove('d-none');
  }

  // ==========================================
  // Action Functions (global scope)
  // ==========================================

  window.adminGoToPage = function(page) {
    currentPage = page;
    fetchIncidents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.verifyIncident = async function(id) {
    try {
      await api(`/admin/incidents/${id}/status`, 'PATCH', { status: 'Verified' });
      showToast('Incident verified successfully', 'success');
      fetchIncidents();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.rejectIncident = async function(id) {
    try {
      await api(`/admin/incidents/${id}/status`, 'PATCH', { status: 'Rejected' });
      showToast('Incident rejected', 'warning');
      fetchIncidents();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.openEdit = async function(id) {
    try {
      const inc = await api(`/incidents/${id}`);
      document.getElementById('edit-id').value = inc.incidentID;
      document.getElementById('edit-type').value = inc.incidentType;
      document.getElementById('edit-severity').value = inc.severity;
      document.getElementById('edit-date').value = formatDateForInput(inc.reportedDate);
      document.getElementById('edit-location').value = inc.location || '';
      document.getElementById('edit-description').value = inc.description;

      const modal = new bootstrap.Modal(document.getElementById('editModal'));
      modal.show();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  async function saveEdit() {
    const id = document.getElementById('edit-id').value;
    const btn = document.getElementById('save-edit-btn');

    setLoading(btn, true);

    try {
      await api(`/admin/incidents/${id}`, 'PUT', {
        incidentType: document.getElementById('edit-type').value,
        severity: document.getElementById('edit-severity').value,
        reportedDate: document.getElementById('edit-date').value,
        location: document.getElementById('edit-location').value,
        description: document.getElementById('edit-description').value
      });

      bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
      showToast('Incident updated successfully', 'success');
      fetchIncidents();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(btn, false, 'Save Changes');
    }
  }

  window.openDelete = function(id) {
    document.getElementById('delete-id').value = id;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
  };

  async function confirmDelete() {
    const id = document.getElementById('delete-id').value;
    const btn = document.getElementById('confirm-delete-btn');

    setLoading(btn, true);

    try {
      await api(`/admin/incidents/${id}`, 'DELETE');
      bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
      showToast('Incident deleted successfully', 'success');
      fetchIncidents();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(btn, false, 'Delete Incident');
    }
  }
});
