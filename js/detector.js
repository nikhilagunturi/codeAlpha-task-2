/**
 * ObjectDetector
 * Browser-based real-time object detection engine.
 * Powered by TensorFlow.js and COCO-SSD (80 standard COCO classes, identical to standard YOLO models).
 * Supports GPU WebGL hardware acceleration.
 * 
 * Part of CodeAlpha Task 2: Object Detection and Tracking
 */

class ObjectDetector {
  constructor() {
    this.model = null;
    this.isLoading = false;
    this.isReady = false;
    this.lastInferenceTime = 0;

    // Standard 80 COCO dataset classes (matching YOLOv5 / YOLOv8 class dictionary)
    this.cocoClasses = [
      'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
      'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
      'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
      'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
      'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
      'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
      'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake',
      'chair', 'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop',
      'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink',
      'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
    ];
  }

  /**
   * Initialize and warm up the neural network
   * @param {Function} onProgress - Optional callback for status messages
   */
  async init(onProgress = () => {}) {
    if (this.isReady) return true;
    if (this.isLoading) return false;

    this.isLoading = true;
    onProgress('Setting up WebGL acceleration...');

    try {
      // Set WebGL backend for GPU acceleration if available
      if (window.tf) {
        await tf.ready();
        if (tf.getBackend() !== 'webgl') {
          await tf.setBackend('webgl').catch(() => {
            console.warn('WebGL not supported, falling back to CPU');
          });
        }
      }

      onProgress('Loading YOLO-compatible COCO-SSD Neural Network...');

      if (!window.cocoSsd) {
        throw new Error('COCO-SSD script library is not loaded from CDN.');
      }

      // Load model with lightweight, real-time MobileNetV2 base
      this.model = await cocoSsd.load({
        base: 'mobilenet_v2'
      });

      this.isReady = true;
      this.isLoading = false;
      onProgress('Model loaded and ready for real-time inference');
      return true;
    } catch (err) {
      this.isLoading = false;
      this.isReady = false;
      console.error('Failed to initialize ObjectDetector:', err);
      throw err;
    }
  }

  /**
   * Run object detection on an image or video frame
   * @param {HTMLVideoElement|HTMLCanvasElement|HTMLImageElement} inputElement
   * @param {number} minConfidence - Minimum confidence score (0 to 1)
   * @returns {Promise<Array>} Array of detections: [{ bbox: [x,y,w,h], class: string, score: number }]
   */
  async detect(inputElement, minConfidence = 0.5) {
    if (!this.isReady || !this.model || !inputElement) {
      return [];
    }

    const startTime = performance.now();

    try {
      // Run detection
      // coco-ssd returns: [{ bbox: [x, y, width, height], class: string, score: number }, ...]
      const rawPredictions = await this.model.detect(inputElement, 20, minConfidence);

      this.lastInferenceTime = Math.round(performance.now() - startTime);

      // Filter and sanitize predictions
      const filtered = rawPredictions
        .filter(pred => pred.score >= minConfidence && pred.bbox && pred.bbox.length === 4)
        .map(pred => ({
          bbox: [
            Math.max(0, pred.bbox[0]),
            Math.max(0, pred.bbox[1]),
            Math.max(1, pred.bbox[2]),
            Math.max(1, pred.bbox[3])
          ],
          class: pred.class.toLowerCase(),
          score: pred.score
        }));

      return filtered;
    } catch (err) {
      console.error('Inference error during detect():', err);
      return [];
    }
  }

  getInferenceTime() {
    return this.lastInferenceTime;
  }
}

// Export for browser window
window.ObjectDetector = ObjectDetector;
