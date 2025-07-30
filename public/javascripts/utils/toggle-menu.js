document.addEventListener('DOMContentLoaded', function () {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if(!menuBtn || !mobileMenu) return
    const icon = menuBtn.querySelector('i');

    menuBtn.addEventListener('click', function () {
        mobileMenu.classList.toggle('hidden');
        // Toggle icon class
        if (mobileMenu.classList.contains('hidden')) {
            if (icon) {
                icon.classList.remove('ri-close-line');
                icon.classList.add('ri-menu-line');
            }
        } else {
            if (icon) {
                icon.classList.remove('ri-menu-line');
                icon.classList.add('ri-close-line');
            }
        }
    });

    // Optional: close menu on link click and reset icon
    mobileMenu.querySelectorAll('a,form').forEach(el => {
        el.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
            if (icon) {
                icon.classList.remove('ri-close-line');
                icon.classList.add('ri-menu-line');
            }
        });
    });
});