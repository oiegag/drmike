// dr mike

// consts
// game states
var GAME_CTLPILL = 0;
var GAME_OVER = 1;
var GAME_LOAD = 2;
var GAME_FALLING = 3;
// keyboard
var KEY_UP = 38;
var KEY_DN = 40;
var KEY_RT = 39;
var KEY_LT = 37;
var KEY_D = 68;
var KEY_F = 70;
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
// index -> pixel conversion
var SQUARESZ = 20;
var BOARDXOFF = 25;
var BOARDYOFF = 30;
// how often to call main (ms)
var FRIENDLY = 32;

// create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);

// utilities
var randN = function (n) { // 0 ... n-1 random num
    return Math.floor(Math.random()*n);
}

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
halfIms = [ // yel, tea, mag
    new Sprite("images/pilly.png"),
    new Sprite("images/pillt.png"),
    new Sprite("images/pillm.png")];
pillIms = [ // yel, tea, mag
    new Sprite("images/pillyy.png"), // 00
    new Sprite("images/pillym.png"), // 02
    new Sprite("images/pillty.png"), // 10
    new Sprite("images/pilltt.png"), // 11
    new Sprite("images/pillmt.png"), // 21
    new Sprite("images/pillmm.png")];// 22

// game objects
var cfg = {
    user_fall_rate : 500, // how long between falls
    grav_fall_rate : 250, // how long between falls
    fast_move : 100, // how long between moves in fast mode
    fast_start : 500, // how long to press down before fast mode
};
var state = GAME_LOAD;
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
		col = board[j][i].color(j,i);
		var cols = ['y', 't', 'm'];
		line = line + cols[col];
	    }
	}
	console.log(line);
    }
}
board.kill_matches = function (matches) {
    for (var i = 0 ; i < matches.length ; i++) {
	for (var j = 0 ; j < matches[i].length ; j++) {
	    board[matches[i][j][0]][matches[i][j][1]] = null;
	}
    }
    // now run through the board, return objects still on it. let them adjust themselves if
    // necessary (pills may have to return just a half-pill)
    var ordered = [];
    for (var i = 0 ; i < board.width ; i++) {
	for (var j = 0 ; j < board.height ; j++) {
	    if (board[i][j] != null) {
		var newbie = board[i][j].adjust();
		ordered[ordered.length] = newbie;
	    }
	}
    }
    return ordered.filter(function(s, i, a){ return i == a.lastIndexOf(s); });
}

board.seek_matches = function () {
    var matches = [];
    // check vertical matches
    for (var i = 0 ; i < board.width ; i++) {
	var sofar = 1;
	for (var j = 1 ; j <= board.height ; j++) {
	    // count as long as we're in the board, we're on colors, and they're the same
	    if ((j < board.height)
		&& ((board[i][j] != null) && (board[i][j-1] != null))
		&& (board[i][j].color(i,j) == board[i][j-1].color(i,j-1))) {
		sofar++;
	    } else {
		if (sofar >= 4) {
		    matches[matches.length] = [];
		    for (var k = (j - sofar) ; k < j ; k++) {
			matches[matches.length-1].push([i,k]);
		    }
		}
		sofar = 1;
	    }
	}
    }
    // check horizontal matches
    for (var j = 0 ; j < board.height ; j++) {
	var sofar = 1;
	for (var i = 1 ; i <= board.width ; i++) {
	    if ((i < board.width)
		&& ((board[i][j] != null) && (board[i-1][j] != null))
		&& (board[i][j].color(i,j) == board[i-1][j].color(i-1,j))) {
		sofar++;
	    } else {
		if (sofar >= 4) {
		    matches[matches.length] = [];
		    for (var k = (i - sofar) ; k < i ; k++) {
			matches[matches.length-1].push([k,j]);
		    }
		}
		sofar = 1;
	    }
	}
    }
    return matches;
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
Occupant.prototype.getpos = function (i) {
    return [this.pos[0] + this.locations[i][0], this.pos[1] + this.locations[i][1]]
};
Occupant.prototype.render = function () {
    var locx, locy;
    
    locx = BOARDXOFF + SQUARESZ*this.pos[0];
    locy = BOARDYOFF + SQUARESZ*this.pos[1];
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
	    board[this.getpos(i)[0]][this.getpos(i)[1]] = null;
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
Occupant.prototype.fall = function () {
    return this.place([this.pos[0], this.pos[1]+1]);
}

var HalfPill = function(frompill,which_half) {
    this.pos = frompill.getpos(which_half);
    this.locations = [[0,0]];
    if (which_half == 0) {
	this.rotation = frompill.rotation;
    } else {
	this.rotation = (frompill.rotation + 2) % 4;
    }
    this.colors = frompill.colors[which_half];
    this.sprite = halfIms[frompill.colors[which_half]];
}
HalfPill.prototype = new Occupant();
HalfPill.prototype.color = function (i,j) {
    if ((i != this.pos[0]) || (j != this.pos[1])) {
	return false;
    } else {
	return this.colors;
    }
}
HalfPill.prototype.adjust = function () {
    return this;
}

var Pill = function(pilltype) {
    this.rotation = 0; // number of 90 degree rotations
    this.locations = [[0,0],ROT_SND[this.rotation]]; // offsetted locations in board occupied by this sprite
    this.colors = COL_PILLS[pilltype];
    this.pos = [];
    if (! this.place([board.width/2 , 0])) {
	console.log('end of game');
	state = GAME_OVER;
    }
    this.sprite = pillIms[pilltype];
};
Pill.prototype = new Occupant();
Pill.prototype.adjust = function () {
    // the pill is on the board, but may be a half-pill now
    if ((board[this.pos[0]][this.pos[1]] == this)
	&& (board[this.getpos(1)[0]][this.getpos(1)[1]] == this)) {
	return this;
    } else if(board[this.pos[0]][this.pos[1]] == null) {
	half = new HalfPill(this,1);
	board[this.getpos(1)[0]][this.getpos(1)[1]] = half;
	return half;
    } else if(board[this.getpos(1)[0]][this.getpos(1)[1]] == null) {
	half = new HalfPill(this,0);
	board[this.pos[0]][this.pos[1]] = half;
	return half;
    } else {
	console.log('erroneous call?');
	return this;
    }
}
Pill.prototype.rotate = function (offset) {
    newrotation = (this.rotation + offset) % 4;
    if (newrotation < 0) { // trying to implement mod 4 : 0,1,2,3
	newrotation += 4;
    }
    // check if this new second location is taken
    newindi = this.pos[0] + ROT_SND[newrotation][0];
    newindj = this.pos[1] + ROT_SND[newrotation][1];
    if (! board.open(newindi, newindj, this)) {
	return false;
    }
    // remove the old spot
    board[this.getpos(1)[0]][this.getpos(1)[1]] = null;
    // add the new
    board[newindi][newindj] = this;
    this.rotation = newrotation;
    this.locations[1] = ROT_SND[this.rotation];
}
Pill.prototype.color = function (i,j) { // what color is at location i,j
    if ((i == this.pos[0]) && (j == this.pos[1])) {
	return this.colors[0];
    } else if ((i == this.getpos(1)[0])  && (j == this.getpos(1)[1])) {
	return this.colors[1];
    } else {
	return false;
    }
}
pill = new Pill(randN(pillIms.length));
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
var handle_moves = function (modifier) {
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

    if (rot != ROT_NONE) {
	pill.rotate(rot);
    }
    
    if (dir != DIR_NO) {
	if ((pressed == false) || (pressed.dir != dir)) {
	    pill.move(DIR_MOVES[dir]);
	    if (dir == DIR_DN) { // don't do two falls in a row, it looks weird
		last_update = now;
	    }
	    pressed = {
		dir : dir,
		start : now,
		wait : cfg.fast_start
	    }
	} else { // same thing as last time pressed
	    if ( (now - pressed.start) > pressed.wait) {
		pill.move(DIR_MOVES[dir]);
		pressed = {
		    dir : dir,
		    start : pressed.start + pressed.wait,
		    wait : cfg.fast_move
		}
	    }
	}
    } else {
	pressed = false;
    }

    if ((now - last_update) > cfg.user_fall_rate) {
	if(! pill.fall()) {
	    matches = board.seek_matches();
	    all = board.kill_matches(matches);
	    if (matches.length == 0) {
		pill = new Pill(randN(pillIms.length));
		all.push(pill);
		state = GAME_CTLPILL;
		last_update = last_update + cfg.user_fall_rate;
	    } else {
		state = GAME_FALLING;
		last_update = last_update + cfg.grav_fall_rate;
	    }
	} else {
	    last_update = last_update + cfg.user_fall_rate;
	}
    }
};


// Draw everything
var render = function () {
    ctx.drawImage(bgIm.image, 0, 0);
    
    for(i = 0 ; i < all.length ; i++) {
	all[i].render();
    }
    
    // Score
    ctx.fillStyle = "rgb(250, 250, 250)";
    ctx.font = "24px Helvetica";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Points: " + points, 32, 32);
};

var handle_fall = function () {
    now = Date.now();

    if ((now - last_update) > cfg.grav_fall_rate) {
	last_update = last_update + cfg.grav_fall_rate;
	var falling = false;
	for (i in all) {
	    thisone = all[i].fall();
	    falling = falling || thisone;
	}
	if (! falling) {
	    matches = board.seek_matches();
	    all = board.kill_matches(matches);
	    if (matches.length == 0) {
		pill = new Pill(randN(pillIms.length));
		all.push(pill);
		state = GAME_CTLPILL;
	    } else {
		state = GAME_FALLING;
	    }
	}
    }
}
// The main game loop
var main = function () {
    if (state == GAME_CTLPILL) {
	handle_moves();
	render();
    } else if (state == GAME_LOAD) {
	checks = [].concat([bgIm],pillIms,halfIms);
	var ready = true;
	for (var i = 0 ; i < checks.length ; i++) {
	    if (! checks[i].ready) {
		ready = false;
	    }
	}
	if (ready == true) {
	    state = GAME_CTLPILL;
	}
    } else if (state == GAME_FALLING) {
	handle_fall();
	render();
    }
};

// Let's play this game!
setInterval(main, FRIENDLY); // execute every friendly ms
