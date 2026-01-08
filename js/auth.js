/**
 * Authentication Logic
 * Handles user sessions, login, register, and logout.
 */

const Auth = {
    // Check if user is logged in and handle redirects
    check: function () {
        if (typeof StorageUtil === 'undefined') return;

        const user = StorageUtil.get('currentUser');
        const path = window.location.pathname;
        const href = window.location.href;

        // Define public pages
        const isPublicPage = href.includes('login.html') ||
            href.includes('register.html') ||
            href.endsWith('index.html') ||
            (path === '/' && !href.includes('pages'));

        if (!user && !isPublicPage) {
            // Not logged in, trying to access private page -> Redirect to login
            window.location.href = '../pages/login.html';
        } else if (user && isPublicPage) {
            // Logged in, trying to access public page -> Redirect to dashboard
            // Check if we are in root or pages dir to set correct relative path
            const prefix = href.includes('pages') ? '' : 'pages/';
            window.location.href = prefix + 'dashboard.html';
        }
    },

    // Login function
    login: async function (email, password) {
        try {
            // Firebase Login (if available)
            if (typeof auth !== 'undefined' && firebase.apps.length) {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Store minimal user info
                const userData = {
                    id: user.uid,
                    name: user.displayName || email.split('@')[0],
                    email: user.email,
                    photo: user.photoURL
                };
                StorageUtil.set('currentUser', userData);
                return { success: true };
            }
        } catch (error) {
            console.warn('Firebase login failed', error);
            // Don't return here, try local fallback if desired or throw error
            // For this app, if Firebase fails (e.g. invalid credentials), we should probably fail.
            // But if Firebase is not configured (error.code === 'auth/no-app'), we fallback.
            if (error.code && error.code !== 'auth/no-app') {
                return { success: false, message: error.message };
            }
        }

        // Local Storage Fallback (Demo Mode)
        const users = StorageUtil.get('users') || [];
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            const userData = {
                id: user.id,
                name: user.name,
                email: user.email
            };
            StorageUtil.set('currentUser', userData);
            return { success: true };
        } else {
            return { success: false, message: 'Invalid email or password' };
        }
    },

    // Register function
    register: async function (name, email, password) {
        try {
            // Firebase Register
            if (typeof auth !== 'undefined' && firebase.apps.length) {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Update profile name
                await user.updateProfile({
                    displayName: name
                });

                const userData = {
                    id: user.uid,
                    name: name,
                    email: user.email
                };
                StorageUtil.set('currentUser', userData);
                return { success: true };
            }
        } catch (error) {
            console.warn('Firebase register failed', error);
            if (error.code && error.code !== 'auth/no-app') {
                return { success: false, message: error.message };
            }
        }

        // Local Storage Fallback
        const users = StorageUtil.get('users') || [];

        if (users.find(u => u.email === email)) {
            return { success: false, message: 'Email already registered' };
        }

        const newUser = {
            id: 'user_' + Date.now(),
            name: name,
            email: email,
            password: password // In a real app, never store passwords locally!
        };

        users.push(newUser);
        StorageUtil.set('users', users);
        StorageUtil.set('currentUser', {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
        });

        return { success: true };
    },

    // Logout function
    logout: function () {
        if (typeof auth !== 'undefined' && firebase.apps.length) {
            auth.signOut();
        }
        StorageUtil.remove('currentUser');
        window.location.href = '../pages/login.html';
    }
};

// Run check on load
Auth.check();
