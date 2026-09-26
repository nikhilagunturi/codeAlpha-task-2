/**
 * MultiObjectTracker
 * Real-time Multi-Object Tracking Engine (IoU + Centroid Association)
 * Assigns persistent unique IDs, computes motion trajectories, and handles occlusions.
 * 
 * Part of CodeAlpha Task 2: Object Detection and Tracking
 */

class Track {
  constructor(id, detection) {
    this.id = id;
    this.class = detection.class;
    this.score = detection.score;
    this.bbox = [...detection.bbox]; // [x, y, width, height]
    this.centroid = this.computeCentroid(this.bbox);
    this.history = [this.centroid];
    this.maxHistory = 30; // Max trajectory trail length
    this.disappeared = 0;
    this.age = 1;
    this.totalHits = 1;
    this.color = this.generateColor(id);
  }

  computeCentroid(bbox) {
    const [x, y, w, h] = bbox;
    return {
      x: Math.round(x + w / 2),
      y: Math.round(y + h / 2)
    };
  }

  update(detection, smoothing = 0.65) {
    this.score = detection.score;
    this.class = detection.class;

    // Smooth bounding box using Exponential Moving Average to prevent jitter
    const [nx, ny, nw, nh] = detection.bbox;
    const [ox, oy, ow, oh] = this.bbox;

    this.bbox = [
      ox * (1 - smoothing) + nx * smoothing,
      oy * (1 - smoothing) + ny * smoothing,
      ow * (1 - smoothing) + nw * smoothing,
      oh * (1 - smoothing) + nh * smoothing
    ];

    this.centroid = this.computeCentroid(this.bbox);
    this.history.push(this.centroid);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    this.disappeared = 0;
    this.age++;
    this.totalHits++;
  }

  markMissed() {
    this.disappeared++;
    this.age++;
  }

  generateColor(id) {
    // Generate distinct, vibrant HSL colors keyed to ID
    const goldenRatio = 0.618033988749895;
    const hue = Math.floor(((id * goldenRatio) % 1) * 360);
    return {
      primary: `hsl(${hue}, 90%, 55%)`,
      bg: `hsla(${hue}, 90%, 55%, 0.18)`,
      glow: `hsla(${hue}, 90%, 55%, 0.45)`,
      hue: hue
    };
  }
}

class MultiObjectTracker {
  constructor(options = {}) {
    this.iouThreshold = options.iouThreshold || 0.35;
    this.maxDisappeared = options.maxDisappeared || 15;
    this.tracks = new Map(); // id -> Track
    this.nextTrackId = 1;
    this.totalTrackedCount = 0;
  }

  /**
   * Calculate Intersection over Union (IoU) between two bounding boxes
   * Bounding box format: [x, y, width, height]
   */
  calculateIoU(boxA, boxB) {
    const [xA, yA, wA, hA] = boxA;
    const [xB, yB, wB, hB] = boxB;

    const x1 = Math.max(xA, xB);
    const y1 = Math.max(yA, yB);
    const x2 = Math.min(xA + wA, xB + wB);
    const y2 = Math.min(yA + hA, yB + hB);

    const intersectionArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const areaA = wA * hA;
    const areaB = wB * hB;
    const unionArea = areaA + areaB - intersectionArea;

    if (unionArea <= 0) return 0;
    return intersectionArea / unionArea;
  }

  /**
   * Update tracker state with newly detected objects for current frame
   * @param {Array} detections - [{ bbox: [x, y, w, h], class: string, score: number }]
   * @returns {Array<Track>} Active visible tracks
   */
  update(detections = []) {
    // 1. If no active tracks exist, initialize all detections as new tracks
    if (this.tracks.size === 0) {
      for (const det of detections) {
        this.registerTrack(det);
      }
      return this.getActiveTracks();
    }

    // 2. If no detections in current frame, mark all active tracks as missed
    if (detections.length === 0) {
      for (const [id, track] of this.tracks.entries()) {
        track.markMissed();
        if (track.disappeared > this.maxDisappeared) {
          this.tracks.delete(id);
        }
      }
      return this.getActiveTracks();
    }

    const trackEntries = Array.from(this.tracks.entries());
    const matchedTrackIds = new Set();
    const matchedDetectionIndices = new Set();

    // 3. Compute IoU matrix and find best greedy matches (matching same class first)
    const matches = [];

    for (let tIdx = 0; tIdx < trackEntries.length; tIdx++) {
      const [trackId, track] = trackEntries[tIdx];

      for (let dIdx = 0; dIdx < detections.length; dIdx++) {
        const detection = detections[dIdx];

        // Same class prioritized
        const classMatch = track.class === detection.class;
        const iou = this.calculateIoU(track.bbox, detection.bbox);

        // Allow match if IoU exceeds threshold (higher threshold if different class)
        const minReqIoU = classMatch ? this.iouThreshold : Math.max(0.5, this.iouThreshold + 0.15);

        if (iou >= minReqIoU) {
          matches.push({
            trackId,
            detectionIndex: dIdx,
            iou,
            classMatch
          });
        }
      }
    }

    // Sort matches by highest IoU descending
    matches.sort((a, b) => {
      if (a.classMatch !== b.classMatch) return b.classMatch ? 1 : -1;
      return b.iou - a.iou;
    });

    // Greedily assign matches
    for (const match of matches) {
      if (matchedTrackIds.has(match.trackId) || matchedDetectionIndices.has(match.detectionIndex)) {
        continue;
      }

      const track = this.tracks.get(match.trackId);
      const detection = detections[match.detectionIndex];

      track.update(detection);
      matchedTrackIds.add(match.trackId);
      matchedDetectionIndices.add(match.detectionIndex);
    }

    // 4. Update unmatched existing tracks (increment missed frames)
    for (const [id, track] of this.tracks.entries()) {
      if (!matchedTrackIds.has(id)) {
        track.markMissed();
        if (track.disappeared > this.maxDisappeared) {
          this.tracks.delete(id);
        }
      }
    }

    // 5. Register unmatched detections as new tracks with unique IDs
    for (let dIdx = 0; dIdx < detections.length; dIdx++) {
      if (!matchedDetectionIndices.has(dIdx)) {
        this.registerTrack(detections[dIdx]);
      }
    }

    return this.getActiveTracks();
  }

  registerTrack(detection) {
    const id = this.nextTrackId++;
    const track = new Track(id, detection);
    this.tracks.set(id, track);
    this.totalTrackedCount++;
    return track;
  }

  getActiveTracks() {
    // Return tracks currently visible in the active frame (disappeared === 0)
    return Array.from(this.tracks.values()).filter(t => t.disappeared === 0);
  }

  getAllTracks() {
    return Array.from(this.tracks.values());
  }

  reset() {
    this.tracks.clear();
    this.nextTrackId = 1;
    this.totalTrackedCount = 0;
  }
}

// Export for browser window
window.MultiObjectTracker = MultiObjectTracker;
