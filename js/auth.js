// Authentication logic
import { auth, db } from './firebase-config.js';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

// DOM elements
const loadingScreen = document.getElementById('loading-screen');
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const userNameSpan = document.getElementById('user-name');
const userRoleSpan = document.getElementById('user-role');
const forgotPasswordLink = document.getElementById('forgot-password');

// Current user state
let currentUser = null;
let userRole = null;

// Initialize authentication
export function initAuth() {
    // Listen for authentication state changes
    onAuthStateChanged(auth, async (user) => {
        hideLoading();

        if (user) {
            await handleUserLoggedIn(user);
        } else {
            handleUserLoggedOut();
        }
    });

    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', handleLogin);

    // Logout button
    logoutBtn.addEventListener('click', handleLogout);

    // Forgot password
    forgotPasswordLink.addEventListener('click', handleForgotPassword);
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showLoginError('Please enter both email and password');
        return;
    }

    setLoginLoading(true);
    hideLoginError();

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle the rest
    } catch (error) {
        console.error('Login error:', error);
        setLoginLoading(false);

        let errorMessage = 'Login failed. Please try again.';

        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                errorMessage = 'Invalid email or password';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your connection.';
                break;
        }

        showLoginError(errorMessage);
    }
}

// Handle user logged in
async function handleUserLoggedIn(user) {
    try {
        currentUser = user;

        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
            // User document doesn't exist - this shouldn't happen in normal flow
            console.error('User document not found');
            showLoginError('User account not properly configured. Please contact administrator.');
            await signOut(auth);
            return;
        }

        const userData = userDoc.data();

        // Check if user is active
        if (!userData.isActive) {
            showLoginError('Your account has been deactivated. Please contact administrator.');
            await signOut(auth);
            return;
        }

        userRole = userData.role;

        // Update last login time
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                lastLogin: serverTimestamp()
            });
        } catch (error) {
            console.warn('Could not update last login time:', error);
        }

        // Update UI
        updateUserDisplay(userData);
        setRoleBasedUI(userRole);

        // Show app, hide login
        hideLogin();
        showApp();

        // Initialize app (this will be imported from app.js)
        if (window.initializeApp) {
            window.initializeApp();
        }

    } catch (error) {
        console.error('Error handling user login:', error);
        showLoginError('Error loading user data. Please try again.');
        await signOut(auth);
    }
}

// Handle user logged out
function handleUserLoggedOut() {
    currentUser = null;
    userRole = null;

    // Reset UI
    clearUserDisplay();
    clearRoleBasedUI();

    // Show login, hide app
    hideApp();
    showLogin();
}

// Handle logout
async function handleLogout() {
    try {
        await signOut(auth);
        // onAuthStateChanged will handle the rest
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
    }
}

// Handle forgot password
async function handleForgotPassword(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();

    if (!email) {
        showLoginError('Please enter your email address first');
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        alert('Password reset email sent! Check your inbox.');
    } catch (error) {
        console.error('Password reset error:', error);

        let errorMessage = 'Error sending password reset email';

        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email address';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address';
                break;
        }

        showLoginError(errorMessage);
    }
}

// Update user display
function updateUserDisplay(userData) {
    userNameSpan.textContent = userData.displayName || userData.email;
    userRoleSpan.textContent = userData.role;
    userRoleSpan.className = `role-badge ${userData.role}`;
}

// Clear user display
function clearUserDisplay() {
    userNameSpan.textContent = '';
    userRoleSpan.textContent = '';
    userRoleSpan.className = 'role-badge';
}

// Set role-based UI
function setRoleBasedUI(role) {
    // Remove all role classes
    document.body.classList.remove('role-admin', 'role-manager', 'role-entry-only');

    // Add current role class
    document.body.classList.add(`role-${role}`);
}

// Clear role-based UI
function clearRoleBasedUI() {
    document.body.classList.remove('role-admin', 'role-manager', 'role-entry-only');
}

// Show/hide functions
function showLogin() {
    loginContainer.classList.remove('hidden');
}

function hideLogin() {
    loginContainer.classList.add('hidden');
}

function showApp() {
    appContainer.classList.remove('hidden');
}

function hideApp() {
    appContainer.classList.add('hidden');
}

function hideLoading() {
    loadingScreen.classList.add('hidden');
}

function setLoginLoading(loading) {
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoading = loginBtn.querySelector('.btn-loading');

    if (loading) {
        loginBtn.disabled = true;
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');
    } else {
        loginBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
    }
}

function showLoginError(message) {
    loginError.textContent = message;
    loginError.classList.remove('hidden');
}

function hideLoginError() {
    loginError.classList.add('hidden');
}

// Export functions for use in other modules
export { currentUser, userRole };

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}