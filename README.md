# DevProxy Browser Extension

A Chrome extension for listing and accessing local sites served by [DevProxy](https://github.com/dontfreakout/dev-proxy).

## Features

- 🔄 Auto-refreshing list of virtual hosts
- 🌙 Light/dark/system theme support
- 📊 Grouped hosts by domain
- 📱 Compact, responsive interface
- ℹ️ Configuration help

## Installation

### Development Mode

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/devproxy-browser-extension.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" by toggling the switch in the top right corner

4. Click "Load unpacked" and select the directory containing this extension

5. The extension should now be installed and visible in your Chrome toolbar

### Using the Extension

1. Click the DevProxy icon in your Chrome toolbar to open the extension popup

2. The extension will automatically fetch and display virtual hosts from your local DevProxy instance

3. Click on any host to open it in a new tab

4. Use the theme toggle to switch between light, dark, or system theme

5. Click the auto-refresh indicator to pause/resume automatic updates

6. Click the settings icon (⚙) to configure the URL for the vhosts.json file

7. Click the help button for configuration instructions

## Configuration

The extension expects DevProxy to serve a `vhosts.json` file at `https://localhost:8443/vhosts.json` by default. You can configure a different URL for the `vhosts.json` file using the settings option:

1. Click the settings icon (⚙) in the extension popup
2. Enter your custom URL in the settings form
3. Click "Save" to apply the changes

Your custom URL will be saved and used for future requests. You can reset to the default URL at any time by clicking "Reset to Default" in the settings.

## Development

### Project Structure

```
devproxy-browser-extension/
├── manifest.json          # Extension configuration
├── popup.html             # Popup interface
├── popup.js               # Popup logic
├── styles/
│   └── popup.css          # Styling
└── icons/
    ├── icon16.png         # 16x16 icon
    ├── icon48.png         # 48x48 icon
    └── icon128.png        # 128x128 icon
```

### Building for Production

To package the extension for production:

1. Make sure all files are in place, including the icon files
2. Zip the contents of the directory (not the directory itself)
3. The resulting ZIP file can be uploaded to the Chrome Web Store

## License

See the [LICENSE](LICENSE) file for details.
