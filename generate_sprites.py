from PIL import Image
import numpy as np
import os

# Colors from the user's reference image
O = (42, 32, 56, 255)       # Outline: #2A2038 dark purple-charcoal
F = (239, 140, 52, 255)      # Fur: #EF8C34 warm bright orange tabby
H = (248, 160, 72, 255)      # Highlight fur: #F8A048
S = (186, 76, 24, 255)       # Tabby stripes: #BA4C18 deep burnt orange
B = (204, 102, 38, 255)      # Shading / underbelly / back legs: #CC6626
C = (251, 230, 198, 255)     # Cream muzzle & chest: #FBE6C6
P = (244, 162, 132, 255)     # Pink / Peach inner ear: #F4A284
N = (168, 80, 58, 255)       # Nose & mouth: #A8503A
W = (255, 255, 255, 255)     # Eye catchlight: White
_ = (0, 0, 0, 0)             # Transparent

# Grid size 41 wide x 33 high (exact native pixel grid of reference image)
# Define the exact pixel map of the cat:
BASE_MAP = [
    # 0
    "                             O#        O# ",
    "                             #P#      #P# ",
    "                             #PP#    #PP# ",
    "   ##                       #HPPP####HPPP#",
    "  #F#                       #HHPP#HH#PP#H#",
    " #FFF#                      #HHS##SS#SS#S#",
    " #FFF#                      #H#SS#SS#SS#S#",
    " #FFF#                      #H#SS#SS#SS#S#",
    " #FFF#                     #HHHSS#SS#SS#S#",
    " #FFF#        ########     #HSS##########O",
    "  #FS#      ##FSSSFFSS#####H#FF#W#FFF#W#F#",
    "  #FSS#   ##SSFFFSSFFFSSSS#F#FF#O#FFF#O#F#",
    "   #FSS###SSSFFFSSFFFSSSSF#SSFF#O#FFF#O#F#",
    "    #FSSSSFFFFFSFFFFSSSSS#SFFCCCCCCCCCCCC#",
    "     ##SFFFFFFFFFFFFFFFF#SFF#CFFNFFFFNFF# ",
    "       ##FFFFFFFFFFFFFFF#SFF#CCCCCCCCCCC# ",
    "        #FFFFFFFFFFFFFFFF#SS#CCCCCCCCCC#  ",
    "        #FFFFFFFFFFFFFFFFF##CCCCCCCCC##   ",
    "        #FFFFFFFFFFFFFFFFFF#CCCCCCCC#     ",
    "        #FFFFFFFFFFFFFFFFF#CCCCCCCCC#     ",
    "        #FFFFFFFFFFFFFFFFF#CCCCCCCCC#     ",
    "        #FFFFF#BBBBBB#FFF#CCCCCCCCCC#     ",
    "        #FFFF#BBBBBBBB#F#CCCCCC#CCCCC#    ",
    "        #FFF#BBBBBBBBBB#CCCCCCC#CCCCCC#   ",
    "       #FFF#BBBBBBBBBBB#CCCCCC##CCCCCC#   ",
    "       #FFF#BB#BBB#BBBB#CCCCCC# #CCCCC#   ",
    "       #FFF#B# BBB #BBB#CCCCC#  #CCCCC#   ",
    "       #FFF#B# BBB #BBB#CCCCC#  #CCCCC#   ",
    "       #FFF#B# BBB #BBB#CCCCC#  #CCCCC#   ",
    "       #FFF#B# BBB #BBB#CCCCC#  #CCCCC#   ",
    "       #FFF#B# BBB #BBB#CCCCC#  #CCCCC#   ",
    "        ### #  ###  ### #####    #####    ",
    "                                          "
]

print("Rows in BASE_MAP:", len(BASE_MAP))
