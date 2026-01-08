/**
 * Login Page Logic
 */

(function () {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const generalError = document.getElementById('generalError');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Clear previous errors
            Validation.clearError('emailInput');
            generalError.textContent = '';

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            // Validate
            let isValid = true;
            if (!Validation.required(email)) {
                Validation.showError('emailInput', 'Email is required');
                isValid = false;
            } else if (!Validation.email(email)) {
                Validation.showError('emailInput', 'Please enter a valid email');
                isValid = false;
            }

            if (!Validation.required(password)) {
                // Ideally show specific password error but simple is fine
                isValid = false;
            }

            if (!isValid) return;

            // Attempt Login
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing In...';

            try {
                const result = await Auth.login(email, password);

                if (result.success) {
                    window.location.href = 'dashboard.html';
                } else {
                    generalError.textContent = result.message || 'Login failed';
                    generalError.style.display = 'block';
                }
            } catch (err) {
                console.error(err);
                generalError.textContent = 'An unexpected error occurred';
                generalError.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
})();
