/**
 * Register Page Logic
 */

(function () {
    const registerForm = document.getElementById('registerForm');
    const nameInput = document.getElementById('nameInput');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const confirmPasswordInput = document.getElementById('confirmPasswordInput');
    const generalError = document.getElementById('generalError');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Clear errors
            Validation.clearError('nameInput');
            Validation.clearError('emailInput');
            Validation.clearError('passwordInput');
            generalError.textContent = ''; // Clear general error

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            // Validate
            let isValid = true;

            if (!Validation.required(name)) {
                Validation.showError('nameInput', 'Name is required');
                isValid = false;
            }

            if (!Validation.required(email)) {
                Validation.showError('emailInput', 'Email is required');
                isValid = false;
            } else if (!Validation.email(email)) {
                Validation.showError('emailInput', 'Invalid email format');
                isValid = false;
            }

            if (!Validation.required(password)) {
                Validation.showError('passwordInput', 'Password is required');
                isValid = false;
            } else if (!Validation.minLength(password, 6)) {
                Validation.showError('passwordInput', 'Password must be at least 6 characters');
                isValid = false;
            }

            if (password !== confirmPassword) {
                // Find error container for confirm password manually or use util if ID follows convention
                Validation.showError('confirmPasswordInput', 'Passwords do not match');
                isValid = false;
            }

            if (!isValid) return;

            // Attempt Register
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating Account...';

            try {
                const result = await Auth.register(name, email, password);

                if (result.success) {
                    // Redirect to dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    generalError.textContent = result.message || 'Registration failed';
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
