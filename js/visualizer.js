/**
 * Visualizer
 * High-performance Canvas Overlay Renderer.
 * Draws bounding boxes, persistent tracking IDs, confidence scores, class labels,
 * and motion trajectory trails with modern visual styling.
 * 
 * Part of CodeAlpha Task 2: Object Detection and Tracking
 */

class Visualizer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');

    // Display configuration toggles
    this.settings = {
      showBoxes: true,
      showLabels: true,
      showConfidence: true,
      showTrackingId: true,
      showTrails: true
    };
  }

  /**
   * Adjust canvas resolution to match source video dimensions
   */
  resizeToSource(width, height) {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  /**
   * Clear canvas
   */
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draw the source video frame directly onto canvas
   */
  drawVideoFrame(videoElement) {
    this.ctx.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Render all active tracking objects and visual HUD onto canvas
   * @param {Array<Track>} tracks - Array of active Track instances from MultiObjectTracker
   */
  render(tracks = []) {
    for (const track of tracks) {
      const { bbox, color, id, class: className, score, history } = track;
      const [x, y, w, h] = bbox;

      // 1. Draw Motion Trajectory Trail
      if (this.settings.showTrails && history && history.length > 1) {
        this.drawTrajectory(history, color);
      }

      // 2. Draw Bounding Box
      if (this.settings.showBoxes) {
        this.drawBoundingBox(x, y, w, h, color);
      }

      // 3. Draw Centroid Target
      this.drawCentroid(track.centroid, color);

      // 4. Draw Label Badge with Class, Confidence & Tracking ID
      if (this.settings.showLabels || this.settings.showTrackingId || this.settings.showConfidence) {
        this.drawBadge(x, y, className, score, id, color);
      }
    }
  }

  /**
   * Draw motion trajectory line from past centroids
   */
  drawTrajectory(history, color) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(history[0].x, history[0].y);

    for (let i = 1; i < history.length; i++) {
      ctx.lineTo(history[i].x, history[i].y);
    }

    ctx.strokeStyle = color.primary;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 4]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.65;
    ctx.stroke();

    // Draw small pulse circles along the path
    for (let i = 0; i < history.length; i += 5) {
      const alpha = (i + 1) / history.length;
      ctx.beginPath();
      ctx.arc(history[i].x, history[i].y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = color.primary;
      ctx.globalAlpha = alpha * 0.7;
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Draw modern bounding box with cyber-bracket accents
   */
  drawBoundingBox(x, y, w, h, color) {
    const ctx = this.ctx;
    ctx.save();

    // Soft tinted inner fill
    ctx.fillStyle = color.bg;
    ctx.fillRect(x, y, w, h);

    // Outer glow bounding stroke
    ctx.strokeStyle = color.primary;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Decorative corner brackets for high-tech HUD aesthetic
    const bracketSize = Math.min(16, Math.min(w, h) / 3);
    ctx.lineWidth = 4;
    ctx.strokeStyle = color.primary;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(x, y + bracketSize);
    ctx.lineTo(x, y);
    ctx.lineTo(x + bracketSize, y);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(x + w - bracketSize, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + bracketSize);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(x, y + h - bracketSize);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + bracketSize, y + h);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(x + w - bracketSize, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - bracketSize);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw small center crosshair / centroid dot
   */
  drawCentroid(centroid, color) {
    if (!centroid) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(centroid.x, centroid.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = color.primary;
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.restore();
  }

  /**
   * Draw floating information badge displaying Class, Confidence and Tracking ID
   */
  drawBadge(x, y, className, score, id, color) {
    const ctx = this.ctx;
    ctx.save();

    // Build badge string based on active user toggles
    const parts = [];
    if (this.settings.showTrackingId) parts.push(`ID:#${id}`);
    if (this.settings.showLabels) parts.push(className.toUpperCase());
    if (this.settings.showConfidence) parts.push(`${Math.round(score * 100)}%`);

    if (parts.length === 0) {
      ctx.restore();
      return;
    }

    const text = parts.join(' • ');

    ctx.font = '600 12px "JetBrains Mono", Inter, monospace';
    const textMetrics = ctx.measureText(text);
    const paddingX = 8;
    const paddingY = 4;
    const badgeHeight = 22;
    const badgeWidth = textMetrics.width + (paddingX * 2);

    // Position badge above bounding box (or inside if too close to ceiling)
    let badgeY = y - badgeHeight - 4;
    if (badgeY < 4) {
      badgeY = y + 4;
    }

    // Badge Background Pill
    ctx.fillStyle = 'rgba(9, 13, 22, 0.88)';
    ctx.strokeStyle = color.primary;
    ctx.lineWidth = 1.5;

    this.roundRect(ctx, x, badgeY, badgeWidth, badgeHeight, 5, true, true);

    // Text Label
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + paddingX, badgeY + (badgeHeight / 2));

    ctx.restore();
  }

  /**
   * Helper to draw rounded rectangle
   */
  roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }
}

// Export for browser window
window.Visualizer = Visualizer;
