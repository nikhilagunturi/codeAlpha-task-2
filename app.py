import os
import streamlit as st
import streamlit.components.v1 as components

# Configure Streamlit Page
st.set_page_config(
    page_title="VisionTrack AI - Real-Time Object Detection & Tracking",
    page_icon="🎯",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS to hide default Streamlit padding and header clutter
st.markdown("""
<style>
    /* Remove default Streamlit top padding and margins */
    .block-container {
        padding-top: 0.5rem !important;
        padding-bottom: 0rem !important;
        padding-left: 0.5rem !important;
        padding-right: 0.5rem !important;
        max-width: 100% !important;
    }
    header[data-testid="stHeader"] {
        background-color: transparent !important;
        z-index: 1;
    }
    footer {
        display: none !important;
    }
    #MainMenu {
        visibility: hidden;
    }
</style>
""", unsafe_allow_html=True)

# Sidebar with Information & Controls
with st.sidebar:
    st.title("🎯 VisionTrack AI")
    st.markdown("**CodeAlpha Internship &bull; Task 2**")
    st.markdown("Real-time Object Detection and Tracking using browser-accelerated WebGL neural inference.")
    
    st.divider()
    st.subheader("💡 Deployment Notes")
    st.info(
        "**Real-time Video Processing:**\n"
        "- **Upload Video:** Works 100% inside this Streamlit page (supports MP4, WebM).\n"
        "- **Live Webcam:** Works best on secure origins (HTTPS or localhost). If your browser blocks camera inside the Streamlit iframe sandbox, use the standalone link or local server."
    )
    
    st.divider()
    st.subheader("🛠️ Model Architecture")
    st.caption("- **Detection Engine:** TensorFlow.js COCO-SSD (80 standard COCO classes, YOLO compatible)")
    st.caption("- **Tracking Engine:** IoU (Intersection-over-Union) + Centroid Association with unique persistent IDs")
    st.caption("- **Hardware Acceleration:** WebGL Shader Pipeline")

def load_bundled_app():
    """
    Reads index.html and injects CSS and JavaScript directly inline
    so the app runs self-contained inside Streamlit Cloud with zero missing asset errors.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    index_path = os.path.join(base_dir, "index.html")
    css_path = os.path.join(base_dir, "css", "style.css")
    tracker_js = os.path.join(base_dir, "js", "tracker.js")
    detector_js = os.path.join(base_dir, "js", "detector.js")
    visualizer_js = os.path.join(base_dir, "js", "visualizer.js")
    app_js = os.path.join(base_dir, "js", "app.js")

    with open(index_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    # Read CSS and inline it
    if os.path.exists(css_path):
        with open(css_path, "r", encoding="utf-8") as f:
            css_content = f.read()
        html_content = html_content.replace(
            '<link rel="stylesheet" href="css/style.css">',
            f'<style>\n{css_content}\n</style>'
        )

    # Read JS files and inline them
    scripts_bundle = ""
    for js_file in [tracker_js, detector_js, visualizer_js, app_js]:
        if os.path.exists(js_file):
            with open(js_file, "r", encoding="utf-8") as f:
                scripts_bundle += f"\n// --- {os.path.basename(js_file)} ---\n" + f.read() + "\n"

    # Replace external local script tags with inline bundle
    local_script_tags = """  <!-- Application Logic Modules -->
  <script src="js/tracker.js"></script>
  <script src="js/detector.js"></script>
  <script src="js/visualizer.js"></script>
  <script src="js/app.js"></script>"""

    if local_script_tags in html_content:
        html_content = html_content.replace(
            local_script_tags,
            f"<script>\n{scripts_bundle}\n</script>"
        )
    else:
        # Fallback replacement if whitespace differs
        html_content = html_content.replace(
            '<script src="js/tracker.js"></script>',
            f"<script>\n{scripts_bundle}\n</script>"
        )
        html_content = html_content.replace('<script src="js/detector.js"></script>', '')
        html_content = html_content.replace('<script src="js/visualizer.js"></script>', '')
        html_content = html_content.replace('<script src="js/app.js"></script>', '')

    return html_content

# Render the bundled VisionTrack AI app inside Streamlit
app_html = load_bundled_app()
components.html(app_html, height=1020, scrolling=True)
