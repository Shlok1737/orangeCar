import json
import base64
from io import BytesIO
from PIL import Image, ImageDraw
import numpy as np
import os

# Load refined base sprite
base_img = Image.open('assets/sprites/ref_cat_clean.png').convert('RGBA')
base = np.array(base_img)
H, W = base.shape[:2] # 33, 41

OUTLINE = np.array([42, 32, 56, 255], dtype=np.uint8)
BASE_FUR = np.array([239, 140, 52, 255], dtype=np.uint8)
STRIPE = np.array([186, 76, 24, 255], dtype=np.uint8)
SHADE = np.array([204, 102, 38, 255], dtype=np.uint8)
CREAM = np.array([251, 230, 198, 255], dtype=np.uint8)
INNER_EAR = np.array([244, 162, 132, 255], dtype=np.uint8)
NOSE = np.array([168, 80, 58, 255], dtype=np.uint8)
WHITE = np.array([255, 255, 255, 255], dtype=np.uint8)
HEART_RED = np.array([255, 51, 102, 255], dtype=np.uint8)
HEART_PINK = np.array([255, 170, 192, 255], dtype=np.uint8)
ZZZ_BLUE = np.array([136, 176, 235, 255], dtype=np.uint8)
GLOOM_BLUE = np.array([90, 200, 250, 255], dtype=np.uint8)
STAR_GOLD = np.array([255, 215, 0, 255], dtype=np.uint8)
TRANS = np.array([0, 0, 0, 0], dtype=np.uint8)

def to_data_url(img):
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buffered.getvalue()).decode()

sprites_dict = {}

# -------------------------------------------------------------
# 1. IDLE (4 frames)
# Frame 0: Base stand
# Frame 1: Breath rise (body up 1px), tail flicks
# Frame 2: Cute slow blink
# Frame 3: Settle down, tail tip wag
# -------------------------------------------------------------
idle_frames = []
# Frame 0: Base
f0 = base.copy()
idle_frames.append(f0)

# Frame 1: Breath (torso & head shifted up 1px)
f1 = np.zeros_like(base)
f1[0:32, :] = base[1:33, :] # shifted up 1px
# restore feet on floor
f1[30:33, :] = base[30:33, :]
# tail tip wag right
f1[3:8, 2:8] = np.roll(base[3:8, 2:8], 1, axis=1)
idle_frames.append(f1)

# Frame 2: Blink
f2 = base.copy()
# Close eyes to cute curved lines
f2[9:13, 30:32] = CREAM # cheek/fur
f2[9:13, 35:37] = CREAM
f2[11, 29:32] = OUTLINE # closed eye line
f2[11, 35:38] = OUTLINE
idle_frames.append(f2)

# Frame 3: Tail wag left
f3 = base.copy()
f3[3:8, 1:7] = np.roll(base[3:8, 1:7], -1, axis=1)
idle_frames.append(f3)

sprites_dict['idle'] = idle_frames

# -------------------------------------------------------------
# 2. WALK (6 frames)
# 4-legged quadruped trot cycle
# Front legs: col 25-29, 31-35
# Back legs: col 9-13, 14-18
# -------------------------------------------------------------
walk_frames = []
leg_shifts = [
    # (front_right, front_left, back_right, back_left, bob, tail_wag)
    (0, -2, -2, 1, 0, 0),
    (1, -1, -1, 2, -1, -1),
    (2, 0, 0, -1, 0, -1),
    (0, 2, 2, -2, 0, 0),
    (-1, 1, 1, -1, -1, 1),
    (-2, 0, 0, 1, 0, 1),
]

for fr, fl, br, bl, bob, tw in leg_shifts:
    fw = np.zeros_like(base)
    # Apply vertical bob to upper body
    if bob == -1:
        fw[0:32, :] = base[1:33, :]
        fw[31:33, :] = base[31:33, :]
    else:
        fw = base.copy()

    # Back legs (row 23 to 32)
    # Clear existing feet
    fw[24:33, 8:20] = TRANS

    # Draw back-left leg (behind, bl)
    for r in range(24, 32):
        for c in range(14, 18):
            nc = c + bl
            if 0 <= nc < W:
                fw[r, nc] = SHADE
    fw[32, 14+bl:17+bl] = OUTLINE

    # Draw back-right leg (front, br)
    for r in range(24, 32):
        for c in range(9, 14):
            nc = c + br
            if 0 <= nc < W:
                fw[r, nc] = BASE_FUR
    fw[32, 9+br:13+br] = OUTLINE
    fw[31, 11+br] = OUTLINE # toe slit

    # Clear existing front feet
    fw[24:33, 24:37] = TRANS

    # Draw front-left leg (behind, fl)
    for r in range(24, 32):
        for c in range(24, 28):
            nc = c + fl
            if 0 <= nc < W:
                fw[r, nc] = SHADE
    fw[32, 24+fl:28+fl] = OUTLINE

    # Draw front-right leg (front, fr)
    for r in range(24, 32):
        for c in range(28, 33):
            nc = c + fr
            if 0 <= nc < W:
                fw[r, nc] = BASE_FUR
    # White chest patch connects
    fw[24:28, 27+fr] = CREAM
    fw[32, 28+fr:33+fr] = OUTLINE
    fw[31, 30+fr] = OUTLINE # toe slit

    # Tail sway
    if tw != 0:
        fw[2:9, 1:8] = np.roll(fw[2:9, 1:8], tw, axis=1)

    walk_frames.append(fw)

sprites_dict['walk'] = walk_frames

# -------------------------------------------------------------
# 3. SIT (4 frames)
# Elegant upright sitting pose with front paws planted,
# smoothly sloping arched back, folded haunches, and curled tail!
# -------------------------------------------------------------
def make_base_sit():
    sit = np.zeros_like(base)
    # 1. Front half untouched (cols 24-41, all rows 0-33)
    sit[:, 24:W] = base[:, 24:W]

    # 2. Smooth back contour sloping from neck to haunch
    back_contour = {
        10: 24, 11: 23, 12: 21, 13: 19, 14: 17, 15: 16,
        16: 15, 17: 14, 18: 13, 19: 13, 20: 12, 21: 12,
        22: 12, 23: 12, 24: 12, 25: 12, 26: 12, 27: 12,
        28: 12, 29: 12, 30: 12, 31: 12,
    }

    for r, b_col in back_contour.items():
        for c in range(b_col + 1, 25):
            sit[r, c] = BASE_FUR
        sit[r, b_col] = OUTLINE

    # Back stripes
    sit[12, 22:24] = STRIPE
    sit[13, 20:22] = STRIPE
    sit[14, 18:20] = STRIPE
    sit[15, 17:19] = STRIPE
    sit[16:20, 19:21] = STRIPE
    sit[19:24, 15:17] = STRIPE
    sit[23:28, 19:21] = STRIPE
    sit[26:30, 15:17] = STRIPE

    # Haunch shade
    for r in range(25, 32):
        for c in range(13, 20):
            if sit[r, c][0] == BASE_FUR[0]:
                sit[r, c] = SHADE
    sit[32, 12:26] = OUTLINE

    # Curled tail wrapping along floor in front of paws
    sit[25, 11] = OUTLINE
    sit[26, 10:12] = BASE_FUR
    sit[26, 9] = OUTLINE
    sit[27, 9:11] = BASE_FUR
    sit[27, 8] = OUTLINE
    sit[28, 8:10] = STRIPE
    sit[28, 7] = OUTLINE
    sit[29, 7:9] = BASE_FUR
    sit[29, 6] = OUTLINE
    sit[30, 5:26] = OUTLINE
    sit[31, 4:26] = STRIPE
    sit[32, 4:26] = OUTLINE

    # Tail tip curled up in front of paws
    sit[29, 25:27] = BASE_FUR
    sit[29, 27] = OUTLINE
    sit[28, 25:27] = BASE_FUR
    sit[28, 27] = OUTLINE
    sit[27, 25:27] = OUTLINE

    # Solid paw base
    sit[32, 26:36] = base[32, 26:36]
    return sit

sit_f0 = make_base_sit()

# Frame 1: Breath rise (body up 1px), tail tip flick
sit_f1 = sit_f0.copy()
sit_f1[0:22, 20:40] = np.roll(sit_f1[0:22, 20:40], -1, axis=0)
sit_f1[26:29, 25:28] = TRANS
sit_f1[28, 25:27] = BASE_FUR
sit_f1[28, 27] = OUTLINE
sit_f1[27, 26:28] = BASE_FUR
sit_f1[27, 28] = OUTLINE
sit_f1[26, 26:28] = OUTLINE

# Frame 2: Cute slow blink (peaceful eyes)
sit_f2 = sit_f0.copy()
sit_f2[9:13, 30:32] = CREAM
sit_f2[9:13, 35:37] = CREAM
sit_f2[11, 29:32] = OUTLINE
sit_f2[11, 35:38] = OUTLINE

# Frame 3: Ear twitch
sit_f3 = sit_f0.copy()
sit_f3[0:4, 26:30] = np.roll(sit_f3[0:4, 26:30], -1, axis=1)

sit_frames = [sit_f0, sit_f1, sit_f2, sit_f3]
sprites_dict['sit'] = sit_frames

# -------------------------------------------------------------
# 4. SLEEP (4 frames)
# Curled sleeping loaf, closed eyes ^^, breathing, Zzz
# -------------------------------------------------------------
sleep_frames = []
for f in range(4):
    fsl = np.zeros_like(base)
    expand = 1 if f in (1, 2) else 0

    # Curled oval loaf
    # Body
    for r in range(16 - expand, 30):
        for c in range(10, 34):
            fsl[r, c] = BASE_FUR

    # Tabby stripes arching over back
    fsl[17-expand:27, 14:16] = STRIPE
    fsl[16-expand:28, 19:21] = STRIPE
    fsl[18-expand:26, 25:27] = STRIPE

    # Tail wrapped around body
    fsl[24:29, 8:12] = BASE_FUR
    fsl[27:30, 9:20] = STRIPE

    # Nose tucked in paws
    fsl[22, 31:33] = NOSE
    fsl[21:26, 29:35] = CREAM
    fsl[22, 32] = NOSE

    # Sleeping eye: curved ^
    fsl[20, 27:30] = OUTLINE
    fsl[19, 28] = OUTLINE

    # Flattened ear
    fsl[16-expand:20, 23:27] = BASE_FUR
    fsl[17-expand, 24:26] = INNER_EAR

    # Outline contour
    for r in range(16 - expand, 30):
        # find edges
        row_px = np.where(fsl[r, :, 3] > 0)[0]
        if len(row_px) > 0:
            fsl[r, row_px[0]] = OUTLINE
            fsl[r, row_px[-1]] = OUTLINE
    fsl[15 - expand, 14:31] = OUTLINE
    fsl[30, 10:33] = OUTLINE

    # Zzz floating
    zy = 12 - f * 3
    zx = 32 + (1 if f % 2 == 0 else -1)
    if f > 0 and zy >= 1:
        # Draw small Z
        fsl[zy, zx:zx+4] = ZZZ_BLUE
        fsl[zy+1, zx+2] = ZZZ_BLUE
        fsl[zy+2, zx+1] = ZZZ_BLUE
        fsl[zy+3, zx:zx+4] = ZZZ_BLUE

    sleep_frames.append(fsl)

sprites_dict['sleep'] = sleep_frames

# -------------------------------------------------------------
# 5. PURR (4 frames)
# Blissful squint, shiver, floating hearts ♥
# -------------------------------------------------------------
purr_frames = []
for f in range(4):
    fp = base.copy()
    shiver = 1 if f % 2 == 1 else 0

    # Happy squint eyes (^ . ^)
    fp[9:13, 30:32] = CREAM
    fp[9:13, 35:37] = CREAM
    fp[10, 30:32] = OUTLINE
    fp[9, 31] = OUTLINE
    fp[10, 35:37] = OUTLINE
    fp[9, 36] = OUTLINE

    # Pink blush on cheeks
    fp[12, 28:30] = HEART_PINK
    fp[12, 37:39] = HEART_PINK

    # Body shiver
    if shiver:
        fp[10:31, :] = np.roll(fp[10:31, :], 1, axis=1)

    # Floating Heart
    hy = 8 - f * 2
    hx = 33 + (f % 2)
    c_heart = HEART_RED if f < 2 else HEART_PINK
    if hy >= 1:
        fp[hy, hx:hx+2] = c_heart
        fp[hy, hx+3:hx+5] = c_heart
        fp[hy+1, hx-1:hx+6] = c_heart
        fp[hy+2, hx:hx+5] = c_heart
        fp[hy+3, hx+1:hx+4] = c_heart
        fp[hy+4, hx+2] = c_heart

    purr_frames.append(fp)

sprites_dict['purr'] = purr_frames

# -------------------------------------------------------------
# 6. SMACK (4 frames)
# Rears up, swats paw forward with claw swipe streaks
# -------------------------------------------------------------
smack_frames = []
for f in range(4):
    fsm = base.copy()
    if f == 0:
        # Crouch ready
        fsm[10:33, :] = np.roll(fsm[10:33, :], -1, axis=0)
    elif f == 1:
        # Rear up, front paw raised high
        fsm[5:28, :] = np.roll(fsm[5:28, :], -3, axis=0)
        # Raise right paw
        fsm[10:16, 32:36] = BASE_FUR
        fsm[9:12, 34:37] = OUTLINE
    elif f == 2:
        # SWIPE FORWARD! Slash arc
        # Right paw extended
        fsm[13:17, 33:40] = BASE_FUR
        fsm[16, 37:41] = OUTLINE
        # Claw streaks (///)
        fsm[10, 38] = WHITE
        fsm[11, 39] = WHITE
        fsm[12, 40] = WHITE
        fsm[13, 38] = WHITE
        fsm[14, 39] = WHITE
        fsm[15, 40] = WHITE
    else:
        # Recovery
        pass
    smack_frames.append(fsm)

sprites_dict['smack'] = smack_frames

# -------------------------------------------------------------
# 7. DANCE (6 frames)
# Upright dance, swaying side to side, paws alternating
# -------------------------------------------------------------
dance_frames = []
for f in range(6):
    fd = base.copy()
    hop = -2 if f in (1, 4) else 0
    sway = 1 if f % 2 == 0 else -1

    if hop != 0:
        fd[0:30, :] = np.roll(fd[0:30, :], hop, axis=0)

    # Sway head
    fd[0:18, :] = np.roll(fd[0:18, :], sway, axis=1)

    # Alternate paws raised
    if f % 2 == 0:
        fd[16+hop:22+hop, 32] = CREAM
    else:
        fd[16+hop:22+hop, 27] = CREAM

    dance_frames.append(fd)

sprites_dict['dance'] = dance_frames

# -------------------------------------------------------------
# 8. SULK (4 frames)
# Cat turned away showing back coat stripes, ears drooping, gloom mark
# -------------------------------------------------------------
sulk_frames = []
for f in range(4):
    fsk = np.zeros_like(base)
    # Back view
    # Body
    fsk[12:30, 10:30] = BASE_FUR
    # Back dorsal stripe & ribs
    fsk[12:28, 19:21] = STRIPE
    fsk[15:25, 14:17] = STRIPE
    fsk[15:25, 23:26] = STRIPE
    # Outline
    for r in range(12, 30):
        cols = np.where(fsk[r, :, 3] > 0)[0]
        if len(cols) > 0:
            fsk[r, cols[0]] = OUTLINE
            fsk[r, cols[-1]] = OUTLINE
    fsk[11, 13:28] = OUTLINE
    fsk[30, 12:29] = OUTLINE

    # Flattened airplane ears
    fsk[10, 8:13] = OUTLINE
    fsk[10, 27:32] = OUTLINE
    fsk[11, 9:13] = BASE_FUR
    fsk[11, 27:31] = BASE_FUR

    # Tail drooping flat on floor
    fsk[29, 4:12] = STRIPE
    fsk[30, 4:12] = OUTLINE

    # Gloom mark
    if f % 2 == 0:
        fsk[4, 30:33] = GLOOM_BLUE
        fsk[5, 31:34] = GLOOM_BLUE
        fsk[6, 32] = GLOOM_BLUE

    sulk_frames.append(fsk)

sprites_dict['sulk'] = sulk_frames

# -------------------------------------------------------------
# 9. ZOOMIES (4 frames)
# Low-flying rocket sprint, airplane ears, dust trails
# -------------------------------------------------------------
zoom_frames = []
for f in range(4):
    fz = np.zeros_like(base)
    # Stretched low body (row 18 to 28)
    fz[18:27, 8:36] = BASE_FUR
    # Stripes
    fz[19:26, 14:16] = STRIPE
    fz[19:26, 20:22] = STRIPE
    fz[19:26, 26:28] = STRIPE
    # Low head with airplane ears
    fz[16:24, 30:40] = BASE_FUR
    fz[19:23, 34:39] = CREAM
    fz[18, 33:36] = OUTLINE # slit eyes
    fz[16, 28:33] = BASE_FUR # flat ears
    fz[15, 27:32] = OUTLINE
    # Horizontal tail streaming back
    fz[19:21, 1:9] = STRIPE
    fz[21, 1:9] = OUTLINE
    fz[18, 1:9] = OUTLINE

    # Galloping legs
    if f % 2 == 0:
        fz[27:31, 6:10] = BASE_FUR
        fz[27:31, 33:37] = BASE_FUR
    else:
        fz[27:31, 16:20] = BASE_FUR
        fz[27:31, 24:28] = BASE_FUR

    # Dust puff
    fz[28, 0:3] = WHITE
    fz[29, 1:4] = WHITE

    zoom_frames.append(fz)

sprites_dict['zoomies'] = zoom_frames

# -------------------------------------------------------------
# 10. DRAGGED (2 frames)
# Suspended vertically, paws dangling, wide eyes
# -------------------------------------------------------------
drag_frames = []
for f in range(2):
    fdg = np.zeros_like(base)
    # Vertical body
    fdg[8:26, 14:28] = BASE_FUR
    fdg[10:24, 18:24] = CREAM # belly exposed
    fdg[12:22, 15:17] = STRIPE
    fdg[12:22, 25:27] = STRIPE

    # Hanging paws
    fdg[12:20, 11:14] = BASE_FUR
    fdg[12:20, 28:31] = BASE_FUR
    fdg[26:32, 16:19] = BASE_FUR
    fdg[26:32, 23:26] = BASE_FUR

    # Hanging tail
    fdg[24:32, 20:22] = STRIPE

    # Surprised wide-eyed head
    fdg[2:12, 16:26] = BASE_FUR
    fdg[0:4, 16:19] = INNER_EAR
    fdg[0:4, 23:26] = INNER_EAR
    fdg[5:8, 17:20] = OUTLINE
    fdg[5, 18] = WHITE
    fdg[5:8, 22:25] = OUTLINE
    fdg[5, 23] = WHITE
    fdg[8:11, 19:23] = CREAM
    fdg[9, 20:22] = NOSE

    drag_frames.append(fdg)

sprites_dict['dragged'] = drag_frames

# -------------------------------------------------------------
# 11. FALLING (2 frames)
# Parachute paws spread out
# -------------------------------------------------------------
fall_frames = []
for f in range(2):
    ff = np.zeros_like(base)
    flail = 1 if f == 1 else -1

    # Spread body
    ff[12:25, 13:29] = BASE_FUR
    ff[14:23, 17:25] = CREAM
    # Outstretched 4 paws
    ff[10+flail:15+flail, 8:13] = BASE_FUR
    ff[10-flail:15-flail, 29:34] = BASE_FUR
    ff[23-flail:28-flail, 9:14] = BASE_FUR
    ff[23+flail:28+flail, 28:33] = BASE_FUR

    # Head
    ff[4:14, 16:26] = BASE_FUR
    ff[2:6, 16:19] = INNER_EAR
    ff[2:6, 23:26] = INNER_EAR
    ff[7:10, 17:20] = OUTLINE
    ff[7, 18] = WHITE
    ff[7:10, 22:25] = OUTLINE
    ff[7, 23] = WHITE

    fall_frames.append(ff)

sprites_dict['falling'] = fall_frames

# -------------------------------------------------------------
# 12. DIZZY (4 frames)
# Spiral eyes, wobbly, orbiting gold stars
# -------------------------------------------------------------
dizzy_frames = []
for f in range(4):
    fdz = base.copy()
    tilt = 1 if f % 2 == 0 else -1

    # Wobbly head
    fdz[0:18, 24:41] = np.roll(fdz[0:18, 24:41], tilt, axis=1)

    # Swirly eyes (@ @)
    fdz[9:13, 30:32] = OUTLINE
    fdz[9:13, 35:37] = OUTLINE
    fdz[10, 31] = CREAM
    fdz[10, 36] = CREAM
    fdz[11, 30] = CREAM
    fdz[11, 35] = CREAM

    # Orbiting star
    angle = (f / 4.0) * 2 * np.pi
    sx = int(33 + np.cos(angle) * 7)
    sy = int(4 + np.sin(angle) * 3)
    if 0 <= sx < W and 0 <= sy < H:
        fdz[sy, sx] = STAR_GOLD

    dizzy_frames.append(fdz)

sprites_dict['dizzy'] = dizzy_frames

# Save all frames as data URLs into a JSON file
data_urls = {}
for state, frames in sprites_dict.items():
    data_urls[state] = []
    for idx, frame_arr in enumerate(frames):
        im = Image.fromarray(frame_arr, 'RGBA')
        # Also save PNG file
        os.makedirs(f'assets/sprites/{state}', exist_ok=True)
        im.save(f'assets/sprites/{state}/{idx}.png')
        data_urls[state].append(to_data_url(im))

# Write data URLs to a JS module that can be loaded directly
with open('renderer/ref-cat-sprites.js', 'w', encoding='utf-8') as f:
    f.write('// Pixel-perfect orange tabby cat sprites generated from user reference image\n')
    f.write('const REF_CAT_SPRITES = ' + json.dumps(data_urls, indent=2) + ';\n')
    f.write('if (typeof module !== "undefined" && module.exports) { module.exports = { REF_CAT_SPRITES }; }\n')

print(f'Successfully generated all {len(sprites_dict)} animations with reference cat!')
