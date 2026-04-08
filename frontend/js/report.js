/* =============================================
   IncidentX — Report Incident
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth();
  if (!user) return;

  const form = document.getElementById('report-form');
  const descInput = document.getElementById('description');
  const charCounter = document.getElementById('char-counter');
  const errorDiv = document.getElementById('report-error');
  const successDiv = document.getElementById('report-success');
  const submitBtn = document.getElementById('submit-btn');

  // Set default date to now
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  document.getElementById('reported-date').value =
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

  // Live character count
  descInput.addEventListener('input', () => {
    const len = descInput.value.length;
    charCounter.textContent = `${len} characters (minimum 20)`;
    if (len >= 20) {
      charCounter.classList.add('valid');
      charCounter.classList.remove('invalid');
    } else if (len > 0) {
      charCounter.classList.add('invalid');
      charCounter.classList.remove('valid');
    } else {
      charCounter.classList.remove('valid', 'invalid');
    }
  });

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear
    errorDiv.classList.add('d-none');
    successDiv.classList.add('d-none');
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

    const incidentType = document.getElementById('incident-type').value;
    const severity = document.getElementById('severity').value;
    const reportedDate = document.getElementById('reported-date').value;
    const location = document.getElementById('location').value.trim();
    const description = descInput.value.trim();

    // Validate
    let valid = true;

    if (!incidentType) {
      document.getElementById('incident-type').classList.add('is-invalid');
      valid = false;
    }
    if (!severity) {
      document.getElementById('severity').classList.add('is-invalid');
      valid = false;
    }
    if (!reportedDate) {
      document.getElementById('reported-date').classList.add('is-invalid');
      valid = false;
    }
    if (!description || description.length < 20) {
      descInput.classList.add('is-invalid');
      valid = false;
    }

    if (!valid) return;

    setLoading(submitBtn, true);

    try {
      const data = await api('/incidents', 'POST', {
        incidentType,
        severity,
        reportedDate,
        location,
        description
      });

      successDiv.innerHTML = `
        ✅ Incident reported successfully! Status: <strong>Pending</strong>
        <br><small>Incident ID: #${data.incidentID}</small>
      `;
      successDiv.classList.remove('d-none');
      form.reset();
      charCounter.textContent = '0 characters (minimum 20)';
      charCounter.classList.remove('valid', 'invalid');

      // Reset default date
      document.getElementById('reported-date').value =
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

      setLoading(submitBtn, false, '🚀 Submit Report');
      showToast('Incident reported successfully!', 'success');
    } catch (err) {
      errorDiv.textContent = err.message;
      errorDiv.classList.remove('d-none');
      setLoading(submitBtn, false, '🚀 Submit Report');
    }
  });
});
