"""
Face-tracked "Window Beyond the Screen" — TouchDesigner network builder.

Usage:
  1. Open TouchDesigner, open the Textport (Alt+T).
  2. Paste/run this script (or place it in a Text DAT and run via op('text1').run()).
  3. It builds a full network under a new base COMP called /facewindow.

Concept:
  - A 'mediapipefacemesh' CHOP (TD's built-in face tracking, no plugins needed)
    reads your webcam and outputs face position (x, y, z / nose landmark or
    bounding box center).
  - That position drives the camera (or a render TOP's transform) inside a
    render network, creating parallax: when you move your head right, the
    virtual camera shifts left and rotates, as if the screen were a real
    window into a 3D scene behind it.
  - A Composite/Level TOP applies a vignette + frame overlay to sell the
    "glass" effect.

Requires: TouchDesigner 2022.30000+ (for the built-in Face Mesh CHOP / MediaPipe).
"""

import td

ROOT = op('/')

# Clean up any previous run
existing = op('/facewindow')
if existing:
    existing.destroy()

base = ROOT.create(baseCOMP, 'facewindow')
base.par.w = 1920
base.par.h = 1080
base.nodeX, base.nodeY = 0, 0

# ---------------------------------------------------------------
# 1. Webcam input
# ---------------------------------------------------------------
cam_in = base.create(videodeviceinTOP, 'webcam')
cam_in.nodeX, cam_in.nodeY = -800, 400
cam_in.par.resolutionw = 1280
cam_in.par.resolutionh = 720

# ---------------------------------------------------------------
# 2. Face tracking CHOP (MediaPipe Face Mesh, built into TD)
# ---------------------------------------------------------------
face_chop = base.create(mediapipefacemeshCHOP, 'facemesh1')
face_chop.nodeX, face_chop.nodeY = -800, 200
face_chop.par.top = cam_in.path
face_chop.par.active = True
# Output normalized landmark positions; landmark 1 = nose tip
try:
    face_chop.par.outputlandmarks = True
except Exception:
    pass

# ---------------------------------------------------------------
# 3. Select / smooth the nose landmark -> use as head position proxy
# ---------------------------------------------------------------
select_chop = base.create(selectCHOP, 'select_nose')
select_chop.nodeX, select_chop.nodeY = -600, 200
select_chop.par.chop = face_chop.path
# nose tip landmark index ~1 in mediapipe face mesh (468 landmarks);
# channel names typically "p1x" "p1y" "p1z" - adjust to match your TD build
select_chop.par.channames = 'p1x p1y p1z'

filter_chop = base.create(filterCHOP, 'smooth_head')
filter_chop.nodeX, filter_chop.nodeY = -600, 100
filter_chop.par.chop = select_chop.path
filter_chop.par.width = 8  # smoothing window
filter_chop.par.type = 'box'

# Remap normalized 0..1 to a -1..1 "head offset" signal
math_chop = base.create(mathCHOP, 'head_offset')
math_chop.nodeX, math_chop.nodeY = -600, 0
math_chop.par.chop = filter_chop.path
math_chop.par.fromrange1, math_chop.par.fromrange2 = 0, 1
math_chop.par.torange1, math_chop.par.torange2 = -1, 1

# ---------------------------------------------------------------
# 4. 3D scene: geo "world" behind the screen + camera that reacts to head
# ---------------------------------------------------------------
geo1 = base.create(geometryCOMP, 'scene_world')
geo1.nodeX, geo1.nodeY = -200, 400
geo1.par.scale = 4
geo1.par.tz = -2

geo2 = base.create(geometryCOMP, 'scene_orb1')
geo2.nodeX, geo2.nodeY = -200, 250
geo2.par.tx = 1.2
geo2.par.ty = 0.5
geo2.par.tz = -1.0
geo2.par.scale = 0.4

geo3 = base.create(geometryCOMP, 'scene_orb2')
geo3.nodeX, geo3.nodeY = -200, 100
geo3.par.tx = -1.0
geo3.par.ty = -0.6
geo3.par.tz = -2.5
geo3.par.scale = 0.7

cam1 = base.create(cameraCOMP, 'parallax_cam')
cam1.nodeX, cam1.nodeY = -200, 550
cam1.par.tz = 4

# Expressions: head moves right (positive x) -> camera shifts opposite
# (left/negative) and rotates to look "around" the frame edge.
cam1.par.tx.expr = f"-op('{math_chop.path}')['p1x'] * 1.5"
cam1.par.ty.expr = f"op('{math_chop.path}')['p1y'] * 1.0"
cam1.par.rx.expr = f"op('{math_chop.path}')['p1y'] * 8"
cam1.par.ry.expr = f"-op('{math_chop.path}')['p1x'] * 12"

light1 = base.create(lightCOMP, 'light1')
light1.nodeX, light1.nodeY = -200, 700
light1.par.tx, light1.par.ty, light1.par.tz = 0, 2, 3

# ---------------------------------------------------------------
# 5. Render
# ---------------------------------------------------------------
render1 = base.create(renderTOP, 'render1')
render1.nodeX, render1.nodeY = 100, 400
render1.par.camera = cam1.path
render1.par.lights = light1.path
render1.par.geometry = f"{geo1.path} {geo2.path} {geo3.path}"
render1.par.resolutionw = 1920
render1.par.resolutionh = 1080

# ---------------------------------------------------------------
# 6. Frame/vignette overlay to sell the "window" illusion
# ---------------------------------------------------------------
ramp1 = base.create(rampTOP, 'vignette_ramp')
ramp1.nodeX, ramp1.nodeY = 100, 200
ramp1.par.type = 'radial'
ramp1.par.resolutionw = 1920
ramp1.par.resolutionh = 1080

level1 = base.create(levelTOP, 'vignette_level')
level1.nodeX, level1.nodeY = 100, 100
level1.par.top = ramp1.path
level1.par.invert = True

comp1 = base.create(compositeTOP, 'composite_out')
comp1.nodeX, comp1.nodeY = 350, 300
comp1.par.operand = 'multiply'
comp1.inputConnectors[0].connect(render1)
comp1.inputConnectors[1].connect(level1)

out1 = base.create(outTOP, 'out1')
out1.nodeX, out1.nodeY = 550, 300
out1.inputConnectors[0].connect(comp1)

print("facewindow network created. Check /facewindow.out1 for the final composite.")
print("If 'mediapipefacemeshCHOP' is not found, update TouchDesigner to a build that includes the Face Mesh CHOP, or substitute a Kinect/Realsense Face CHOP / Azure Kinect Body Tracking instead.")
