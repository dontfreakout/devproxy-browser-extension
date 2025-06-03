// Initialize theme based on saved preference or system preference
function initializeTheme() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('devproxy-theme');
    const html = document.documentElement;

    if (savedTheme === 'dark') {
        html.classList.add('dark');
    } else if (savedTheme === 'light') {
        html.classList.remove('dark');
    } else {
        // System preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        html.classList.toggle('dark', prefersDark);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTheme);

// Close button functionality
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('closeButton').addEventListener('click', () => {
        window.close();
    });
});
