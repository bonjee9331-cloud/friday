# GazeCorrect — Eye Contact Correction

Redirects your gaze toward the camera in real time using MediaPipe face mesh + a
radial warp. Output is piped to a virtual webcam so Zoom and Teams see it as a
normal camera source.

---

## Quick Start

### Windows (double-click)
```
tools/eye_contact/start-gaze.bat
```

### WSL / Linux terminal
```bash
python3 /mnt/c/Users/Ben/friday/tools/eye_contact/gaze_correct.py
```

---

## Dependencies

The script installs them automatically on first run:
```
pip install opencv-python mediapipe pyvirtualcam numpy --break-system-packages
```

---

## Virtual Webcam Setup (Linux / WSL)

The script tries to load `v4l2loopback` automatically:
```bash
sudo modprobe v4l2loopback devices=1 video_nr=10 card_label="GazeCorrect" exclusive_caps=1
```

If this succeeds, the corrected feed appears as `/dev/video10 — GazeCorrect`.

### If v4l2loopback fails (common on WSL without a custom kernel)

Use **OBS Studio** instead:

1. Install OBS: https://obsproject.com
2. Add a **Video Capture Device** source → select your webcam
3. Add a **Distort / Transform** filter to nudge the eye region manually  
   (less automatic but works on any Windows machine)
4. Enable **OBS Virtual Camera** (Tools → Virtual Camera → Start)
5. Select **OBS Virtual Camera** in Zoom / Teams

---

## Selecting GazeCorrect as your camera

**Zoom:** Settings → Video → Camera → select **GazeCorrect** (or OBS Virtual Camera)

**Microsoft Teams:** Settings → Devices → Camera → select **GazeCorrect**

**Google Meet:** Click the three-dot menu → Settings → Video → select the camera

---

## Adjusting Correction Strength

Open `gaze_correct.py` and change line 17:

```python
CORRECTION_STRENGTH = 0.3   # ← default
```

| Value | Effect |
|-------|--------|
| `0.0` | No correction — pass-through only |
| `0.2` | Subtle — barely noticeable, very natural |
| `0.3` | Balanced — recommended starting point |
| `0.5` | Strong — eyes visibly redirected |
| `0.8` | Aggressive — may look unnatural |

Start at `0.3` and adjust to taste. Values above `0.5` can cause artefacts if you
move quickly.

---

## Console Output

While running you'll see:
```
  gaze_offset=(+42, -18)px  correction=(-12, +5)px  FPS=28.4
```

- **gaze_offset** — how far your iris centre is from the camera centre  
- **correction** — how many pixels the warp is shifting your eyes  
- **FPS** — processing frame rate (target ≥ 25fps)

---

## Known Limitations

- **WSL cameras**: WSL2 does not natively expose USB webcams. You need either
  [usbipd-win](https://github.com/dorssel/usbipd-win) to pass the USB device
  through, or run the script directly in Windows Python.

- **v4l2loopback on WSL**: Requires a custom kernel build. Most users should use
  OBS Virtual Camera instead.

- **Performance**: The warp runs on CPU. On slow machines, FPS may drop below 20.
  Reduce `CORRECTION_STRENGTH` or lower camera resolution in the script
  (`CAP_PROP_FRAME_WIDTH/HEIGHT`) to improve performance.

- **Strong head movement**: The correction is tuned for normal head-down reading
  posture. Large head angles (>30°) may produce visible warping artefacts — reduce
  `CORRECTION_STRENGTH` to `0.15` in those cases.

- **Glasses**: Works well with normal glasses. Heavy anti-reflective coating can
  confuse the iris landmark detector — fall back to `refine_landmarks=False` in
  the script if tracking is unstable.

---

## Stopping

Press `Ctrl+C` in the terminal. The script cleans up the virtual cam device
and releases the webcam gracefully.
