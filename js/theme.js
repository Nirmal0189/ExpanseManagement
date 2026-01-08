/**
 * Theme Management Script
 * Handles Dark Mode persistence and toggling
 */

(function () {
    // Defines
    const STORAGE_KEY = 'theme_preference';
    const DARK_MODE_CLASS = 'dark-mode';
    const TOGGLE_ID = 'checkbox';

    // Get current theme from storage or system preference
    function getPreferredTheme() {
        const storedTheme = localStorage.getItem(STORAGE_KEY);
        if (storedTheme) {
            return storedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Apply theme to document
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add(DARK_MODE_CLASS);
        } else {
            document.body.classList.remove(DARK_MODE_CLASS);
        }

        // Update toggle state if it exists
        const toggle = document.getElementById(TOGGLE_ID);
        if (toggle) {
            toggle.checked = theme === 'dark';
        }
    }

    // Initialize
    function initTheme() {
        const theme = getPreferredTheme();
        applyTheme(theme);

        // Setup event listener for toggle
        const toggle = document.getElementById(TOGGLE_ID);
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                const newTheme = e.target.checked ? 'dark' : 'light';
                localStorage.setItem(STORAGE_KEY, newTheme);
                applyTheme(newTheme);
            });
        }
    }

    // Run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }
})();
