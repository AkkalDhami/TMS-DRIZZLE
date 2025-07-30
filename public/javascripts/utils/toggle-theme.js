function toggleTheme() {
    const html = document.documentElement;
    const icon = document.getElementById('theme-icon');
    const text = document.getElementById('theme-text');

    // Toggle Tailwind 'dark' class on root HTML tag
    html.classList.toggle('dark');

    if (html.classList.contains('dark')) {
        icon.classList.remove('ri-moon-line');
        icon.classList.add('ri-sun-line');
        if (text) {
            text.textContent = 'Light Mode';
        }
    } else {
        icon.classList.remove('ri-sun-line');
        icon.classList.add('ri-moon-line');
        if (text) {
            text.textContent = 'Dark Mode';
        }
    }

    // Save user preference to localStorage
    localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
}

// Auto-load saved theme on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    const html = document.documentElement;
    const icon = document.getElementById('theme-icon');
    const text = document.getElementById('theme-text');

    if (savedTheme === 'dark') {
        html.classList.add('dark');
        icon.classList.remove('ri-moon-line');
        icon.classList.add('ri-sun-line');
        if (text) {
            text.textContent = 'Light Mode';
        }
    } else {
        html.classList.remove('dark');
        icon.classList.remove('ri-sun-line');
        icon.classList.add('ri-moon-line');
        if (text) {
            text.textContent = 'Dark Mode';
        }
    }

});