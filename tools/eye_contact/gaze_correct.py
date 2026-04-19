#!/usr/bin/env python3
"""
Eye contact correction via MediaPipe face mesh + pyvirtualcam.
Warps eye regions toward camera centre for a more natural gaze on video calls.

CORRECTION_STRENGTH: 0.0 = no correction, 1.0 = full redirect.
Recommended: 0.25 – 0.4
"""

import sys
import time
import signal
import subprocess

CORRECTION_STRENGTH = 0.3   # ← adjust here

# ── Dependency check ─────────────────────────────────────────────────────────

def install(pkg):
    subprocess.check_call([sys.executable, "-m", "pip", "install", pkg, "--break-system-packages", "-q"])

for pkg in ["opencv-python", "mediapipe", "pyvirtualcam", "numpy"]:
    try:
        __import__(pkg.replace("-", "_").split(".")[0])
    except ImportError:
        print(f"Installing {pkg}...")
        install(pkg)

import cv2
import numpy as np
import mediapipe as mp

# ── Virtual webcam check ──────────────────────────────────────────────────────

def setup_virtual_cam():
    try:
        result = subprocess.run(
            ["sudo", "modprobe", "v4l2loopback",
             "devices=1", "video_nr=10",
             "card_label=GazeCorrect", "exclusive_caps=1"],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            print("[OK] v4l2loopback loaded → /dev/video10 (GazeCorrect)")
            return True
        else:
            raise RuntimeError(result.stderr.strip())
    except Exception as e:
        print(f"[WARN] v4l2loopback unavailable: {e}")
        print("[INFO] Alternative: use OBS Virtual Camera with the 'Video Capture Device' source")
        print("       pointing at your physical webcam, then add the 'Distort' filter.")
        return False

# ── Eye landmark indices (MediaPipe 468-point mesh) ───────────────────────────
# Left eye centre ~133, right eye centre ~362
LEFT_IRIS_CENTRE  = 468   # added by MediaPipe refine_landmarks
RIGHT_IRIS_CENTRE = 473

LEFT_EYE_CORNER_INNER  = 133
LEFT_EYE_CORNER_OUTER  = 33
RIGHT_EYE_CORNER_INNER = 362
RIGHT_EYE_CORNER_OUTER = 263

# ── Warp helpers ──────────────────────────────────────────────────────────────

def get_landmark_px(landmarks, idx, w, h):
    lm = landmarks[idx]
    return np.array([lm.x * w, lm.y * h], dtype=np.float32)


def warp_eye_region(frame, eye_centre, target, radius=28, strength=CORRECTION_STRENGTH):
    """Applies a radial warp to push pixels near eye_centre toward target."""
    if strength == 0:
        return frame

    h, w = frame.shape[:2]
    out = frame.copy()

    # Create mesh grid around eye
    cx, cy   = int(eye_centre[0]), int(eye_centre[1])
    tx, ty   = target
    dx, dy   = (tx - cx) * strength, (ty - cy) * strength

    x1, x2   = max(0, cx - radius), min(w, cx + radius)
    y1, y2   = max(0, cy - radius), min(h, cy + radius)

    for y in range(y1, y2):
        for x in range(x1, x2):
            dist = np.hypot(x - cx, y - cy)
            if dist >= radius:
                continue
            falloff = (1 - (dist / radius)) ** 2
            sx = int(x - dx * falloff)
            sy = int(y - dy * falloff)
            if 0 <= sx < w and 0 <= sy < h:
                out[y, x] = frame[sy, sx]

    return out


def warp_eye_region_fast(frame, eye_centre, target, radius=32, strength=CORRECTION_STRENGTH):
    """Vectorised version using remap — much faster than the pixel loop."""
    if strength == 0:
        return frame

    h, w   = frame.shape[:2]
    cx, cy = float(eye_centre[0]), float(eye_centre[1])
    tx, ty = float(target[0]),     float(target[1])
    dx, dy = (tx - cx) * strength, (ty - cy) * strength

    # Build inverse remap only in ROI
    x1, x2 = max(0, int(cx - radius)), min(w, int(cx + radius + 1))
    y1, y2 = max(0, int(cy - radius)), min(h, int(cy + radius + 1))

    ys, xs = np.mgrid[y1:y2, x1:x2]
    dist   = np.hypot(xs - cx, ys - cy)
    mask   = dist < radius
    falloff = np.where(mask, (1 - dist / radius) ** 2, 0).astype(np.float32)

    map_x  = (xs - dx * falloff).astype(np.float32)
    map_y  = (ys - dy * falloff).astype(np.float32)

    roi_src = cv2.remap(frame[y1:y2, x1:x2],
                        map_x - x1, map_y - y1,
                        interpolation=cv2.INTER_LINEAR,
                        borderMode=cv2.BORDER_REFLECT)

    out = frame.copy()
    out[y1:y2, x1:x2] = roi_src
    return out


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    has_vcam = setup_virtual_cam()

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        sys.exit("[ERROR] Cannot open webcam (device 0)")

    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    cap.set(cv2.CAP_PROP_FPS, 30)

    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    cam_centre = np.array([W / 2, H / 2], dtype=np.float32)

    print(f"[INFO] Camera: {W}×{H}")
    print(f"[INFO] Correction strength: {CORRECTION_STRENGTH}")
    print(f"[INFO] Press Ctrl+C to quit\n")

    mp_face = mp.solutions.face_mesh
    face_mesh = mp_face.FaceMesh(
        max_num_faces=1,
        refine_landmarks=True,   # enables iris landmarks 468-477
        min_detection_confidence=0.6,
        min_tracking_confidence=0.5,
    )

    vcam = None
    if has_vcam:
        try:
            import pyvirtualcam
            vcam = pyvirtualcam.Camera(width=W, height=H, fps=30, device='/dev/video10')
            print(f"[OK] Virtual cam active: {vcam.device}")
        except Exception as e:
            print(f"[WARN] pyvirtualcam failed: {e} — showing preview window only")

    fps_tracker = time.time()
    frame_count = 0
    running     = True

    def on_sigint(sig, frame):
        nonlocal running
        running = False
    signal.signal(signal.SIGINT, on_sigint)

    while running:
        ok, frame = cap.read()
        if not ok:
            continue

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = face_mesh.process(rgb)

        gaze_offset   = np.array([0.0, 0.0])
        correction_px = np.array([0.0, 0.0])
        output = frame.copy()

        if result.multi_face_landmarks:
            lm = result.multi_face_landmarks[0].landmark

            try:
                l_iris = get_landmark_px(lm, LEFT_IRIS_CENTRE,  W, H)
                r_iris = get_landmark_px(lm, RIGHT_IRIS_CENTRE, W, H)
            except IndexError:
                # Iris landmarks not available — fall back to corner midpoints
                l_inner = get_landmark_px(lm, LEFT_EYE_CORNER_INNER,  W, H)
                l_outer = get_landmark_px(lm, LEFT_EYE_CORNER_OUTER,  W, H)
                r_inner = get_landmark_px(lm, RIGHT_EYE_CORNER_INNER, W, H)
                r_outer = get_landmark_px(lm, RIGHT_EYE_CORNER_OUTER, W, H)
                l_iris  = (l_inner + l_outer) / 2
                r_iris  = (r_inner + r_outer) / 2

            eyes_centre = (l_iris + r_iris) / 2
            gaze_offset = eyes_centre - cam_centre
            correction_px = -gaze_offset * CORRECTION_STRENGTH

            output = warp_eye_region_fast(output, l_iris, cam_centre + (cam_centre - l_iris) * CORRECTION_STRENGTH * 0.6)
            output = warp_eye_region_fast(output, r_iris, cam_centre + (cam_centre - r_iris) * CORRECTION_STRENGTH * 0.6)

        # FPS counter
        frame_count += 1
        now = time.time()
        elapsed = now - fps_tracker
        if elapsed >= 1.0:
            fps = frame_count / elapsed
            print(
                f"\r  gaze_offset=({gaze_offset[0]:+.0f}, {gaze_offset[1]:+.0f})px  "
                f"correction=({correction_px[0]:+.0f}, {correction_px[1]:+.0f})px  "
                f"FPS={fps:.1f}   ",
                end="", flush=True
            )
            frame_count = 0
            fps_tracker = now

        if vcam:
            rgb_out = cv2.cvtColor(output, cv2.COLOR_BGR2RGB)
            vcam.send(rgb_out)
            vcam.sleep_until_next_frame()
        else:
            cv2.imshow("GazeCorrect (preview)", output)
            if cv2.waitKey(1) == 27:   # ESC
                break

    print("\n[INFO] Shutting down...")
    cap.release()
    face_mesh.close()
    if vcam:
        vcam.close()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
