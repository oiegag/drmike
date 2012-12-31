// initial plan: pop a pill at the top, let gravity let it drop to the bottom with controls, then stay there

// consts
// game states
var GAME_PLAY = 0;
var GAME_OVER = 1;
// keyboard
var KEY_UP = 38;
var KEY_DN = 40;
var KEY_RT = 39;
var KEY_LT = 37;
var KEY_D = 68;
var KEY_F = 70;
// d-pad stats
var DIR_NO = 0;
var DIR_LT = -1;
var DIR_RT = 1;
var DIR_DN = 2;
// rot states
var ROT_LEFT = 1;
var ROT_RIGHT = -1;
var ROT_NONE = 0;
// index -> pixel conversion
var SQUARESZ = 20;
var BOARDXOFF = 25;
var BOARDYOFF = 30;
var FRIENDLY = 32; // how often to call main

// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);

// load images
var Sprite = function(src) {
    this.ready = false;
    this.image = new Image();
    this.image.parent = this;
    this.image.onload = function() {
	this.parent.ready = true;
    };
    this.image.src = src;
}

bgIm = new Sprite("images/background.png");
pillIm = new Sprite("images/pill.png");

// game objects
var state = GAME_PLAY;
var last_update = Date.now();
var pressed = false;
var points = 0;
var dir = DIR_NO;

var board = {
    width:16,
    height:21
};
for(var i=0 ; i < board.width ; i++) {
    board[i] = [];
    for(j=0 ; j < board.height ; j++) {
	board[i][j] = null;
    }
}
board.show = function () {
    for(var i = 0 ; i < board.height ; i++) {
	var line = '';
	for(var j = 0 ; j < board.width ; j++) {
	    if(board[j][i] == null) {
		line = line + '.';
	    } else {
		line = line + 'o';
	    }
	}
	console.log(line);
    }
}
board.open = function (indi,indj,obj) { // check if obj can be in this location
    if ((indi < 0) || (indj < 0) || (indi >= board.width) || (indj >= board.height)) {
	return false;
    }
    if ((board[indi][indj] != null) && (board[indi][indj] != obj)) {
	return false;
    }
    return true;
}

// occupants of the board are virii or pills
var Occupant = function () {};
// Occupants will need: sprite, pos, locations, rotation
Occupant.prototype.render = function () {
    var locx, locy;
    
    locx = BOARDXOFF + SQUARESZ*(this.pos[0]+this.locations[0][0]);
    locy = BOARDYOFF + SQUARESZ*(this.pos[1] + this.locations[0][1]);
    ctx.save();
    ctx.translate(locx + SQUARESZ/2,locy + SQUARESZ/2);
    ctx.rotate(this.rotation*Math.PI/2);
    ctx.drawImage(this.sprite.image, -SQUARESZ/2, -SQUARESZ/2);
    ctx.restore();
}
Occupant.prototype.move = function (offset) {
    return this.place([this.pos[0] + offset[0], this.pos[1] + offset[1]]);
}
Occupant.prototype.place = function (newpos) {
    var indi, indj;
    // first check if the spot is free (it can be null or this, but not something else)
    for(i = 0 ; i < this.locations.length ; i++) {
	indi = newpos[0] + this.locations[i][0];
	indj = newpos[1] + this.locations[i][1]
	if(! board.open(indi, indj, this)) {
	    return false;
	}
    }
    // since the entire spot is free, go ahead and delete the old spot
    if (this.pos.length == 2) { // unless this is its first position, then pos = []
	for(i = 0 ; i < this.locations.length ; i++) {
	    indi = this.pos[0] + this.locations[i][0];
	    indj = this.pos[1] + this.locations[i][1]
	    board[indi][indj] = null;
	}
    }
    // and load the new spot
    for(i = 0 ; i < this.locations.length ; i++) {
	indi = newpos[0] + this.locations[i][0];
	indj = newpos[1] + this.locations[i][1]
	if (i == 0) {
	    this.pos[0] = indi;
	    this.pos[1] = indj;
	}
	board[indi][indj] = this;
    }
    return true;
}

var Pill = function() {
    this.rotation = 1; // number of 90 degree rotations
    this.under_ctl = true;
    this.locations = [[0,0],[-1,0]]; // offsetted locations in board occupied by this sprite
    this.pos = [];
    if (! this.place([board.width/2 , 0])) {
	console.log('end of game');
	state = GAME_OVER;
    }
    this.sprite = pillIm;
};
Pill.prototype = new Occupant();
Pill.prototype.rotate = function (offset) {
    newsecond = [[0,1],[-1,0],[0,-1],[1,0]]; // offsets for the rotations
    newrotation = (this.rotation + offset) % 4;
    if (newrotation < 0) { // trying to implement mod 4 : 0,1,2,3
	newrotation += 4;
    }
    // check if this new second location is taken
    newindi = this.pos[0] + newsecond[newrotation][0];
    newindj = this.pos[1] + newsecond[newrotation][1];
    if (! board.open(newindi, newindj, this)) {
	return false;
    }
    // remove the old spot
    indi = this.pos[0] + this.locations[1][0];
    indj = this.pos[1] + this.locations[1][1];
    board[indi][indj] = null;
    // add the new
    board[newindi][newindj] = this;
    this.rotation = newrotation;
    this.locations[1] = newsecond[this.rotation];
}
Pill.prototype.fall = function () {
    if(! (this.place([this.pos[0], this.pos[1]+1]))) {
	this.under_ctl = false;
    }
}
pill = new Pill();
all = [pill];

// Handle keyboard controls
var keyEvent = {};

addEventListener("keydown", function (e) {
    keyEvent[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
    delete keyEvent[e.keyCode];
}, false);

// update game objects
var update = function (modifier) {
    var now = Date.now();

    // convert the keys to more like a d-pad, only one direction at a time
    if ((KEY_LT in keyEvent) && !(KEY_RT in keyEvent) && !(KEY_DN in keyEvent)) {
	dir = DIR_LT;
    } else if (!(KEY_LT in keyEvent) && (KEY_RT in keyEvent) && !(KEY_DN in keyEvent)) {
	dir = DIR_RT;
    } else if (!(KEY_LT in keyEvent) && !(KEY_RT in keyEvent) && (KEY_DN in keyEvent)) {
	dir = DIR_DN;
    } else {
	dir = DIR_NO;
    }
    // convert rotations to just one
    if ((KEY_D in keyEvent) && !(KEY_F in keyEvent)) {
	rot = ROT_LEFT;
	delete keyEvent[KEY_D];
    } else if (!(KEY_D in keyEvent) && (KEY_F in keyEvent)) {
	rot = ROT_RIGHT;
	delete keyEvent[KEY_F];
    } else {
	rot = ROT_NONE;
    }

    if (now - last_update > 500) {
	pill.fall();
	last_update = now;
    }

    if (pill.under_ctl) {
	if (rot != ROT_NONE) {
	    pill.rotate(rot);
	}
	if ((dir == DIR_RT) || (dir == DIR_LT)) {
	    if (pressed == false) {
		pill.move([dir,0]);
		pressed = {
		    dir : dir,
		    start : now,
		    wait : 500
		}
	    } else if (pressed.dir != dir) {
		pill.move([dir,0]);
		pressed = {
		    dir : dir,
		    start : now,
		    wait : 500
		}
	    } else { // same thing as last time pressed
		if ( (now - pressed.start) > pressed.wait) {
		    pill.move([dir,0]);
		    pressed = {
			dir : dir,
			start : now,
			wait : 100
		    }
		}
	    }
	} else if (dir == DIR_NO) {
	    pressed = false;
	}
    } else {
	pill = new Pill();
	all.push(pill);
    }
};

// Draw everything
var render = function () {
    if (bgIm.ready) {
	ctx.drawImage(bgIm.image, 0, 0);
    }
    
    
    if (pillIm.ready) {
	for(i = 0 ; i < all.length ; i++) {
	    all[i].render();
	}
    }
    
    // Score
    ctx.fillStyle = "rgb(250, 250, 250)";
    ctx.font = "24px Helvetica";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Points: " + points, 32, 32);
};

// The main game loop
var main = function () {
    if (state == GAME_PLAY) {
	update();
    }
    render();
};

// Let's play this game!
setInterval(main, FRIENDLY); // execute every friendly ms
