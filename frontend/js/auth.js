/* =============================================
   IncidentX — Auth (Login + Register)
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  // ============================================
  // LOGIN FORM
  // ============================================
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    // If already logged in, redirect
    const user = getUser();
    if (user) {
      window.location.href = user.role === 'admin' ? '/admin/dashboard.html' : '/dashboard.html';
      return;
    }

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      const errorDiv = document.getElementById('login-error');
      const btn = document.getElementById('login-btn');

      // Clear previous errors
      errorDiv.classList.add('d-none');

      if (!username || !password) {
        errorDiv.textContent = 'Please enter both username and password.';
        errorDiv.classList.remove('d-none');
        return;
      }

      setLoading(btn, true);

      try {
        const data = await api('/auth/login', 'POST', { username, password });
        saveUser(data);
        window.location.href = data.role === 'admin' ? '/admin/dashboard.html' : '/dashboard.html';
      } catch (err) {
        errorDiv.textContent = err.message || 'Login failed. Please try again.';
        errorDiv.classList.remove('d-none');
        setLoading(btn, false, 'Login');
      }
    });
  }

  // ============================================
  // REGISTER FORM
  // ============================================
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    // If already logged in, redirect
    const user = getUser();
    if (user) {
      window.location.href = user.role === 'admin' ? '/admin/dashboard.html' : '/dashboard.html';
      return;
    }

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('reg-username').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirm = document.getElementById('reg-confirm').value;

      const errorDiv = document.getElementById('register-error');
      const successDiv = document.getElementById('register-success');
      const btn = document.getElementById('register-btn');

      // Clear previous messages
      errorDiv.classList.add('d-none');
      successDiv.classList.add('d-none');
      clearValidation();

      // Client-side validation
      let valid = true;

      // Username
      if (!username || username.length < 3) {
        showFieldError('reg-username', 'err-username', 'Username must be at least 3 characters');
        valid = false;
      }

      // Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        showFieldError('reg-email', 'err-email', 'Please enter a valid email address');
        valid = false;
      }

      // Password
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
      if (!password || !passwordRegex.test(password)) {
        showFieldError('reg-password', 'err-password', 'Password must be at least 8 characters with letters and numbers');
        valid = false;
      }

      // Confirm password
      if (password !== confirm) {
        showFieldError('reg-confirm', 'err-confirm', 'Passwords do not match');
        valid = false;
      }

      if (!valid) return;

      setLoading(btn, true);

      try {
        await api('/auth/register', 'POST', { username, email, password });
        successDiv.textContent = 'Registration successful! Redirecting to login...';
        successDiv.classList.remove('d-none');
        registerForm.reset();

        setTimeout(() => {
          window.location.href = '/login.html';
        }, 2000);
      } catch (err) {
        errorDiv.textContent = err.message || 'Registration failed. Please try again.';
        errorDiv.classList.remove('d-none');
        setLoading(btn, false, 'Create Account');
      }
    });
  }

  // ============================================
  // Validation Helpers
  // ============================================
  function showFieldError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    if (input) input.classList.add('is-invalid');
    if (error) {
      error.textContent = message;
      error.style.display = 'block';
    }
  }

  function clearValidation() {
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    document.querySelectorAll('.invalid-feedback').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
  }
});
