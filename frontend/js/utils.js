/* =============================================
   IncidentX — Shared Utilities
   ============================================= */

const API_BASE = '/api';

// =============================================
// Auth Helpers
// =============================================

/** Store user data in sessionStorage */
function saveUser(data) {
  sessionStorage.setItem('user', JSON.stringify(data));
}

/** Get user data from sessionStorage */
function getUser() {
  try {
    return JSON.parse(sessionStorage.getItem('user'));
  } catch {
    return null;
  }
}

/** Clear user data */
function clearUser() {
  sessionStorage.removeItem('user');
}

/** Auth guard — redirects to login if not authenticated */
function requireAuth() {
  const user = getUser();
  if (!user) {
    window.location.href = '/login.html';
    return null;
  }
  return user;
}

/** Admin guard — redirects regular users to dashboard */
function requireAdmin() {
  const user = requireAuth();
  if (user && user.role !== 'admin') {
    window.location.href = '/dashboard.html';
    return null;
  }
  return user;
}

// =============================================
// API Helper
// =============================================

/**
 * Make API requests with error handling
 * @param {string} endpoint - API path (without /api prefix)
 * @param {string} method - HTTP method
 * @param {object} body - Request body (for POST/PUT/PATCH)
 * @returns {Promise<object>} Response data
 */
async function api(endpoint, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include' // for httpOnly cookies
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(API_BASE + endpoint, opts);
  const data = await res.json();

  if (res.status === 401) {
    // Session expired or unauthorized
    clearUser();
    window.location.href = '/login.html';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// =============================================
// Badge Generators
// =============================================

/** Generate severity badge HTML */
function severityBadge(severity) {
  const map = {
    'Low': 'badge-severity-low',
    'Medium': 'badge-severity-medium',
    'High': 'badge-severity-high',
    'Critical': 'badge-severity-critical'
  };
  const cls = map[severity] || 'badge-severity-low';
  return `<span class="badge ${cls}">${severity}</span>`;
}

/** Generate status badge HTML */
function statusBadge(status) {
  const map = {
    'Pending': 'badge-status-pending',
    'Verified': 'badge-status-verified',
    'Rejected': 'badge-status-rejected'
  };
  const cls = map[status] || 'badge-status-pending';
  return `<span class="badge ${cls}">${status}</span>`;
}

/** Generate incident type badge HTML */
function typeBadge(type) {
  return `<span class="badge badge-type">${type}</span>`;
}

// =============================================
// Date Formatting
// =============================================

/** Format date string to readable format */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/** Format date for input fields (datetime-local) */
function formatDateForInput(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// =============================================
// Toast Notifications
// =============================================

/** Show a Bootstrap toast notification */
function showToast(message, type = 'success') {
  // Create toast container if it doesn't exist
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const toastId = 'toast-' + Date.now();
  const toastHTML = `
    <div id="${toastId}" class="toast toast-${type}" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="4000">
      <div class="toast-header">
        <span class="me-2">${icons[type] || icons.info}</span>
        <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
      </div>
      <div class="toast-body">${message}</div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', toastHTML);
  const toastEl = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastEl);
  toast.show();

  // Remove from DOM after hidden
  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}

// =============================================
// Loading State Helper
// =============================================

/** Set button to loading state */
function setLoading(btn, loading, originalText) {
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Loading...`;
  } else {
    btn.disabled = false;
    btn.innerHTML = originalText || btn.dataset.originalText || 'Submit';
  }
}

// =============================================
// Truncate Text
// =============================================

/** Truncate text to specified length */
function truncate(text, maxLen = 100) {
  if (!text) return '';
  return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
}

// =============================================
// Navbar Setup
// =============================================

/** Build and render the navbar based on auth state */
function setupNavbar() {
  const user = getUser();
  const nav = document.getElementById('main-navbar');
  if (!nav) return;

  let links = '';

  if (!user) {
    links = `
      <li class="nav-item"><a class="nav-link" href="/login.html">Login</a></li>
      <li class="nav-item"><a class="nav-link" href="/register.html">Register</a></li>
    `;
  } else if (user.role === 'admin') {
    links = `
      <li class="nav-item"><a class="nav-link" href="/admin/dashboard.html">All Incidents</a></li>
      <li class="nav-item"><a class="nav-link" href="/admin/analysis.html">Threat Analysis</a></li>
      <li class="nav-item"><a class="nav-link" href="#" id="nav-logout">Logout</a></li>
    `;
  } else {
    links = `
      <li class="nav-item"><a class="nav-link" href="/dashboard.html">Browse</a></li>
      <li class="nav-item"><a class="nav-link" href="/report.html">Report Incident</a></li>
      <li class="nav-item"><a class="nav-link" href="/my-incidents.html">My Incidents</a></li>
      <li class="nav-item"><a class="nav-link" href="#" id="nav-logout">Logout</a></li>
    `;
  }

  nav.innerHTML = `
    <div class="container">
      <a class="navbar-brand" href="${user ? (user.role === 'admin' ? '/admin/dashboard.html' : '/dashboard.html') : '/login.html'}">
        🛡️ IncidentX
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto align-items-center">
          ${links}
          ${user ? `<li class="nav-item ms-2"><span class="badge badge-type">👤 ${user.username}</span></li>` : ''}
        </ul>
      </div>
    </div>
  `;

  // Highlight active link
  const currentPath = window.location.pathname;
  nav.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });

  // Bind logout
  const logoutBtn = document.getElementById('nav-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await api('/auth/logout', 'POST');
      } catch (e) { /* ignore */ }
      clearUser();
      window.location.href = '/login.html';
    });
  }
}

// =============================================
// Escape HTML
// =============================================

/** Safely escape HTML to prevent XSS */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

// Auto-setup navbar on every page
document.addEventListener('DOMContentLoaded', () => {
  setupNavbar();
});
