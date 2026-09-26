# VisionTrack AI &mdash; Real-Time Object Detection & Tracking Dashboard

> **CodeAlpha Internship &bull; Task 2: Object Detection and Tracking**  
> A high-performance, real-time web application built with pure client-side **JavaScript, HTML5, and CSS** &mdash; no Python or Streamlit required.

---

## 📌 Project Overview

This project implements an end-to-end Computer Vision pipeline directly inside modern web browsers:
1. **Real-Time Object Detection**: Powered by TensorFlow.js and COCO-SSD (80 standard COCO classes, identical to the standard YOLOv5 / YOLOv8 class taxonomy), accelerated by **WebGL GPU shaders**.
2. **Real-Time Multi-Object Tracking (MOT)**: Implemented from scratch in JavaScript using **Intersection-over-Union (IoU) matching**, **Centroid Association**, and **Exponential Moving Average (EMA)** bounding box smoothing.
3. **Live Camera & Video Support**: Supports live webcam streams and uploaded local video files (`.mp4`, `.webm`).
4. **Professional Vision Dashboard**: Modern dark-mode interface with live HUD badges, active detection counters, unique tracking IDs, class breakdown, confidence scores, and trajectory trails.

---

## 🗂️ Project Structure & File Roles

```
codeAlpha task 2(1)/
├── app.py               # Streamlit entry point for permanent deployment on Streamlit Community Cloud
├── requirements.txt     # Python dependencies for Streamlit Cloud deployment
├── index.html           # Main user interface, video viewport, HUD overlays, telemetry cards, and controls
├── package.json         # Project metadata and quick local server script
├── .gitignore           # Git ignore rules for clean repository pushes
├── README.md            # Comprehensive documentation, setup guide, and technical architecture
├── css/
│   └── style.css        # Responsive dark-mode styling, glassmorphic cards, glowing accents, and UI animations
└── js/
    ├── app.js           # Core controller orchestrating camera, video inputs, render loop, and UI telemetry
    ├── detector.js      # Neural network detector module (TensorFlow.js COCO-SSD / 80 COCO YOLO-compatible classes)
    ├── tracker.js       # Multi-Object Tracking engine (IoU + Centroid matching, unique IDs, occlusion handling)
    └── visualizer.js    # Canvas rendering engine (bounding boxes, persistent ID badges, and trajectory trails)
```

### Detailed File Responsibilities

* [index.html](file:///c:/Users/nikhi/Downloads/codeAlpha%20task%202%281%29/index.html):
  Contains the clean, semantic markup for the dashboard. Defines the live video/canvas viewport, telemetry metric cards (Active Objects, Total Tracked IDs, FPS, Latency), source control buttons (Webcam, Video upload), tuning sliders (Confidence, IoU, Max Disappeared), and display toggles.

* [css/style.css](file:///c:/Users/nikhi/Downloads/codeAlpha%20task%202%281%29/css/style.css):
  Provides a sleek, dark-themed AI visual interface with glassmorphism (`backdrop-filter`), neon cyan and emerald accents, custom sliders, responsive grid layouts, and smooth transition animations.

* [js/detector.js](file:///c:/Users/nikhi/Downloads/codeAlpha%20task%202%281%29/js/detector.js):
  Initializes the neural network using TensorFlow.js with WebGL hardware acceleration. It accepts video frames, detects objects across the 80 standard COCO classes (the same dataset used by YOLO), filters detections by confidence threshold, and measures inference latency.

* [js/tracker.js](file:///c:/Users/nikhi/Downloads/codeAlpha%20task%202%281%29/js/tracker.js):
  Contains the `MultiObjectTracker` and `Track` classes. It computes the IoU cost matrix between consecutive frames, matches active tracks with new detections, assigns persistent unique numeric IDs (`#1`, `#2`, `#3`), maintains motion history for trajectory trails, and handles occlusions with a configurable `maxDisappeared` frame counter.

* [js/visualizer.js](file:///c:/Users/nikhi/Downloads/codeAlpha%20task%202%281%29/js/visualizer.js):
  Manages all HTML5 Canvas drawing operations. Renders the video frame, color-coded bounding boxes with cyber-brackets, floating ID badges (`ID:#1 • PERSON • 94%`), centroid indicators, and fading motion trajectory trails.

* [js/app.js](file:///c:/Users/nikhi/Downloads/codeAlpha%20task%202%281%29/js/app.js):
  The central application orchestrator. Handles webcam permissions via `navigator.mediaDevices.getUserMedia`, video file decoding, the `requestAnimationFrame` animation loop, FPS measurement (moving average), slider adjustments, and real-time class breakdown metrics.

---

## 🌐 Permanent Public Deployment (Live URL for Submission)

To get a permanent public URL (e.g. for your CodeAlpha internship submission), you can deploy via **Streamlit Cloud** or **Vercel / GitHub Pages**:

### Option 1: Deploy on Streamlit Community Cloud (Free Permanent URL)

This project includes [`app.py`](file:///c:/Users/nikhi/Downloads/codeAlpha%20task%202%281%29/app.py) and [`requirements.txt`](file:///c:/Users/nikhi/Downloads/codeAlpha%20task%202%281%29/requirements.txt) pre-configured to deploy directly to Streamlit Cloud:

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for CodeAlpha Task 2"
   git branch -M main
   # Create a new repository on https://github.com/new, then run:
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. **Deploy on Streamlit**:
   - Go to [share.streamlit.io](https://share.streamlit.io) and log in with GitHub.
   - Click **"New app"**.
   - Select your repository and branch (`main`).
   - Set **Main file path** to `app.py`.
   - Click **"Deploy!"**.
   - Your permanent live URL will be: `https://<your-repo-name>.streamlit.app`!

> [!TIP]
> **Streamlit Iframe Camera Note**: Inside Streamlit Cloud, video upload (`.mp4`, `.webm`) works 100% seamlessly. If a client's browser blocks live webcam access due to iframe sandbox policies on some browsers, users can also access the direct standalone link.

---

### Option 2: Deploy on Vercel or GitHub Pages (Recommended for 100% WebRTC Camera Support)

Because VisionTrack AI is a pure client-side web application, deploying to Vercel or GitHub Pages gives you a 100% free permanent HTTPS link with zero iframe restrictions (webcam and WebGL GPU work natively):

* **Vercel (30 seconds)**:
  1. Go to [vercel.com](https://vercel.com) and import your GitHub repo.
  2. Click **Deploy**. Your permanent link will be `https://<your-project>.vercel.app`.
* **GitHub Pages**:
  1. In your GitHub repo, go to **Settings** &rarr; **Pages**.
  2. Under *Build and deployment*, set Source to `Deploy from a branch` &rarr; `main` &rarr; `/ (root)`.
  3. Click **Save**. Your permanent link will be `https://<your-username>.github.io/<your-repo>/`.

---

## 💻 How to Run Locally

### Option A: Using Streamlit Locally
```bash
py -m streamlit run app.py
```
Opens at `http://localhost:8501`.

### Option B: Using Node.js / npx (Zero Installation)
```bash
npx serve .
```
Opens at `http://localhost:3000`.

### Option C: Using VS Code Live Server
1. Right-click [index.html](file:///c:/Users/nikhi/Downloads/codeAlpha%20task%202%281%29/index.html) in VS Code.
2. Select **"Open with Live Server"**.

---

## 🛠️ Features & Controls

| Feature | Description |
| :--- | :--- |
| **Webcam Stream** | Click **"Start Camera"** to initialize live webcam tracking with audio disabled. |
| **Video Upload** | Click **"Upload Video File"** to load any local MP4/WebM video file with integrated timeline playback controls. |
| **Stop Feed** | Halts the video stream, cancels animation frames, and cleanly releases camera hardware resources. |
| **Persistent Object IDs** | Each tracked object is assigned a unique numeric identifier (`#ID`) that stays consistent across frames. |
| **Confidence Threshold** | Slider (15% &ndash; 95%) dynamically filters out low-certainty detections. |
| **IoU Match Threshold** | Slider (0.10 &ndash; 0.80) controls how strictly bounding boxes must overlap to retain the same tracking ID. |
| **Max Disappeared** | Configures how many frames an object can be occluded/lost before its ID is retired. |
| **Display Toggles** | Show/hide bounding boxes, class labels, confidence %, tracking IDs, and trajectory trails on the fly. |
| **Real-time Telemetry** | Displays active object counts, total unique tracked count, real-time FPS, and per-frame latency (ms). |
| **Class Breakdown** | Dynamic colored badge list showing counts of each active detected object category (e.g., `person: 2`, `cell phone: 1`). |

---

## 🧠 Supported Object Classes (COCO 80 / YOLO Compatible)

The model detects 80 standard COCO classes, including:
- **People & Vehicles**: `person`, `bicycle`, `car`, `motorcycle`, `airplane`, `bus`, `train`, `truck`, `boat`
- **Outdoor & Animals**: `traffic light`, `fire hydrant`, `stop sign`, `bench`, `bird`, `cat`, `dog`, `horse`, `sheep`, `cow`, `bear`
- **Accessories**: `backpack`, `umbrella`, `handbag`, `tie`, `suitcase`
- **Electronics & Appliances**: `tv`, `laptop`, `mouse`, `remote`, `keyboard`, `cell phone`, `microwave`, `refrigerator`
- **Indoor Furniture & Items**: `chair`, `couch`, `potted plant`, `bed`, `dining table`, `book`, `clock`, `bottle`, `cup`

---

## 📜 Submission Details

* **Internship Program**: CodeAlpha Web Development / AI Track
* **Task**: Task 2 &mdash; Object Detection and Tracking
* **Technologies**: HTML5, CSS3, JavaScript (ES6+), TensorFlow.js, Canvas API
