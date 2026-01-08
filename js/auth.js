/**
 * Authentication Logic
 */
// Simple Auth using localStorage for demo/simplicity based on previous files
// Also hooking into Firebase Auth if configured

function checkAuth() {
    const user = StorageUtil.get('currentUser');
    const isLoginPage = window.location.href.includes('login.html') || window.location.href.includes('register.html') || window.location.pathname === '/' || window.location.href.endsWith('index.html');

    if (!user && !isLoginPage) {
        // Redirect to login
        window.location.href = '../pages/login.html';
    } else if (user && isLoginPage) {
        // Redirect to dashboard
        window.location.href = '../pages/dashboard.html';
    }
}

// Run check
checkAuth();
