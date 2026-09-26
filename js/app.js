/**
 * App
 * Main Controller & Orchestration Engine for VisionTrack AI
 * Bridges Camera/Video inputs, Neural Detection, Multi-Object Tracking, and UI Telemetry.
 * 
 * Part of CodeAlpha Task 2: Object Detection and Tracking
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements - Video & Canvas
  const video = document.getElementById('inputVideo');
  const canvas = document.getElementById('outputCanvas');
  const viewportPlaceholder = document.getElementById('viewportPlaceholder');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingMessage = document.getElementById('loadingMessage');
  const videoPlaybackBar = document.getElementById('videoPlaybackBar');
  const videoTimeline = document.getElementById('videoTimeline');
  const videoTimeDisplay = document.getElementById('videoTimeDisplay');
  const btnPlayPauseVideo = document.getElementById('btnPlayPauseVideo');
  const playPauseIcon = document.getElementById('playPauseIcon');
  const btnLoopVideo = document.getElementById('btnLoopVideo');

  // DOM Elements - Status Header
  const modelStatusChip = document.getElementById('modelStatusChip');
  const statusDot = document.getElementById('statusDot');
  const modelStatusText = document.getElementById('modelStatusText');
  const sourceStatusText = document.getElementById('sourceStatusText');
  const livePill = document.getElementById('livePill');
  const inlineFps = document.getElementById('inlineFps');
  const inlineResolution = document.getElementById('inlineResolution');

  // DOM Elements - Telemetry Cards
  const statActiveCount = document.getElementById('statActiveCount');
  const statTotalTracked = document.getElementById('statTotalTracked');
  const statFps = document.getElementById('statFps');
  const statLatency = document.getElementById('statLatency');
  const classCountBadge = document.getElementById('classCountBadge');
  const classChipsContainer = document.getElementById('classChipsContainer');

  // DOM Elements - Controls
  const btnStartCamera = document.getElementById('btnStartCamera');
  const btnStartCameraHero = document.getElementById('btnStartCameraHero');
  const btnStopFeed = document.getElementById('btnStopFeed');
  const videoFileInput = document.getElementById('videoFileInput');
  const heroVideoUpload = document.getElementById('heroVideoUpload');
  const uploadedFileName = document.getElementById('uploadedFileName');

  // Sliders & Toggles
  const confThresholdSlider = document.getElementById('confThreshold');
  const confThresholdValue = document.getElementById('confThresholdValue');
  const iouThresholdSlider = document.getElementById('iouThreshold');
  const iouThresholdValue = document.getElementById('iouThresholdValue');
  const maxDisappearedSlider = document.getElementById('maxDisappeared');
  const maxDisappearedValue = document.getElementById('maxDisappearedValue');

  const toggleBoxes = document.getElementById('toggleBoxes');
  const toggleLabels = document.getElementById('toggleLabels');
  const toggleConfidence = document.getElementById('toggleConfidence');
  const toggleTrackingId = document.getElementById('toggleTrackingId');
  const toggleTrails = document.getElementById('toggleTrails');

  // State Management
  let stream = null;
  let isRunning = false;
  let isProcessingFrame = false;
  let animationFrameId = null;
  let currentSourceType = 'idle'; // 'camera' | 'video' | 'idle'
  let isVideoLooping = true;

  // FPS calculation variables
  let frameCount = 0;
  let lastFpsUpdateTime = performance.now();
  let currentFps = 0;

  // Instantiate Core Vision Engine Modules
  const detector = new ObjectDetector();
  const tracker = new MultiObjectTracker({
    iouThreshold: parseFloat(iouThresholdSlider.value),
    maxDisappeared: parseInt(maxDisappearedSlider.value, 10)
  });
  const visualizer = new Visualizer(canvas);

  // Initialize Detection Model
  try {
    loadingOverlay.classList.remove('hidden');
    await detector.init((msg) => {
      loadingMessage.textContent = msg;
    });

    statusDot.className = 'status-dot ready';
    modelStatusText.textContent = 'Model: Ready (WebGL)';
    loadingOverlay.classList.add('hidden');
  } catch (err) {
    statusDot.className = 'status-dot';
    statusDot.style.backgroundColor = '#f43f5e';
    modelStatusText.textContent = 'Model Failed to Load';
    loadingMessage.textContent = 'Error loading vision model. Please check network/CDN connection.';
    console.error(err);
    return;
  }

  // =========================================================================
  // Media Input Handlers (Camera & Video)
  // =========================================================================

  /**
   * Start Webcam Stream
   */
  async function startCamera() {
    stopCurrentFeed();

    try {
      sourceStatusText.textContent = 'Connecting Camera...';
      const constraints = {
        audio: false,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      };

      stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      currentSourceType = 'camera';

      await video.play();

      onFeedStarted('Webcam (Live)');
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Unable to access camera: ' + (err.message || 'Permission denied'));
      stopCurrentFeed();
    }
  }

  /**
   * Start Uploaded Video Stream
   */
  function handleVideoFile(file) {
    if (!file) return;

    stopCurrentFeed();

    const videoUrl = URL.createObjectURL(file);
    video.srcObject = null;
    video.src = videoUrl;
    video.loop = isVideoLooping;
    currentSourceType = 'video';

    uploadedFileName.textContent = file.name;

    video.onloadedmetadata = () => {
      video.play().then(() => {
        onFeedStarted(`Video (${file.name})`);
        videoPlaybackBar.style.display = 'flex';
        updateVideoTimeline();
      }).catch(err => {
        console.error('Video play error:', err);
      });
    };
  }

  /**
   * Update UI state when a live feed or video begins playing
   */
  function onFeedStarted(sourceLabel) {
    isRunning = true;
    viewportPlaceholder.classList.add('hidden');
    btnStopFeed.disabled = false;
    btnStartCamera.disabled = true;

    livePill.textContent = currentSourceType === 'camera' ? 'LIVE' : 'PLAYING';
    livePill.className = 'live-indicator live';
    sourceStatusText.textContent = `Source: ${sourceLabel}`;

    tracker.reset();
    lastFpsUpdateTime = performance.now();
    frameCount = 0;

    // Start main detection and tracking loop
    startProcessingLoop();
  }

  /**
   * Stop any active video or camera feed
   */
  function stopCurrentFeed() {
    isRunning = false;

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }

    if (video.src) {
      URL.revokeObjectURL(video.src);
      video.removeAttribute('src');
    }
    video.srcObject = null;

    currentSourceType = 'idle';
    isProcessingFrame = false;

    // Reset UI indicators
    viewportPlaceholder.classList.remove('hidden');
    videoPlaybackBar.style.display = 'none';
    btnStopFeed.disabled = true;
    btnStartCamera.disabled = false;
    livePill.textContent = 'STANDBY';
    livePill.className = 'live-indicator';
    sourceStatusText.textContent = 'Source: Idle';
    inlineFps.textContent = '0';
    inlineResolution.textContent = '-- x --';
    statFps.textContent = '0';
    statActiveCount.textContent = '0';
    classCountBadge.textContent = '0 Types';
    classChipsContainer.innerHTML = '<span class="empty-chips-hint">No objects currently detected.</span>';

    visualizer.clear();
  }

  // =========================================================================
  // Core Detection & Tracking Loop
  // =========================================================================

  function startProcessingLoop() {
    async function loop() {
      if (!isRunning) return;

      if (video.readyState >= 2 && !video.paused && !video.ended) {
        const videoWidth = video.videoWidth || 640;
        const videoHeight = video.videoHeight || 480;

        // Ensure canvas matches native video dimensions
        visualizer.resizeToSource(videoWidth, videoHeight);
        inlineResolution.textContent = `${videoWidth} x ${videoHeight}`;

        // Draw original video frame to canvas
        visualizer.drawVideoFrame(video);

        // Run object detection if not currently awaiting previous inference
        if (!isProcessingFrame) {
          isProcessingFrame = true;
          const minConfidence = parseFloat(confThresholdSlider.value) / 100;

          try {
            // 1. Detect objects in current frame (COCO-SSD / YOLO-compatible classes)
            const rawDetections = await detector.detect(video, minConfidence);

            // 2. Pass detections to tracker to associate persistent IDs & trajectories
            const activeTracks = tracker.update(rawDetections);

            // 3. Render visual overlays (boxes, IDs, confidence, trajectories)
            visualizer.render(activeTracks);

            // 4. Update real-time telemetry metrics
            updateTelemetry(activeTracks);
          } catch (err) {
            console.error('Detection loop iteration error:', err);
          } finally {
            isProcessingFrame = false;
          }
        }

        // Measure FPS
        measureFps();

        // Update video progress bar if playing uploaded video
        if (currentSourceType === 'video') {
          updateVideoTimeline();
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    }

    animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * FPS counter with 500ms moving average window
   */
  function measureFps() {
    frameCount++;
    const now = performance.now();
    const elapsed = now - lastFpsUpdateTime;

    if (elapsed >= 500) {
      currentFps = Math.round((frameCount * 1000) / elapsed);
      frameCount = 0;
      lastFpsUpdateTime = now;

      statFps.textContent = currentFps;
      inlineFps.textContent = currentFps;
    }
  }

  /**
   * Update Dashboard Telemetry (Active counts, Unique IDs, Class chips)
   */
  function updateTelemetry(activeTracks) {
    const activeCount = activeTracks.length;
    statActiveCount.textContent = activeCount;
    statTotalTracked.textContent = tracker.totalTrackedCount;
    statLatency.innerHTML = `${detector.getInferenceTime()} <small>ms</small>`;

    // Count detections grouped by class
    const classCounts = new Map();
    for (const track of activeTracks) {
      const cls = track.class;
      classCounts.set(cls, (classCounts.get(cls) || 0) + 1);
    }

    classCountBadge.textContent = `${classCounts.size} ${classCounts.size === 1 ? 'Type' : 'Types'}`;

    if (classCounts.size === 0) {
      classChipsContainer.innerHTML = '<span class="empty-chips-hint">No objects currently detected.</span>';
    } else {
      let chipsHtml = '';
      for (const [cls, count] of classCounts.entries()) {
        // Find color of first active track with this class
        const sampleTrack = activeTracks.find(t => t.class === cls);
        const color = sampleTrack ? sampleTrack.color.primary : '#00f2fe';

        chipsHtml += `
          <div class="class-chip">
            <span class="chip-color-dot" style="background-color: ${color};"></span>
            <span>${cls}</span>
            <span class="chip-count">${count}</span>
          </div>
        `;
      }
      classChipsContainer.innerHTML = chipsHtml;
    }
  }

  // =========================================================================
  // Video Player Timeline Controls
  // =========================================================================

  function updateVideoTimeline() {
    if (!video.duration) return;
    const progress = (video.currentTime / video.duration) * 100;
    videoTimeline.value = progress;

    const currM = String(Math.floor(video.currentTime / 60)).padStart(2, '0');
    const currS = String(Math.floor(video.currentTime % 60)).padStart(2, '0');
    const durM = String(Math.floor(video.duration / 60)).padStart(2, '0');
    const durS = String(Math.floor(video.duration % 60)).padStart(2, '0');

    videoTimeDisplay.textContent = `${currM}:${currS} / ${durM}:${durS}`;
  }

  videoTimeline.addEventListener('input', () => {
    if (!video.duration) return;
    video.currentTime = (videoTimeline.value / 100) * video.duration;
  });

  btnPlayPauseVideo.addEventListener('click', () => {
    if (video.paused) {
      video.play();
      playPauseIcon.textContent = '⏸️';
    } else {
      video.pause();
      playPauseIcon.textContent = '▶️';
    }
  });

  btnLoopVideo.addEventListener('click', () => {
    isVideoLooping = !isVideoLooping;
    video.loop = isVideoLooping;
    btnLoopVideo.classList.toggle('active', isVideoLooping);
  });

  // =========================================================================
  // Control Panel Event Listeners
  // =========================================================================

  // Camera buttons
  btnStartCamera.addEventListener('click', startCamera);
  btnStartCameraHero.addEventListener('click', startCamera);
  btnStopFeed.addEventListener('click', stopCurrentFeed);

  // Video file inputs
  videoFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleVideoFile(e.target.files[0]);
    }
  });

  heroVideoUpload.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleVideoFile(e.target.files[0]);
    }
  });

  // Confidence Threshold Slider
  confThresholdSlider.addEventListener('input', (e) => {
    confThresholdValue.textContent = `${e.target.value}%`;
  });

  // IoU Threshold Slider
  iouThresholdSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    iouThresholdValue.textContent = val.toFixed(2);
    tracker.iouThreshold = val;
  });

  // Max Disappeared Slider
  maxDisappearedSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    maxDisappearedValue.textContent = val;
    tracker.maxDisappeared = val;
  });

  // Display Toggles
  function updateVisualizerConfig() {
    visualizer.updateSettings({
      showBoxes: toggleBoxes.checked,
      showLabels: toggleLabels.checked,
      showConfidence: toggleConfidence.checked,
      showTrackingId: toggleTrackingId.checked,
      showTrails: toggleTrails.checked
    });
  }

  toggleBoxes.addEventListener('change', updateVisualizerConfig);
  toggleLabels.addEventListener('change', updateVisualizerConfig);
  toggleConfidence.addEventListener('change', updateVisualizerConfig);
  toggleTrackingId.addEventListener('change', updateVisualizerConfig);
  toggleTrails.addEventListener('change', updateVisualizerConfig);
});
