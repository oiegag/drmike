
/*
   consts.js -- constants required

   Copyright 2013 Mike McFadden
   Author: Mike McFadden <compositiongamesdev@gmail.com>
   URL: http://github.com/oiegag/drmike

   This file is part of Dr. Mike.

   Dr. Mike is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.
   
   Dr. Mike is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   
   You should have received a copy of the GNU General Public License
   along with Dr. Mike.  If not, see <http://www.gnu.org/licenses/>.
*/

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
KEY = {
    'up':38,
    'dn':40,
    'rt':39,
    'lt':37,
    'd':68,
    'f':70,
    'sp':32,
    'o':79,
    'm':77,
    'q':81,
    'en':13
};
PKEYS = { // keys to prevent default event on
    38:'up',40:'dn', 39:'rt', 37:'lt',32:'sp'
};
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
