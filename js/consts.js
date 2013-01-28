// consts
// game states
var GAME_CTLPILL = 0;
var GAME_OVER = 1;
var GAME_LOAD = 2;
var GAME_FALLING = 3;
var GAME_BIRTHANDDEATH = 4;
var GAME_PAUSE = 5;
var GAME_CESSATION = 6;
var GAME_NEWLVL = 7;
// keyboard
var KEY_UP = 38;
var KEY_DN = 40;
var KEY_RT = 39;
var KEY_LT = 37;
var KEY_D = 68; // rotate
var KEY_F = 70; // rotate
var KEY_SP = 32; // pause
var KEY_O = 79; // reset
var KEY_M = 77; // switch music
var KEY_Q = 81; // quit
var KEY_ENTER = 13; // just for menus
// d-pad stats
var DIR_NO = 0;
var DIR_LT = 1;
var DIR_RT = 2;
var DIR_DN = 3;
// d-pad -> directions map
var DIR_MOVES = [[0,0], [-1,0], [1,0], [0,1]];
// rot states
var ROT_LEFT = 1;
var ROT_RIGHT = -1;
var ROT_NONE = 0;
// offsets for the second part of a pill in a given rotation (90 degree increments)
var ROT_SND = [[0,1],[-1,0],[0,-1],[1,0]];
// color names
var COL_YEL = 0;
var COL_TEA = 1;
var COL_MAG = 2;
// pill sprite -> colors map
var COL_PILLS = [[COL_YEL,COL_YEL], [COL_YEL,COL_MAG], [COL_TEA, COL_YEL],
		 [COL_TEA,COL_TEA], [COL_MAG,COL_TEA], [COL_MAG, COL_MAG]];
// virus animations
var VIR_ANI_BREATHE = 0;
var VIR_ANI_FIDGET = 1;
var VIR_ANI_BIRTH = 2;
var VIR_ANI_BIRTHING = 3;
// index -> pixel conversion
var SQUARESZ = 20;
var BOARDXOFF = 27;
var BOARDYOFF = 41;
// how often to call main (ms)
var FRIENDLY = 15;

