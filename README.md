<div align="center">

# Stream Overlay - Broadcast Graphics and Alert Widget Kit

### *Real-Time HTML5/JS Live Streaming Overlay Widgets for OBS and Streamlabs*

![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-Server-777BB4?style=for-the-badge&logo=php&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

</div>

## Overview

Stream Overlay is a lightweight, customizable web overlay suite engineered for Twitch, YouTube, and Facebook Gaming live streamers. Designed to be added directly as an OBS Studio or Streamlabs Browser Source, it provides smooth animated alerts, mascot graphics, chat popups, and layout configurations.

---

## Key Features

### 1. OBS Browser Source Ready
- Ultra-low CPU and RAM consumption for smooth 60 FPS streaming performance.
- Transparent background layout (index.html) auto-fitting 1080p and 4K canvas resolutions.

### 2. Remote Control Panel (control.html)
- Trigger test alerts (New Follower, Subscriber, Tip/Donation, Raid).
- Adjust layout coordinates, mascot animations, and custom text messages dynamically.

### 3. JSON Configuration and Custom Styling
- Easily tweak colors, fonts, and mascot graphics via layout.json and style.css.
- Extensible JavaScript engine (script.js) supporting WebSocket event listeners.

---

## Repository Contents

- index.html: Main transparent overlay canvas for OBS.
- control.html: Interactive admin panel to trigger and test overlay events.
- script.js: Core animation logic and alert queue handler.
- style.css: Modern glassmorphism and neon broadcast CSS styling.
- layout.json and layout.php: Position and layout configuration storage.
- mascot.png: Custom streamer avatar / mascot asset.

---

## Quick OBS Integration

1. Open OBS Studio or Streamlabs OBS.
2. Add a new Browser Source.
3. Set URL to local path: file:///C:/laragon/www/stream-overlay/index.html (or http://localhost/stream-overlay/index.html).
4. Set Width: 1920, Height: 1080.
5. Open control.html in your browser to trigger test alerts!

---

## License and Author

Distributed under the MIT License.

Author: Pangeran Ryan Pahlevi (https://github.com/raphlv)  
Email: pangeranryan080504@gmail.com  

---
<div align="center">
  <sub>Automated Sync Enabled for Contribution Tracking | Last Updated: 2026-08-18 14:40:47</sub>
</div>