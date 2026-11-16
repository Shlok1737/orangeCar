from PIL import Image
import numpy as np
import os

img = Image.open('assets/sprites/ref_cat_base.png')
arr = np.array(img)

OUTLINE = np.array([42, 32, 56, 255], dtype=np.uint8)
BASE_FUR = np.array([239, 140, 52, 255], dtype=np.uint8)
STRIPE = np.array([186, 76, 24, 255], dtype=np.uint8)
SHADE = np.array([204, 102, 38, 255], dtype=np.uint8)
CREAM = np.array([251, 230, 198, 255], dtype=np.uint8)
INNER_EAR = np.array([244, 162, 132, 255], dtype=np.uint8)
NOSE = np.array([168, 80, 58, 255], dtype=np.uint8)
WHITE = np.array([255, 255, 255, 255], dtype=np.uint8)
TRANS = np.array([0, 0, 0, 0], dtype=np.uint8)

# Clean belly and open space between legs
# Underbelly line is at row 22
for j in range(16, 22):
    for i in range(11, 26):
        # Restore any dark pixel that was watermark artifact
        if np.array_equal(arr[j, i], OUTLINE):
            arr[j, i] = BASE_FUR

# Ensure underbelly outline
for i in range(16, 22):
    arr[22, i] = OUTLINE

# Ensure space between legs is transparent
for j in range(23, 31):
    for i in range(20, 25):
        if j >= 24 and i in (20, 21, 22, 23):
            arr[j, i] = TRANS

# Clean ears
arr[0, 27:29] = OUTLINE
arr[0, 35:37] = OUTLINE
arr[1, 27] = INNER_EAR
arr[1, 28] = INNER_EAR
arr[1, 35] = INNER_EAR
arr[1, 36] = INNER_EAR
arr[2, 27] = INNER_EAR
arr[2, 28] = INNER_EAR
arr[2, 35] = INNER_EAR
arr[2, 36] = INNER_EAR

# Eyes
# Left eye
arr[9, 30:32] = OUTLINE
arr[10, 30] = OUTLINE
arr[10, 31] = WHITE
arr[11, 30:32] = OUTLINE
arr[12, 30:32] = OUTLINE
# Right eye
arr[9, 35:37] = OUTLINE
arr[10, 35] = OUTLINE
arr[10, 36] = WHITE
arr[11, 35:37] = OUTLINE
arr[12, 35:37] = OUTLINE

# Nose & mouth
arr[13, 32:34] = NOSE
arr[14, 31] = OUTLINE
arr[14, 32] = CREAM
arr[14, 33] = OUTLINE
arr[14, 34] = CREAM
arr[14, 35] = OUTLINE

# Clean and save
clean_img = Image.fromarray(arr, 'RGBA')
clean_img.save('assets/sprites/ref_cat_clean.png')
scaled = clean_img.resize((arr.shape[1] * 8, arr.shape[0] * 8), Image.Resampling.NEAREST)
scaled.save('assets/sprites/ref_cat_clean_8x.png')
print('Refined base cat sprite saved!')
