from PIL import Image
import numpy as np
import os

img = Image.open(r'C:/Users/SHLOK/.gemini/antigravity/brain/d5b1a53a-d204-4eb1-ac3e-0b97038f292a/.user_uploaded/media_1794835418226_f4000e84.png').convert('RGB')
arr = np.array(img)

x0, y0 = 34, 39
H, W = 33, 41

# Palette from reference image
OUTLINE = np.array([42, 32, 56, 255], dtype=np.uint8)      # #2A2038
BASE_FUR = np.array([239, 140, 52, 255], dtype=np.uint8)   # #EF8C34
STRIPE = np.array([186, 76, 24, 255], dtype=np.uint8)      # #BA4C18
SHADE = np.array([204, 102, 38, 255], dtype=np.uint8)      # #CC6626
CREAM = np.array([251, 230, 198, 255], dtype=np.uint8)     # #FBE6C6
INNER_EAR = np.array([244, 162, 132, 255], dtype=np.uint8) # #F4A284
NOSE = np.array([168, 80, 58, 255], dtype=np.uint8)        # #A8503A
WHITE = np.array([255, 255, 255, 255], dtype=np.uint8)
TRANS = np.array([0, 0, 0, 0], dtype=np.uint8)

# Sample block centers
grid = np.zeros((H, W, 4), dtype=np.uint8)

for j in range(H):
    for i in range(W):
        block = arr[y0 + j*8 + 2 : y0 + j*8 + 6, x0 + i*8 + 2 : x0 + i*8 + 6]
        median = np.median(block, axis=(0, 1))
        r, g, b = median

        # 1. Background
        if r > 240 and g > 240 and b > 240:
            grid[j, i] = TRANS
            continue

        # 2. Eye catchlights (pure white dots inside the eyes)
        if (i == 31 and j == 10) or (i == 36 and j == 10):
            grid[j, i] = WHITE
            continue

        # 3. Outline (very dark charcoal purple)
        if r < 55 and g < 55 and b < 65:
            grid[j, i] = OUTLINE
            continue

        # 4. Eyes (black pupil pixels)
        if (i in (30, 31) and j in (10, 11, 12)) or (i in (35, 36) and j in (10, 11, 12)):
            grid[j, i] = OUTLINE
            continue

        # 5. Inner ear
        if (i in (27, 28) and j in (1, 2, 3)) or (i in (34, 35) and j in (1, 2, 3)):
            grid[j, i] = INNER_EAR
            continue

        # 6. Nose
        if i in (33, 34) and j == 13:
            grid[j, i] = NOSE
            continue

        # 7. Muzzle / Chest (cream peach)
        if (i >= 28 and j >= 13 and r > 215 and g > 185 and b > 140) or \
           (i >= 28 and j in (14, 15, 16) and r > 200 and g > 170 and b > 130) or \
           (i in (29, 30, 31, 32) and j >= 18 and r > 200 and g > 170):
            grid[j, i] = CREAM
            continue

        # 8. Dark tabby stripes
        if (r < 210 and g < 110) or (r < 225 and g < 115 and b < 60):
            grid[j, i] = STRIPE
            continue

        # 9. Shading / back leg shadow
        if (j >= 21 and (i < 24 or (i >= 24 and g < 125))) or (g < 128 and b < 60):
            grid[j, i] = SHADE
            continue

        # 10. Default fur
        grid[j, i] = BASE_FUR

# Fix watermark artifacts on belly (rows 16-23)
# Clean up any outline noise that came from the watermark letters inside the cat belly:
for j in range(16, 22):
    for i in range(12, 28):
        # If it was marked as outline or dark due to watermark, restore to fur or stripe or shade
        if np.array_equal(grid[j, i], OUTLINE):
            # Check if this is the bottom belly border
            # Bottom outline of belly is at row 22-23
            if j < 21:
                grid[j, i] = BASE_FUR

# Save
os.makedirs('assets/sprites', exist_ok=True)
base_img = Image.fromarray(grid, 'RGBA')
base_img.save('assets/sprites/ref_cat_base.png')

# Scale 8x
scaled_img = base_img.resize((W * 8, H * 8), Image.Resampling.NEAREST)
scaled_img.save('assets/sprites/ref_cat_base_8x.png')
print('Extracted and saved base sprite successfully!')
