// Authentication Logic
const AUTH_KEY = 'studioFocusAdminLoggedIn';
const CREDENTIALS = {
    username: 'admin',
    password: 'focus2024'
};

function checkAuth() {
    const isLoggedIn = localStorage.getItem(AUTH_KEY);
    const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/admin/');
    
    if (!isLoggedIn && !isLoginPage) {
        window.location.href = 'index.html';
    } else if (isLoggedIn && isLoginPage) {
        window.location.href = 'dashboard.html';
    }
}

function login(username, password) {
    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
        localStorage.setItem(AUTH_KEY, 'true');
        window.location.href = 'dashboard.html';
        return true;
    }
    return false;
}

function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = 'index.html';
}

// Navigation Logic for Dashboard
function setupNavigation() {
    const navButtons = document.querySelectorAll('[data-section]');
    const sections = document.querySelectorAll('.dashboard-section');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.getAttribute('data-section');
            
            // Update active button
            navButtons.forEach(b => b.classList.remove('active', 'bg-pu', 'text-white'));
            btn.classList.add('active', 'bg-pu', 'text-white');

            // Show selected section
            sections.forEach(s => s.classList.add('hidden'));
            const activeSection = document.getElementById(sectionId);
            if (activeSection) {
                activeSection.classList.remove('hidden');
            }

            // Close mobile menu if open
            const sidebar = document.getElementById('sidebar');
            if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
                toggleSidebar();
            }
        });
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) {
        sidebar.classList.toggle('-translate-x-full');
    }
    if (overlay) {
        overlay.classList.toggle('hidden');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    if (document.getElementById('dashboard-content')) {
        setupNavigation();
    }
});
