# Chrome Extension Development Guidelines

## Overview

This guide provides comprehensive guidelines for developing Google Chrome extensions using Manifest V3, the current standard for Chrome extensions.

## Getting Started

### Prerequisites

- Basic knowledge of HTML, CSS, and JavaScript
- Chrome browser for testing
- Text editor or IDE
- Understanding of web APIs and browser security concepts

### Project Structure

```
my-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Popup interface (optional)
├── popup.js              # Popup logic (optional)
├── background.js         # Background script
├── content.js            # Content script (optional)
├── options.html          # Options page (optional)
├── options.js            # Options logic (optional)
├── styles/
│   └── popup.css         # Styling
└── icons/
    ├── icon16.png        # 16x16 icon
    ├── icon48.png        # 48x48 icon
    └── icon128.png       # 128x128 icon
```

## Manifest V3 Configuration

### Basic manifest.json Structure

```json
{
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0",
  "description": "A brief description of what your extension does",
  "permissions": [
    "storage",
    "activeTab"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "My Extension",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### Essential Permissions

**Commonly Used Permissions:**
- `storage` - Access to chrome.storage API
- `activeTab` - Access to the currently active tab
- `tabs` - Access to tab information
- `scripting` - Inject scripts into web pages
- `cookies` - Access to cookie data
- `alarms` - Schedule code to run periodically

**Host Permissions:**
```json
"host_permissions": [
  "https://example.com/*",
  "https://*.google.com/*"
]
```

## Core Components

### Background Scripts (Service Workers)

Background scripts handle events and maintain extension state. In Manifest V3, they run as service workers.

```javascript
// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.action.onClicked.addListener((tab) => {
  // Handle extension icon click
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: performAction
  });
});

function performAction() {
  // Code to inject into the page
  console.log('Action performed on page');
}
```

### Content Scripts

Content scripts run in the context of web pages and can interact with the DOM.

```javascript
// content.js
console.log('Content script loaded');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'doSomething') {
    // Perform action on the page
    sendResponse({ result: 'success' });
  }
});

// Example: Modify page content
document.body.style.backgroundColor = '#f0f0f0';
```

### Popup Interface

Create an interactive popup when users click the extension icon.

```html
<!-- popup.html -->
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="styles/popup.css">
</head>
<body>
  <div class="container">
    <h1>My Extension</h1>
    <button id="actionBtn">Perform Action</button>
    <div id="status"></div>
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

```javascript
// popup.js
document.addEventListener('DOMContentLoaded', () => {
  const actionBtn = document.getElementById('actionBtn');
  const status = document.getElementById('status');

  actionBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        // Code to run on the page
        return document.title;
      }
    }, (results) => {
      status.textContent = `Page title: ${results[0].result}`;
    });
  });
});
```

## Best Practices

### Security Guidelines

**Content Security Policy (CSP):**
- Avoid inline JavaScript and CSS
- Use external files for scripts and styles
- Sanitize user input
- Use HTTPS for external resources

**Permissions:**
- Request minimal permissions necessary
- Use `activeTab` instead of broad `tabs` permission when possible
- Explain permission requirements to users

### Performance Optimization

**Background Scripts:**
- Keep service workers lightweight
- Use event-driven architecture
- Avoid long-running operations
- Store data efficiently using chrome.storage

**Content Scripts:**
- Inject scripts only when necessary
- Use `run_at` property to control injection timing
- Minimize DOM manipulation
- Remove event listeners when not needed

### User Experience

**Design Principles:**
- Keep interfaces simple and intuitive
- Provide clear feedback for user actions
- Use consistent styling with Chrome's design language
- Ensure accessibility compliance

**Error Handling:**
```javascript
try {
  await chrome.storage.local.set({ key: value });
} catch (error) {
  console.error('Storage error:', error);
  // Show user-friendly error message
}
```

## Common Patterns

### Message Passing

**Background to Content Script:**
```javascript
// background.js
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, {
    action: 'updateContent',
    data: 'Hello from background'
  });
});

// content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateContent') {
    document.body.innerHTML += `<p>${message.data}</p>`;
    sendResponse({ success: true });
  }
});
```

### Storage Management

```javascript
// Save data
await chrome.storage.local.set({ settings: { theme: 'dark', notifications: true } });

// Retrieve data
const result = await chrome.storage.local.get(['settings']);
const settings = result.settings || {};

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (const key in changes) {
    console.log(`${key} changed from ${changes[key].oldValue} to ${changes[key].newValue}`);
  }
});
```

### Context Menus

```javascript
// background.js
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'myContextMenu',
    title: 'Process with My Extension',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'myContextMenu') {
    // Process selected text
    console.log('Selected text:', info.selectionText);
  }
});
```

## Testing and Debugging

### Local Development

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select your extension directory
4. Test functionality and check console for errors

### Debugging Tools

**Background Script Debugging:**
- Use Chrome DevTools for service workers
- Access via `chrome://extensions/` → Extension details → "Inspect views: service worker"

**Content Script Debugging:**
- Use page DevTools console
- Content script logs appear in page console

**Common Debug Commands:**
```javascript
// Check if extension context is valid
if (chrome.runtime?.id) {
  // Extension context is valid
}

// Log extension errors
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    // Your code here
  } catch (error) {
    console.error('Extension error:', error);
  }
});
```

## Publishing Guidelines

### Chrome Web Store Requirements

**Preparation Checklist:**
- Create high-quality icons (16x16, 48x48, 128x128)
- Write clear description and feature list
- Add screenshots and promotional images
- Test on different Chrome versions
- Ensure compliance with store policies

**Privacy and Data Usage:**
- Declare data collection practices
- Implement privacy-focused features
- Provide clear privacy policy if handling user data

### Version Management

```json
{
  "version": "1.2.3",
  "version_name": "1.2.3 Beta"
}
```

Follow semantic versioning (MAJOR.MINOR.PATCH) for consistency.

## Resources

- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/migrating/)
- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
- [Extension Samples Repository](https://github.com/GoogleChrome/chrome-extensions-samples)
