// DevProxy Background Script
// Handles notifications for host changes

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('DevProxy extension installed');
});

// Function to create a notification
function createNotification(title, message, contextMessage = null, iconUrl = null) {
  const options = {
    type: 'basic',
    title: title,
    message: message,
    iconUrl: iconUrl || 'icons/icon128.png'
  };

  if (contextMessage) {
    options.contextMessage = contextMessage;
  }

  // Create notification with a unique ID based on timestamp
  const notificationId = 'devproxy-notification-' + Date.now();
  chrome.notifications.create(notificationId, options);

  return notificationId;
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'hostsChanged') {
    const { added, removed } = message.changes;

    // Notification for added hosts
    if (added && added.length > 0) {
      const title = added.length === 1
        ? 'New Host Available'
        : `${added.length} New Hosts Available`;

      const message = added.length === 1
        ? `${added[0]} is now available`
        : `New hosts: ${added.slice(0, 3).join(', ')}${added.length > 3 ? '...' : ''}`;

      createNotification(title, message, 'DevProxy Virtual Hosts');
    }

    // Notification for removed hosts
    if (removed && removed.length > 0) {
      const title = removed.length === 1
        ? 'Host Removed'
        : `${removed.length} Hosts Removed`;

      const message = removed.length === 1
        ? `${removed[0]} is no longer available`
        : `Removed hosts: ${removed.slice(0, 3).join(', ')}${removed.length > 3 ? '...' : ''}`;

      createNotification(title, message, 'DevProxy Virtual Hosts');
    }

    // Send response back to popup
    sendResponse({ success: true });
    return true; // Keep the message channel open for async response
  }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  // Open the extension popup when notification is clicked
  if (notificationId.startsWith('devproxy-notification-')) {
    chrome.action.openPopup();
  }
});
