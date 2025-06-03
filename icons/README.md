# DevProxy Extension Icons

This directory should contain the following icon files:

- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels
- `icon128.png` - 128x128 pixels

## Icon Design

The icons should be based on the new DevProxy reverse proxy icon, which shows the flow of data through a proxy server:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <!-- Main circle (proxy) -->
  <circle cx="24" cy="24" r="10" fill="#3b82f6" />

  <!-- Left side (clients) -->
  <circle cx="8" cy="16" r="4" fill="#3b82f6" opacity="0.7" />
  <circle cx="8" cy="32" r="4" fill="#3b82f6" opacity="0.7" />

  <!-- Right side (servers) -->
  <circle cx="40" cy="16" r="4" fill="#3b82f6" opacity="0.7" />
  <circle cx="40" cy="32" r="4" fill="#3b82f6" opacity="0.7" />

  <!-- Connection lines -->
  <!-- Client to proxy connections -->
  <path d="M11 18L20 22" stroke="#3b82f6" stroke-width="2" />
  <path d="M11 30L20 26" stroke="#3b82f6" stroke-width="2" />

  <!-- Proxy to server connections -->
  <path d="M28 22L37 18" stroke="#3b82f6" stroke-width="2" />
  <path d="M28 26L37 30" stroke="#3b82f6" stroke-width="2" />

  <!-- Arrows on connection lines -->
  <!-- Client to proxy arrows -->
  <path d="M19 20L20 22L17 21" fill="#3b82f6" />
  <path d="M19 28L20 26L17 27" fill="#3b82f6" />

  <!-- Proxy to server arrows -->
  <path d="M29 20L28 22L31 21" fill="#3b82f6" />
  <path d="M29 28L28 26L31 27" fill="#3b82f6" />
</svg>
```

This design represents:
- A central circle as the proxy server
- Smaller circles on the left representing clients
- Smaller circles on the right representing backend servers
- Connection lines with arrows showing the flow of requests and responses

## Design Guidelines

1. Use a blue color (#3b82f6) for the main icon
2. Ensure the icon is recognizable at small sizes
3. Use transparent backgrounds
4. Keep the design simple and clean
5. Make sure the icon looks good in both light and dark themes

## Creating the Icons

### Method 1: Using the Conversion Tool

1. Open the `convert-to-png.html` file in a web browser
2. Follow the instructions on the page to save each icon at the required sizes
3. Place the resulting PNG files in this directory

### Method 2: Using Image Editing Software

You can create these icons using any image editing software like:
- Adobe Photoshop
- GIMP
- Figma
- Sketch

Export them as PNG files with the appropriate dimensions and place them in this directory.

### Method 3: Using Command Line Tools

If you prefer command-line tools, you can convert the SVG to PNG using:

```bash
# Using Inkscape
inkscape -w 16 -h 16 proxy-icon.svg -o icon16.png
inkscape -w 48 -h 48 proxy-icon.svg -o icon48.png
inkscape -w 128 -h 128 proxy-icon.svg -o icon128.png

# Using ImageMagick
convert -background none -resize 16x16 proxy-icon.svg icon16.png
convert -background none -resize 48x48 proxy-icon.svg icon48.png
convert -background none -resize 128x128 proxy-icon.svg icon128.png

# Using rsvg-convert
rsvg-convert -w 16 -h 16 proxy-icon.svg > icon16.png
rsvg-convert -w 48 -h 48 proxy-icon.svg > icon48.png
rsvg-convert -w 128 -h 128 proxy-icon.svg > icon128.png
```
