// Initialize BroadcastChannel for real-time synchronization
const channel = new BroadcastChannel('stream_overlay_channel');

// Detect running page (Overlay Canvas vs Control Panel)
const isOverlayPage = document.querySelector('.overlay-canvas') !== null;

// Base dimensions of widgets on a native 1920x1080 canvas
const baseDimensions = {
    webcam: { w: 420, h: 260 },
    chatbox: { w: 380, h: 360 },
    stats: { w: 630, h: 55 },
    social: { w: 260, h: 48 }
};

// Global Configuration State
let config = {
    theme: {
        primaryColor: '#ff7bb0',
        secondaryColor: '#9d8df2'
    },
    labels: {
        webcamText: 'STREAMING LIVE',
        subText: 'Rafi_Gamer',
        donationText: 'Budi_Luhur (Rp 100K)',
        goalText: '742 / 1000',
        ytHandle: 'RyanPahlevi TV',
        igHandle: '@ryan_pahlevi'
    },
    layout: {
        webcam: { x: 50, y: 50, scale: 100 },
        chatbox: { x: 50, y: 670, scale: 100 },
        stats: { x: 1240, y: 50, scale: 100 },
        social: { x: 1610, y: 982, scale: 100 }
    },
    latestAlert: null,
    chats: []
};

// Start logic based on page
if (isOverlayPage) {
    initOverlay();
} else {
    initControlPanel();
}

/* ==========================================================================
   COMMON UTILITIES & SERVER API SYNC
   ========================================================================== */
async function loadConfigFromServer() {
    try {
        const res = await fetch('layout.php');
        if (res.ok) {
            config = await res.json();
            return true;
        }
    } catch (e) {
        console.warn("Could not connect to layout.php, using defaults:", e);
    }
    return false;
}

async function saveConfigToServer() {
    try {
        await fetch('layout.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
    } catch (e) {
        console.error("Gagal menyimpan konfigurasi ke server:", e);
    }
}

/* ==========================================================================
   OVERLAY PAGE LOGIC (index.html)
   ========================================================================== */
async function initOverlay() {
    console.log('OBS Overlay Initialized...');

    // Auto-scale overlay canvas to fit window viewport
    function autoScaleOverlay() {
        const canvas = document.querySelector('.overlay-canvas');
        if (!canvas) return;
        const scaleX = window.innerWidth / 1920;
        const scaleY = window.innerHeight / 1080;
        const scale = Math.min(scaleX, scaleY);
        canvas.style.transform = `scale(${scale})`;
        canvas.style.transformOrigin = 'top left';
        const leftOffset = (window.innerWidth - 1920 * scale) / 2;
        const topOffset = (window.innerHeight - 1080 * scale) / 2;
        canvas.style.position = 'absolute';
        canvas.style.left = `${leftOffset}px`;
        canvas.style.top = `${topOffset}px`;
    }
    autoScaleOverlay();
    window.addEventListener('resize', autoScaleOverlay);

    // Load initial state from server
    await loadConfigFromServer();
    applyAllConfigToOverlay();

    // 1. Social Rotator Loop
    let currentSlide = 0;
    const slides = document.querySelectorAll('.social-slide');
    function rotateSocials() {
        if (slides.length === 0) return;
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }
    setInterval(rotateSocials, 5000);

    // 2. Add Chat Bubble Logic
    const chatContainer = document.getElementById('chatMessages');
    const maxMessages = 5;
    let colorIndex = 1;
    const processedChatIds = new Set();

    function addChatMessage(username, message, id = null) {
        if (!chatContainer) return;
        
        // Prevent duplicate messages in real-time cross-tab/polling environment
        if (id && processedChatIds.has(id)) return;
        if (id) processedChatIds.add(id);

        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        const userColorClass = `user-color-${colorIndex}`;
        colorIndex = (colorIndex % 5) + 1;

        chatItem.innerHTML = `
            <span class="chat-username ${userColorClass}">${username}</span>
            <span class="chat-message">${escapeHTML(message)}</span>
        `;
        
        chatContainer.appendChild(chatItem);

        const currentItems = chatContainer.querySelectorAll('.chat-item');
        if (currentItems.length > maxMessages) {
            chatContainer.removeChild(currentItems[0]);
        }
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // 3. Alert Box Banner Animation
    const alertBox = document.getElementById('alertBox');
    const alertIcon = document.getElementById('alertIcon');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');
    let alertTimeout = null;

    function playSubSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
            osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
            osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
            
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.4);
        } catch (e) {
            console.warn("AudioContext could not start:", e);
        }
    }

    function playDonationSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(987.77, now); // B5
            osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
            
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.35);
        } catch (e) {
            console.warn("AudioContext could not start:", e);
        }
    }

    function triggerAlert(data) {
        if (!alertBox) return;

        alertBox.classList.remove('active');
        if (alertTimeout) clearTimeout(alertTimeout);

        alertTitle.textContent = data.title;
        alertMessage.textContent = data.message;
        
        if (data.type === 'sub') {
            alertIcon.className = 'fa-solid fa-heart alert-icon';
            alertBox.style.borderLeftColor = 'var(--color-primary)';
            playSubSound();
        } else if (data.type === 'donation') {
            alertIcon.className = 'fa-solid fa-dollar-sign alert-icon';
            alertBox.style.borderLeftColor = 'var(--color-success)';
            playDonationSound();
        }

        setTimeout(() => {
            alertBox.classList.add('active');
            alertTimeout = setTimeout(() => {
                alertBox.classList.remove('active');
            }, 6000);
        }, 100);
    }

    // 4. Update element style layout
    function updateWidgetLayout(widgetId, x, y, scale) {
        let element = null;
        if (widgetId === 'webcam') element = document.querySelector('.webcam-container');
        if (widgetId === 'chatbox') element = document.querySelector('.chatbox-container');
        if (widgetId === 'stats') element = document.querySelector('.stats-bar');
        if (widgetId === 'social') element = document.querySelector('.social-rotator');

        if (element) {
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
            element.style.transform = `scale(${scale / 100})`;
            element.style.transformOrigin = 'top left';
        }
    }

    function applyAllConfigToOverlay() {
        // Theme
        document.documentElement.style.setProperty('--color-primary', config.theme.primaryColor);
        document.documentElement.style.setProperty('--color-secondary', config.theme.secondaryColor);
        document.documentElement.style.setProperty('--glow-primary', `0 0 12px ${config.theme.primaryColor}80`);
        document.documentElement.style.setProperty('--glow-secondary', `0 0 12px ${config.theme.secondaryColor}80`);

        // Labels
        const webcamLabel = document.getElementById('webcamLabel');
        if (webcamLabel && config.labels.webcamText) {
            webcamLabel.innerHTML = `<i class="fa-solid fa-video"></i> ${escapeHTML(config.labels.webcamText)}`;
        }
        if (document.getElementById('subValue')) document.getElementById('subValue').textContent = config.labels.subText;
        if (document.getElementById('donationValue')) document.getElementById('donationValue').textContent = config.labels.donationText;
        if (document.getElementById('goalValue')) document.getElementById('goalValue').textContent = config.labels.goalText;
        if (document.getElementById('ytHandle')) document.getElementById('ytHandle').textContent = config.labels.ytHandle;
        if (document.getElementById('igHandle')) document.getElementById('igHandle').textContent = config.labels.igHandle;

        // Widget Layouts
        Object.keys(config.layout).forEach(key => {
            updateWidgetLayout(key, config.layout[key].x, config.layout[key].y, config.layout[key].scale);
        });
    }

    // Handle incoming Broadcast Channel triggers
    channel.onmessage = (event) => {
        const { action, data } = event.data;
        switch (action) {
            case 'update_theme':
                config.theme = data;
                document.documentElement.style.setProperty('--color-primary', data.primaryColor);
                document.documentElement.style.setProperty('--color-secondary', data.secondaryColor);
                document.documentElement.style.setProperty('--glow-primary', `0 0 12px ${data.primaryColor}80`);
                document.documentElement.style.setProperty('--glow-secondary', `0 0 12px ${data.secondaryColor}80`);
                break;
            case 'update_labels':
                config.labels = data;
                applyAllConfigToOverlay(); // Re-apply configuration values
                break;
            case 'trigger_alert':
                triggerAlert(data);
                break;
            case 'simulate_chat':
                addChatMessage(data.username, data.message, data.id);
                break;
            case 'layout_update':
                if (!config.layout) config.layout = {};
                config.layout[data.widgetId] = { x: data.x, y: data.y, scale: data.scale };
                updateWidgetLayout(data.widgetId, data.x, data.y, data.scale);
                break;
        }
    };

    // 5. OBS Server Polling Engine (Fallback for separate browser processes/OBS browser sources)
    let lastConfigStr = '';
    let lastAlertId = null;

    async function pollConfig() {
        try {
            const res = await fetch('layout.php');
            if (res.ok) {
                const remoteConfig = await res.json();
                
                // 1. Check if the layout/theme/labels configuration has changed
                const tempConfig = { theme: remoteConfig.theme, labels: remoteConfig.labels, layout: remoteConfig.layout };
                const tempConfigStr = JSON.stringify(tempConfig);
                
                if (tempConfigStr !== lastConfigStr) {
                    lastConfigStr = tempConfigStr;
                    config.theme = remoteConfig.theme;
                    config.labels = remoteConfig.labels;
                    config.layout = remoteConfig.layout;
                    applyAllConfigToOverlay();
                }

                // 2. Check if a new alert has been triggered
                if (remoteConfig.latestAlert && remoteConfig.latestAlert.id !== lastAlertId) {
                    lastAlertId = remoteConfig.latestAlert.id;
                    triggerAlert(remoteConfig.latestAlert);
                }

                // 3. Process new chat messages
                if (remoteConfig.chats && Array.isArray(remoteConfig.chats)) {
                    remoteConfig.chats.forEach(chat => {
                        if (chat.id && !processedChatIds.has(chat.id)) {
                            addChatMessage(chat.username, chat.message, chat.id);
                        }
                    });
                }
            }
        } catch (e) {
            console.warn("Polling config failed:", e);
        }
    }
    // Poll every 1.5 seconds for changes (works in OBS Studio browser source!)
    setInterval(pollConfig, 1500);
}

/* ==========================================================================
   CONTROL PANEL LOGIC (control.html)
   ========================================================================== */
async function initControlPanel() {
    console.log('Visual Control Panel Initialized...');

    // Load saved settings from server
    await loadConfigFromServer();
    populateFormControls();

    // 1. Theme Selection Inputs
    const primaryColorPicker = document.getElementById('primaryColor');
    const secondaryColorPicker = document.getElementById('secondaryColor');

    function sendThemeUpdate() {
        config.theme.primaryColor = primaryColorPicker.value;
        config.theme.secondaryColor = secondaryColorPicker.value;
        
        channel.postMessage({
            action: 'update_theme',
            data: config.theme
        });
        saveConfigToServer();
    }
    primaryColorPicker.addEventListener('change', sendThemeUpdate);
    secondaryColorPicker.addEventListener('change', sendThemeUpdate);

    // 2. Labels Input Inputs
    const labelsForm = document.getElementById('labelsForm');
    function sendLabelUpdate() {
        config.labels.webcamText = document.getElementById('webcamText').value;
        config.labels.subText = document.getElementById('subText').value;
        config.labels.donationText = document.getElementById('donationText').value;
        config.labels.goalText = document.getElementById('goalText').value;
        config.labels.ytHandle = document.getElementById('ytHandleInput').value;
        config.labels.igHandle = document.getElementById('igHandleInput').value;

        channel.postMessage({
            action: 'update_labels',
            data: config.labels
        });
        saveConfigToServer();
    }
    labelsForm.addEventListener('input', sendLabelUpdate);
    document.getElementById('subText').addEventListener('input', sendLabelUpdate);
    document.getElementById('donationText').addEventListener('input', sendLabelUpdate);
    document.getElementById('goalText').addEventListener('input', sendLabelUpdate);

    // 3. Trigger Alert Triggers
    document.getElementById('btnTriggerSub').addEventListener('click', () => {
        const username = document.getElementById('alertSubUser').value || 'Pangeran Ryan';
        const alertId = 'sub_' + Date.now();
        const alertData = {
            id: alertId,
            type: 'sub',
            title: 'New Subscriber!',
            message: `${username} just subscribed!`
        };

        // Broadcast locally
        channel.postMessage({
            action: 'trigger_alert',
            data: alertData
        });

        // Save to server
        config.latestAlert = alertData;
        saveConfigToServer();
    });

    document.getElementById('btnTriggerDonation').addEventListener('click', () => {
        const username = document.getElementById('alertDonUser').value || 'Budi Luhur';
        const amount = document.getElementById('alertDonAmount').value || 'Rp 50,000';
        const alertId = 'donation_' + Date.now();
        const alertData = {
            id: alertId,
            type: 'donation',
            title: 'New Donation!',
            message: `${username} donated ${amount}`
        };

        // Broadcast locally
        channel.postMessage({
            action: 'trigger_alert',
            data: alertData
        });

        // Save to server
        config.latestAlert = alertData;
        saveConfigToServer();
    });

    // 4. Chat Simulators
    document.getElementById('btnSendChat').addEventListener('click', () => {
        const username = document.getElementById('chatUser').value || 'Viewer';
        const message = document.getElementById('chatMsg').value;
        if (!message) return;

        const chatId = 'chat_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        const chatData = { id: chatId, username, message };

        // Broadcast locally
        channel.postMessage({
            action: 'simulate_chat',
            data: chatData
        });

        // Add to server chats
        if (!config.chats) config.chats = [];
        config.chats.push(chatData);
        if (config.chats.length > 15) {
            config.chats.shift();
        }
        
        saveConfigToServer();
        document.getElementById('chatMsg').value = '';
    });

    // ==========================================================================
    // 5. VISUAL DRAG AND RESIZE LOGIC ENGINE
    // ==========================================================================
    const canvasContainer = document.getElementById('editorCanvasContainer');
    
    // Scale editor elements to fit container sizing
    function renderEditorWidgets() {
        const containerWidth = canvasContainer.clientWidth;
        const ratio = containerWidth / 1920;

        // Apply scale transform to back canvas
        const canvasBg = document.querySelector('.editor-canvas-bg');
        canvasBg.style.transform = `scale(${ratio})`;

        // Render each widget block on the visual editor
        Object.keys(config.layout).forEach(w => {
            const el = document.getElementById(`widget_${w}`);
            if (!el) return;

            const layout = config.layout[w];
            const base = baseDimensions[w];
            
            const scaledW = base.w * (layout.scale / 100);
            const scaledH = base.h * (layout.scale / 100);

            el.style.left = `${layout.x * ratio}px`;
            el.style.top = `${layout.y * ratio}px`;
            el.style.width = `${scaledW * ratio}px`;
            el.style.height = `${scaledH * ratio}px`;

            // Update sliders/labels in the coordinate grid
            const sliderX = document.getElementById(`slider_${w}_x`);
            const sliderY = document.getElementById(`slider_${w}_y`);
            const sliderS = document.getElementById(`slider_${w}_s`);
            
            if (sliderX) { sliderX.value = layout.x; document.getElementById(`val_${w}_x`).textContent = layout.x; }
            if (sliderY) { sliderY.value = layout.y; document.getElementById(`val_${w}_y`).textContent = layout.y; }
            if (sliderS) { sliderS.value = layout.scale; document.getElementById(`val_${w}_s`).textContent = layout.scale; }

            const coordsLabel = document.getElementById(`widget_${w}_coords`);
            if (coordsLabel) {
                coordsLabel.textContent = `${layout.x}px, ${layout.y}px (${layout.scale}%)`;
            }
        });
    }

    // Mouse/Pointer Drag & Resize Handlers
    let activeWidget = null;
    let dragType = null; // 'drag' or 'resize'
    let startPointer = { x: 0, y: 0 };
    let startLayout = { x: 0, y: 0, scale: 100, w: 0, h: 0 };

    document.querySelectorAll('.editor-widget-wrapper').forEach(el => {
        const widgetId = el.id.replace('widget_', '');

        // Pointer down listener
        el.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            activeWidget = widgetId;
            el.classList.add('active');

            const containerWidth = canvasContainer.clientWidth;
            const ratio = containerWidth / 1920;

            const isResize = e.target.classList.contains('editor-widget-resize-handle');
            dragType = isResize ? 'resize' : 'drag';

            startPointer = { x: e.clientX, y: e.clientY };
            startLayout = {
                x: config.layout[widgetId].x,
                y: config.layout[widgetId].y,
                scale: config.layout[widgetId].scale,
                w: el.clientWidth / ratio,
                h: el.clientHeight / ratio
            };

            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
        });
    });

    function onPointerMove(e) {
        if (!activeWidget) return;

        const containerWidth = canvasContainer.clientWidth;
        const ratio = containerWidth / 1920;

        const deltaX = (e.clientX - startPointer.x) / ratio;
        const deltaY = (e.clientY - startPointer.y) / ratio;

        if (dragType === 'drag') {
            // Drag positioning
            let newX = Math.round(startLayout.x + deltaX);
            let newY = Math.round(startLayout.y + deltaY);

            // Constrain inside bounds
            const base = baseDimensions[activeWidget];
            const maxW = base.w * (startLayout.scale / 100);
            const maxH = base.h * (startLayout.scale / 100);

            newX = Math.max(0, Math.min(1920 - maxW, newX));
            newY = Math.max(0, Math.min(1080 - maxH, newY));

            config.layout[activeWidget].x = newX;
            config.layout[activeWidget].y = newY;

        } else if (dragType === 'resize') {
            // Diagonal resize scaling calculations
            const base = baseDimensions[activeWidget];
            const newW = startLayout.w + deltaX;
            const newScale = Math.round((newW / base.w) * 100);

            // Scale boundaries: 40% - 180%
            config.layout[activeWidget].scale = Math.max(40, Math.min(180, newScale));
        }

        // Broadcast to OBS Overlay immediately
        channel.postMessage({
            action: 'layout_update',
            data: {
                widgetId: activeWidget,
                x: config.layout[activeWidget].x,
                y: config.layout[activeWidget].y,
                scale: config.layout[activeWidget].scale
            }
        });

        // Re-render visual editor blocks
        renderEditorWidgets();
    }

    function onPointerUp() {
        if (activeWidget) {
            document.getElementById(`widget_${activeWidget}`).classList.remove('active');
            activeWidget = null;
            dragType = null;

            // Commit final configuration layout to server database
            saveConfigToServer();
        }

        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
    }

    // Connect slider listeners in coordinate form to support visual dragging sync
    function initCoordinateSliders() {
        const widgets = ['webcam', 'chatbox', 'stats', 'social'];
        widgets.forEach(w => {
            const sliderX = document.getElementById(`slider_${w}_x`);
            const sliderY = document.getElementById(`slider_${w}_y`);
            const sliderS = document.getElementById(`slider_${w}_s`);

            const syncFromSlider = () => {
                config.layout[w].x = parseInt(sliderX.value);
                config.layout[w].y = parseInt(sliderY.value);
                config.layout[w].scale = parseInt(sliderS.value);

                channel.postMessage({
                    action: 'layout_update',
                    data: {
                        widgetId: w,
                        x: config.layout[w].x,
                        y: config.layout[w].y,
                        scale: config.layout[w].scale
                    }
                });

                renderEditorWidgets();
                saveConfigToServer();
            };

            if (sliderX) {
                sliderX.addEventListener('input', syncFromSlider);
                sliderY.addEventListener('input', syncFromSlider);
                sliderS.addEventListener('input', syncFromSlider);
            }
        });
    }

    initCoordinateSliders();
    renderEditorWidgets();
    window.addEventListener('resize', renderEditorWidgets);

    // 6. Form setup defaults loader
    function populateFormControls() {
        primaryColorPicker.value = config.theme.primaryColor;
        secondaryColorPicker.value = config.theme.secondaryColor;

        document.getElementById('webcamText').value = config.labels.webcamText;
        document.getElementById('subText').value = config.labels.subText;
        document.getElementById('donationText').value = config.labels.donationText;
        document.getElementById('goalText').value = config.labels.goalText;
        document.getElementById('ytHandleInput').value = config.labels.ytHandle;
        document.getElementById('igHandleInput').value = config.labels.igHandle;

        renderEditorWidgets();
    }

    // Initial broadcast to OBS overlay on page connect
    setTimeout(() => {
        channel.postMessage({ action: 'update_theme', data: config.theme });
        channel.postMessage({ action: 'update_labels', data: config.labels });
        Object.keys(config.layout).forEach(key => {
            channel.postMessage({
                action: 'layout_update',
                data: {
                    widgetId: key,
                    x: config.layout[key].x,
                    y: config.layout[key].y,
                    scale: config.layout[key].scale
                }
            });
        });
    }, 800);


    // ==========================================================================
    // 7. YOUTUBE LIVE CHAT CONNECTION & FALLBACK DEMO ENGINE
    // ==========================================================================
    let youtubePollInterval = null;
    let nextChatPageToken = null;
    let activeLiveChatId = null;

    const btnConnectYT = document.getElementById('btnConnectYT');
    const btnDisconnectYT = document.getElementById('btnDisconnectYT');
    const ytVideoIdInput = document.getElementById('ytVideoId');
    const ytApiKeyInput = document.getElementById('ytApiKey');
    const ytStatusText = document.getElementById('ytStatusText');
    const ytLoadingSpinner = document.getElementById('ytLoadingSpinner');

    // Restore user parameters
    ytVideoIdInput.value = localStorage.getItem('yt_video_id') || '';
    ytApiKeyInput.value = localStorage.getItem('yt_api_key') || '';

    btnConnectYT.addEventListener('click', async () => {
        let videoId = ytVideoIdInput.value.trim();
        const apiKey = ytApiKeyInput.value.trim();

        if (!videoId) {
            alert('Harap masukkan YouTube Video ID atau URL Live Streaming!');
            return;
        }

        if (videoId.includes('youtube.com') || videoId.includes('youtu.be')) {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = videoId.match(regExp);
            if (match && match[2].length === 11) {
                videoId = match[2];
                ytVideoIdInput.value = videoId;
            } else {
                alert('URL YouTube tidak valid!');
                return;
            }
        }

        localStorage.setItem('yt_video_id', videoId);
        localStorage.setItem('yt_api_key', apiKey);

        ytLoadingSpinner.style.display = 'inline-block';
        ytStatusText.textContent = 'Menghubungkan ke YouTube...';
        btnConnectYT.disabled = true;

        if (!apiKey) {
            // YouTube Chat Demo Mode Simulation
            setTimeout(() => {
                ytLoadingSpinner.style.display = 'none';
                ytStatusText.innerHTML = '<b style="color: var(--color-success);">Terhubung (Demo Mode)</b>';
                btnConnectYT.style.display = 'none';
                btnDisconnectYT.style.display = 'inline-block';
                startYoutubeDemoPoll(videoId);
            }, 1500);
        } else {
            // Official YouTube API Connection
            try {
                const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${apiKey}`;
                const videoRes = await fetch(videoUrl);
                const videoData = await videoRes.json();

                if (!videoData.items || videoData.items.length === 0) {
                    throw new Error('Video/Siaran tidak ditemukan.');
                }

                const liveDetails = videoData.items[0].liveStreamingDetails;
                if (!liveDetails || !liveDetails.activeLiveChatId) {
                    throw new Error('Siaran ini tidak memiliki Live Chat aktif.');
                }

                activeLiveChatId = liveDetails.activeLiveChatId;
                nextChatPageToken = null;

                ytLoadingSpinner.style.display = 'none';
                ytStatusText.innerHTML = '<b style="color: var(--color-success);">Terhubung ke YouTube!</b>';
                btnConnectYT.style.display = 'none';
                btnDisconnectYT.style.display = 'inline-block';

                youtubePollInterval = setInterval(fetchRealYoutubeChat, 4000);
                fetchRealYoutubeChat();
            } catch (error) {
                console.error(error);
                ytLoadingSpinner.style.display = 'none';
                ytStatusText.innerHTML = `<span style="color: #ff3b30;">Galat: ${error.message}</span>`;
                btnConnectYT.disabled = false;
            }
        }
    });

    btnDisconnectYT.addEventListener('click', () => {
        if (youtubePollInterval) {
            clearInterval(youtubePollInterval);
            youtubePollInterval = null;
        }
        ytStatusText.textContent = 'Status: Terputus';
        btnConnectYT.style.display = 'inline-block';
        btnConnectYT.disabled = false;
        btnDisconnectYT.style.display = 'none';
        ytLoadingSpinner.style.display = 'none';
    });

    async function fetchRealYoutubeChat() {
        if (!activeLiveChatId) return;
        const apiKey = ytApiKeyInput.value.trim();
        let url = `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${activeLiveChatId}&part=snippet,authorDetails&maxResults=20&key=${apiKey}`;
        if (nextChatPageToken) url += `&pageToken=${nextChatPageToken}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.nextPageToken) nextChatPageToken = data.nextPageToken;
            if (data.items && data.items.length > 0) {
                let hasNewMessages = false;
                data.items.forEach(item => {
                    const username = item.authorDetails.displayName;
                    const message = item.snippet.displayMessage;
                    const chatId = item.id;

                    const chatData = { id: chatId, username, message };

                    channel.postMessage({
                        action: 'simulate_chat',
                        data: chatData
                    });

                    if (!config.chats) config.chats = [];
                    if (!config.chats.some(c => c.id === chatId)) {
                        config.chats.push(chatData);
                        hasNewMessages = true;
                    }
                });

                if (hasNewMessages) {
                    if (config.chats.length > 15) {
                        config.chats = config.chats.slice(-15);
                    }
                    saveConfigToServer();
                }
            }
        } catch (error) {
            console.error("Gagal fetch pesan:", error);
        }
    }

    const ytDemoUsers = ['MangaFans_ID', 'Rian_WibuGamer', 'KawaiiChan', 'VTuberLovers', 'Kpop_Stan', 'Bang_Kurnia'];
    const ytDemoMessages = [
        'Salam kenal dari Bandung bang!',
        'Semangat live streamingnya, overlay-nya imut banget!',
        'Chibi mascot-nya bisa gerak-gerak lucu :D',
        'Minta request game horror dong setelah ini',
        'Berapaan bang beli overlay kayak gini?',
        'Donasi meluncur!!! Check alert bang',
        'Gimana cara ubah posisinya? Mau coba dipindahin chatboxnya',
        'Mantap lancar jaya streamingnya!'
    ];

    function startYoutubeDemoPoll() {
        let pollDelay = 4000;
        const scheduleNextDemo = () => {
            if (btnDisconnectYT.style.display === 'none') return;
            const randomUser = ytDemoUsers[Math.floor(Math.random() * ytDemoUsers.length)];
            const randomMsg = ytDemoMessages[Math.floor(Math.random() * ytDemoMessages.length)];

            const chatId = 'demo_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            const chatData = {
                id: chatId,
                username: `[YT] ${randomUser}`,
                message: randomMsg
            };

            channel.postMessage({
                action: 'simulate_chat',
                data: chatData
            });

            if (!config.chats) config.chats = [];
            config.chats.push(chatData);
            if (config.chats.length > 15) {
                config.chats.shift();
            }
            saveConfigToServer();

            pollDelay = Math.floor(Math.random() * 4000) + 3000;
            youtubePollInterval = setTimeout(scheduleNextDemo, pollDelay);
        };
        youtubePollInterval = setTimeout(scheduleNextDemo, pollDelay);
    }
}

/* ==========================================================================
   HELPERS
   ========================================================================== */
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
