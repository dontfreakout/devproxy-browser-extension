// Configuration
const DEFAULT_VHOSTS_URL = 'https://localhost/vhosts.json';
const REFRESH_INTERVAL = 5000; // 5 seconds
const LOCALSTORAGE_THEME_KEY = 'devproxy-theme';
const LOCALSTORAGE_COLLAPSED_GROUPS_KEY = 'devproxy-collapsed-groups';
const LOCALSTORAGE_VHOSTS_URL_KEY = 'devproxy-vhosts-url';
const COLLAPSE_THRESHOLD = 8; // Collapse groups if total vhosts exceed this number

// DOM Elements
const loadingState = document.getElementById('loading-state');
const noHostsState = document.getElementById('no-hosts-state');
const hostsContainer = document.getElementById('hosts-container');
const statusText = document.getElementById('status-text');
const refreshControl = document.getElementById('refresh-control');
const refreshIcon = document.getElementById('refresh-icon');
const themeToggle = document.getElementById('theme-toggle');
const themeOptions = document.querySelectorAll('[role="radio"]');
const helpButton = document.getElementById('help-button');
const noHostsHelpButton = document.getElementById('no-hosts-help-button');
const settingsButton = document.getElementById('settings-button');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsModalButton = document.querySelector('.close-settings-modal');
const settingsForm = document.getElementById('settings-form');
const vhostsUrlInput = document.getElementById('vhosts-url');
const saveSettingsButton = document.getElementById('save-settings');
const resetSettingsButton = document.getElementById('reset-settings');

// App state
let lastData = null;
let lastHostsList = []; // Track previous hosts for change detection
let autoRefreshEnabled = true;
let refreshIntervalId = null;
let currentTheme = 'system'; // Default to system theme
let totalVhosts = 0; // Track total number of vhosts
let currentVhostsUrl = DEFAULT_VHOSTS_URL; // Current URL for vhosts.json

// Get service icon class based on domain prefix
function getServiceIconClass(hostname) {
    // Extract the first part of the domain (before the first dot)
    const prefix = hostname.split('.')[0].toLowerCase();

    // Return the appropriate icon class based on the prefix
    switch (prefix) {
        case 'api': return 'icon-api';
        case 'fe': return 'icon-fe';
        case 'cdn': return 'icon-cdn';
        case 'docs': return 'icon-docs';
        case 'admin':
        case 'is':
            return 'icon-admin';
        case 'mailpit':
        case 'mailhog':
        case 'mailtrap':
        case 'smtp':
        case 'mail':
            return 'icon-mailpit';
        case 'npm':
        case 'node':
            return 'icon-npm';
        case 'rabbitmq':
        case 'rabbit':
        case 'rmq':
            return 'icon-rabbitmq';
        case 'kadeck':
        case 'kafka':
            return 'icon-kafka';
        default: return 'icon-default';
    }
}

// Get collapsed groups from localStorage
function getCollapsedGroups() {
    const saved = localStorage.getItem(LOCALSTORAGE_COLLAPSED_GROUPS_KEY);
    return saved ? JSON.parse(saved) : [];
}

// Extract base domain from hostname
function getBaseDomain(hostname) {
    const parts = hostname.split('.');
    if (parts.length <= 2) return hostname;
    // Get the last two parts (TLD and domain)
    return parts.slice(-2).join('.');
}

// Group hosts by base domain
function groupHostsByDomain(hosts) {
    const groups = {};

    hosts.forEach(host => {
        const url = new URL(host.url);
        const hostname = url.hostname;
        const baseDomain = getBaseDomain(hostname);

        if (!groups[baseDomain]) {
            groups[baseDomain] = [];
        }

        groups[baseDomain].push({
            name: hostname,
            url: host.url
        });
    });

    return groups;
}

// Toggle collapsible section
function toggleSection(section) {
    const domain = section.getAttribute('data-domain');
    section.classList.toggle('collapsed');

    // Update localStorage
    if (domain) {
        const collapsedGroups = getCollapsedGroups();
        const expandedMarker = `expanded:${domain}`;

        if (section.classList.contains('collapsed')) {
            // Add to collapsed groups
            if (!collapsedGroups.includes(domain)) {
                collapsedGroups.push(domain);
            }

            // Remove from expanded markers if exists
            const expandedIndex = collapsedGroups.indexOf(expandedMarker);
            if (expandedIndex !== -1) {
                collapsedGroups.splice(expandedIndex, 1);
            }
        } else {
            // Remove from collapsed groups
            const index = collapsedGroups.indexOf(domain);
            if (index !== -1) {
                collapsedGroups.splice(index, 1);
            }

            // If we're above threshold, add expanded marker
            if (totalVhosts > COLLAPSE_THRESHOLD && !collapsedGroups.includes(expandedMarker)) {
                collapsedGroups.push(expandedMarker);
            }
        }

        // Save updated state
        localStorage.setItem(LOCALSTORAGE_COLLAPSED_GROUPS_KEY, JSON.stringify(collapsedGroups));
    }
}

// Toggle auto-refresh
function toggleAutoRefresh() {
    autoRefreshEnabled = !autoRefreshEnabled;

    if (autoRefreshEnabled) {
        statusText.textContent = 'Auto-refreshing';
        refreshControl.classList.remove('paused');
        refreshControl.classList.add('active');
        refreshIcon.className = 'icon-sync';
        startAutoRefresh();
    } else {
        statusText.textContent = 'Refresh paused';
        refreshControl.classList.remove('active');
        refreshControl.classList.add('paused');
        refreshIcon.className = 'icon-pause';
        stopAutoRefresh();
    }
}

// Set theme (light, dark, or system)
function setTheme(theme) {
    const html = document.documentElement;

    // Update current theme
    currentTheme = theme;

    // Apply theme
    if (theme === 'system') {
        // Use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        localStorage.removeItem(LOCALSTORAGE_THEME_KEY);
    } else {
        // Use selected theme
        if (theme === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        localStorage.setItem(LOCALSTORAGE_THEME_KEY, theme);
    }

    // Update UI
    updateThemeUI();
}

// Update theme UI based on current theme
function updateThemeUI() {
    // Clear all checked states
    themeOptions.forEach(option => {
        option.removeAttribute('data-checked');
        option.setAttribute('aria-checked', 'false');
        option.setAttribute('tabindex', '-1');
    });

    // Set active state for current theme
    const activeOption = document.getElementById(`theme-${currentTheme}`);
    if (activeOption) {
        activeOption.setAttribute('data-checked', '');
        activeOption.setAttribute('aria-checked', 'true');
        activeOption.setAttribute('tabindex', '0');
    }
}

// Set theme based on saved preference or system preference
function initializeTheme() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem(LOCALSTORAGE_THEME_KEY);
    const html = document.documentElement;

    // Disable transitions during initial theme setting
    html.classList.add('notransition');

    if (savedTheme === 'dark') {
        html.classList.add('dark');
        currentTheme = 'dark';
    } else if (savedTheme === 'light') {
        html.classList.remove('dark');
        currentTheme = 'light';
    } else {
        // System preference
        currentTheme = 'system';
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        html.classList.toggle('dark', prefersDark);
    }

    // Force a reflow to apply the changes immediately
    void html.offsetHeight;

    // Re-enable transitions
    html.classList.remove('notransition');

    // Update the theme UI
    updateThemeUI();
}

// Start auto refresh
function startAutoRefresh() {
    if (refreshIntervalId) return;
    refreshIntervalId = setInterval(checkForVhosts, REFRESH_INTERVAL);
}

// Stop auto refresh
function stopAutoRefresh() {
    if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
        refreshIntervalId = null;
    }
}

// Render the hosts list
function renderHostsList(groups) {
    hostsContainer.innerHTML = '';

    // Calculate total vhosts count
    totalVhosts = Object.values(groups).reduce((sum, hosts) => sum + hosts.length, 0);

    // Get saved collapsed state
    const collapsedGroups = getCollapsedGroups();

    // Determine if groups should be collapsed by default (when total vhosts > threshold)
    const collapseByDefault = totalVhosts > COLLAPSE_THRESHOLD;

    Object.keys(groups).sort().forEach(domain => {
        const hosts = groups[domain];

        const section = document.createElement('section');
        section.setAttribute('data-domain', domain);
        section.className = 'host-group';

        // Check if this group should be collapsed
        const isCollapsed = collapsedGroups.includes(domain) ||
                          (collapseByDefault && !collapsedGroups.includes(`expanded:${domain}`));

        if (isCollapsed) {
            section.classList.add('collapsed');
        }

        const heading = document.createElement('div');
        heading.className = 'group-title';
        heading.innerHTML = `
            <span>
                ${domain} <small>(${hosts.length})</small>
            </span>
            <span class="icon-expand"></span>
        `;
        heading.addEventListener('click', () => toggleSection(section));

        const list = document.createElement('ul');
        list.className = 'host-list';

        hosts.forEach(host => {
            const listItem = document.createElement('li');
            listItem.className = 'host-item';

            const link = document.createElement('a');
            link.className = 'host-link';
            link.href = host.url;
            link.target = '_blank';

            // Create service icon based on domain prefix
            const serviceIcon = document.createElement('span');
            const iconClass = getServiceIconClass(host.name);
            serviceIcon.className = `icon-service ${iconClass}`;

            // Create container for icon and text
            const contentContainer = document.createElement('div');
            contentContainer.className = 'host-content';

            const span = document.createElement('span');
            span.className = 'host-name';
            span.textContent = host.name;

            // Add service icon and text to container
            contentContainer.appendChild(serviceIcon);
            contentContainer.appendChild(span);

            const icon = document.createElement('span');
            icon.className = 'icon-arrow';

            link.appendChild(contentContainer);
            link.appendChild(icon);
            listItem.appendChild(link);
            list.appendChild(listItem);
        });

        section.appendChild(heading);
        section.appendChild(list);
        hostsContainer.appendChild(section);
    });

    // Update the UI state
    loadingState.classList.add('hidden');
    hostsContainer.classList.remove('hidden');
}

// Extract hostnames from vhosts data
function extractHostnames(data) {
    return data.map(host => {
        const url = new URL(host.url);
        return url.hostname;
    });
}

// Detect changes between two lists of hosts
function detectHostChanges(oldHosts, newHosts) {
    const added = newHosts.filter(host => !oldHosts.includes(host));
    const removed = oldHosts.filter(host => !newHosts.includes(host));

    return {
        added,
        removed,
        hasChanges: added.length > 0 || removed.length > 0
    };
}

// Notify background script about host changes
function notifyHostChanges(changes) {
    if (!changes.hasChanges) return;

    chrome.runtime.sendMessage({
        action: 'hostsChanged',
        changes: {
            added: changes.added,
            removed: changes.removed
        }
    }, response => {
        if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError);
        } else if (response && response.success) {
            console.log('Notification sent successfully');
        }
    });
}

// Check for vhosts.json and handle the data
async function checkForVhosts() {
    try {
        const response = await fetch(currentVhostsUrl, {
            cache: 'no-store', // Don't cache the response
            headers: {
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch vhosts: ${response.status}`);
        }

        const data = await response.json();
        const currentData = JSON.stringify(data);

        // Check if we have hosts and if data has changed
        if (data && Array.isArray(data) && data.length > 0) {
            if (currentData !== lastData) {
                console.log('Hosts data changed, updating UI');
                const groupedHosts = groupHostsByDomain(data);

                // Before rendering, handle special case for collapse threshold change
                const prevTotalVhosts = totalVhosts;
                const newTotalVhosts = Object.values(groupedHosts).reduce((sum, hosts) => sum + hosts.length, 0);

                // If crossing the threshold, update localStorage with appropriate values
                if ((prevTotalVhosts <= COLLAPSE_THRESHOLD && newTotalVhosts > COLLAPSE_THRESHOLD) ||
                    (prevTotalVhosts > COLLAPSE_THRESHOLD && newTotalVhosts <= COLLAPSE_THRESHOLD)) {
                    // Reset collapsed groups when crossing the threshold
                    localStorage.setItem(LOCALSTORAGE_COLLAPSED_GROUPS_KEY, JSON.stringify([]));
                }

                // Detect host changes for notifications
                const currentHostsList = extractHostnames(data);
                const changes = detectHostChanges(lastHostsList, currentHostsList);

                // Send notification if there are changes
                if (changes.hasChanges) {
                    notifyHostChanges(changes);
                }

                // Update last hosts list for future change detection
                lastHostsList = currentHostsList;

                renderHostsList(groupedHosts);
            }

            noHostsState.classList.add('hidden');
            hostsContainer.classList.remove('hidden');
        } else {
            // If we had hosts before but now have none, notify about removal
            if (lastHostsList.length > 0) {
                const changes = {
                    added: [],
                    removed: lastHostsList,
                    hasChanges: lastHostsList.length > 0
                };
                notifyHostChanges(changes);
                lastHostsList = [];
            }

            loadingState.classList.add('hidden');
            hostsContainer.classList.add('hidden');
            noHostsState.classList.remove('hidden');
        }

        // Update last data for change detection
        lastData = currentData;

        // Update status
        if (autoRefreshEnabled) {
            statusText.textContent = 'Auto-refreshing';
        }

    } catch (error) {
        console.error('Error fetching vhosts:', error);
        loadingState.classList.add('hidden');
        hostsContainer.classList.add('hidden');
        noHostsState.classList.remove('hidden');
        statusText.textContent = autoRefreshEnabled ? 'Refresh failed' : 'Refresh paused';
    }
}

// Open help page
function openHelpPage() {
    window.open('help.html', '_blank');
}

// Show settings modal
function showSettingsModal() {
    // Load current URL into input field
    vhostsUrlInput.value = currentVhostsUrl;
    settingsModal.classList.add('active');
}

// Hide settings modal
function hideSettingsModal() {
    settingsModal.classList.remove('active');
}

// Save settings
function saveSettings(e) {
    if (e) e.preventDefault();

    const newUrl = vhostsUrlInput.value.trim();
    if (!newUrl) {
        // If empty, reset to default
        currentVhostsUrl = DEFAULT_VHOSTS_URL;
        localStorage.removeItem(LOCALSTORAGE_VHOSTS_URL_KEY);
    } else {
        // Save new URL
        currentVhostsUrl = newUrl;
        localStorage.setItem(LOCALSTORAGE_VHOSTS_URL_KEY, newUrl);
    }

    // Refresh data with new URL
    checkForVhosts();

    // Close modal
    hideSettingsModal();
}

// Reset settings to default
function resetSettings() {
    vhostsUrlInput.value = DEFAULT_VHOSTS_URL;
}

// Load saved vhosts URL
function loadSavedVhostsUrl() {
    const savedUrl = localStorage.getItem(LOCALSTORAGE_VHOSTS_URL_KEY);
    if (savedUrl) {
        currentVhostsUrl = savedUrl;
    }
}

// Initialize hosts list without triggering notifications
async function initializeHostsList() {
    try {
        const response = await fetch(currentVhostsUrl, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            console.error(`Failed to initialize hosts list: ${response.status}`);
            return;
        }

        const data = await response.json();

        if (data && Array.isArray(data) && data.length > 0) {
            // Initialize lastHostsList with current hosts
            lastHostsList = extractHostnames(data);
            console.log('Initialized hosts list with', lastHostsList.length, 'hosts');
        }
    } catch (error) {
        console.error('Error initializing hosts list:', error);
    }
}

// Initialize and set up periodic refresh
function init() {
    // Initialize theme based on saved preferences or system preference
    initializeTheme();

    // Load saved vhosts URL
    loadSavedVhostsUrl();

    // Initialize lastHostsList
    initializeHostsList();

    // Add event listeners for theme options
    themeOptions.forEach(option => {
        option.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            setTheme(theme);
        });

        // Make keyboard accessible
        option.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const theme = this.getAttribute('data-theme');
                setTheme(theme);
            }
        });
    });

    // Add event listener for refresh control
    refreshControl.addEventListener('click', toggleAutoRefresh);

    // Help page functionality
    helpButton.addEventListener('click', openHelpPage);
    noHostsHelpButton.addEventListener('click', openHelpPage);

    // Settings modal functionality
    settingsButton.addEventListener('click', showSettingsModal);
    closeSettingsModalButton.addEventListener('click', hideSettingsModal);
    settingsForm.addEventListener('submit', saveSettings);
    resetSettingsButton.addEventListener('click', resetSettings);

    // Close modal when clicking outside of modal content
    settingsModal.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            hideSettingsModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && settingsModal.classList.contains('active')) {
            hideSettingsModal();
        }
    });

    // Listen for OS theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        // Only apply if theme is set to system
        if (currentTheme === 'system') {
            document.documentElement.classList.toggle('dark', event.matches);
        }
    });

    // Initial check
    checkForVhosts();

    // Set up periodic refresh
    startAutoRefresh();
}

// Start when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
