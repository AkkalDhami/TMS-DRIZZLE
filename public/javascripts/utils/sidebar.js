const sidebar = document.getElementById('sideNav');
const overlay = document.getElementById('overlay');
const menuBtn = document.getElementById('menu-btn');
const mainContent = document.getElementById('main-content');
const sidebarLabels = document.querySelectorAll('.sidebar-label');
const header = document.querySelector('header');
let isCollapsed = false;

// Mobile Sidebar
menuBtn.addEventListener('click', () => {
    sidebar.classList.remove('-translate-x-full');
    overlay.classList.remove('hidden');
});


overlay.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
});

