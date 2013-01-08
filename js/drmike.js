// dr mike

// consts
// game states
var GAME_CTLPILL = 0;
var GAME_OVER = 1;
var GAME_LOAD = 2;
var GAME_FALLING = 3;
var GAME_BIRTHANDDEATH = 4;
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
var FRIENDLY = 25;

// utilities
var randN = function (n) { // 0 ... n-1 random num
    return Math.floor(Math.random()*n);
}

// image loader and renderer for things not on the board
var Sprite = function(src) {
    this.ready = false;
    this.image = new Image();
    this.image.parent = this;
    this.image.onload = function() {
	this.parent.ready = true;
    };
    this.image.src = src;
};

// RHS stuff
var AnimSprite = function (filenm, pos, layout) {
    this.sprite = new Sprite(filenm);
    this.pos = [pos[0]*canvas.width, pos[1]*canvas.height];
    this.layout = layout;
    this.spritepos = [0, 0];
}
AnimSprite.prototype.render = function () {
    var sw = this.sprite.image.width/this.layout[0];
    var sh = this.sprite.image.height/this.layout[1];
    ctx.drawImage(this.sprite.image, this.spritepos[0]*sw, this.spritepos[1]*sh, sw, sh,
		  this.pos[0], this.pos[1], sw, sh);
};
AnimSprite.prototype.animate = function () {};


// the board and its related stuff
var Board = function () {
    this.width = 16;
    this.height = 20;
    for(var i=0 ; i < this.width ; i++) {
	this[i] = [];
	for(j=0 ; j < this.height ; j++) {
	    this[i][j] = null;
	}
    }
}

Board.prototype.show = function () {
    for(var i = 0 ; i < this.height ; i++) {
	var line = '';
	for(var j = 0 ; j < this.width ; j++) {
	    if(this[j][i] == null) {
		line = line + '.';
	    } else {
		col = this[j][i].color(j,i);
		var cols = ['y', 't', 'm'];
		line = line + cols[col];
	    }
	}
	console.log(line);
    }
}
Board.prototype.kill_matches = function (matches) {
    for (var i = 0 ; i < matches.length ; i++) {
	for (var j = 0 ; j < matches[i].length ; j++) {
	    this[matches[i][j][0]][matches[i][j][1]] = null;
	    addedSplode = new Splode([matches[i][j][0], matches[i][j][1]]);
	    this[matches[i][j][0]][matches[i][j][1]] = addedSplode;
	}
    }
    return this.obtain_elements();
}

Board.prototype.obtain_elements = function () {
    // now run through the board, return objects still on it. let them adjust themselves if
    // necessary (pills may have to return just a half-pill)
    var ordered = [];
    for (var i = 0 ; i < this.width ; i++) {
	for (var j = 0 ; j < this.height ; j++) {
	    if (this[i][j] != null) {
		var newbie = this[i][j].adjust();
		ordered[ordered.length] = newbie;
	    }
	}
    }
    return ordered.filter(function(s, i, a){ return i == a.lastIndexOf(s); });
}

Board.prototype.seek_matches = function () {
    var matches = [];
    // check vertical matches
    for (var i = 0 ; i < this.width ; i++) {
	var sofar = 1, haspill = false;
	for (var j = 1 ; j <= this.height ; j++) {
	    // count as long as we're in the board, we're on colors, and they're the same
	    if ((j < this.height)
		&& ((this[i][j] != null) && (this[i][j-1] != null))
		&& (this[i][j].color(i,j) == this[i][j-1].color(i,j-1))) {
		sofar++;
		if (!(this[i][j] instanceof Virus) || !(this[i][j-1] instanceof Virus)) {
		    haspill = true;
		}
	    } else {
		if (sofar >= 4 && haspill) {
		    matches[matches.length] = [];
		    for (var k = (j - sofar) ; k < j ; k++) {
			matches[matches.length-1].push([i,k]);
		    }
		}
		sofar = 1;
		haspill = false;
	    }
	}
    }
    // check horizontal matches
    for (var j = 0 ; j < this.height ; j++) {
	var sofar = 1, haspill = false;
	for (var i = 1 ; i <= this.width ; i++) {
	    if ((i < this.width)
		&& ((this[i][j] != null) && (this[i-1][j] != null))
		&& (this[i][j].color(i,j) == this[i-1][j].color(i-1,j))) {
		sofar++;
		if (!(this[i][j] instanceof Virus) || !(this[i-1][j] instanceof Virus)) {
		    haspill = true;
		}
	    } else {
		if (sofar >= 4 && haspill) {
		    matches[matches.length] = [];
		    for (var k = (i - sofar) ; k < i ; k++) {
			matches[matches.length-1].push([k,j]);
		    }
		}
		sofar = 1;
		haspill = false;
	    }
	}
    }
    return matches;
}

Board.prototype.open = function (indi,indj,obj) { // check if obj can be in this location
    if ((indi < 0) || (indj < 0) || (indi >= this.width) || (indj >= this.height)) {
	return false;
    }
    if ((this[indi][indj] != null) && (this[indi][indj] != obj)) {
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
Occupant.prototype.spritepos = [0, 0];
Occupant.prototype.size = [SQUARESZ, SQUARESZ];
Occupant.prototype.render = function () {
    var locx, locy;
    
    locx = BOARDXOFF + SQUARESZ*this.pos[0];
    locy = BOARDYOFF + SQUARESZ*this.pos[1];
    ctx.save();
    ctx.translate(locx + SQUARESZ/2,locy + SQUARESZ/2);
    ctx.rotate(this.rotation*Math.PI/2);
    ctx.drawImage(this.sprite.image, this.spritepos[0]*SQUARESZ,
		  this.spritepos[1]*SQUARESZ, this.size[0], this.size[1], -SQUARESZ/2, -SQUARESZ/2, this.size[0], this.size[1]);
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
Occupant.prototype.color = function (i,j) {
    if ((i != this.pos[0]) || (j != this.pos[1])) {
	return false;
    } else {
	return this.colors;
    }
}
Occupant.prototype.adjust = function () {
    return this;
}
Occupant.prototype.reproduce = function () {};

var Splode = function(pos) {
    this.pos = pos;
    this.locations = [[0,0]];
    this.sprite = splodeIms;
    this.spritepos = [0,0];
    this.wait_time = cfg.splode_wait_time;
    this.last_update = Date.now();
    this.done = false;
    if (! this.place(pos)) {
	return false;
    } else {
	return true;
    }
}
Splode.prototype = new Occupant();
Splode.prototype.animate = function (now) {
    if ((now - this.last_update) > this.wait_time) {
	if (this.spritepos[1] < 2) {
	    this.last_update = this.last_update + this.wait_time;
	    this.spritepos[1]++;
	} else {
	    board[this.pos[0]][this.pos[1]] = null;
	    this.done = true;
	}
    }
}
Splode.prototype.fall = function () {}

var Virus = function(pos,color) {
    this.pos = pos;
    this.locations = [[0,0]];
    this.colors = color;
    this.sprite = virusIms;
    this.spritepos = [color, 10]; // empty square birth sequence
    this.cycle = cfg.vir_rep;
    this.last_update = Date.now();
    this.wait_time = cfg.animate_wait_time/2; // faster during birth
    this.aniseq = 2; // two empties before birth
    this.ani_state = VIR_ANI_BIRTH;
    this.done = false; // not born
    if (! this.place(pos)) {
	return false;
    } else {
	return true;
    }
}
Virus.prototype = new Occupant();
Virus.prototype.fall = function () {};
Virus.prototype.reproduce = function () {
    this.cycle--;
    if(! this.cycle) {
	var availables = [];
	if (board.open(this.pos[0]+1,this.pos[1],this)) {
	    availables.push([this.pos[0]+1,this.pos[1]]);
	}
	if (board.open(this.pos[0],this.pos[1]+1,this)) {
	    availables.push([this.pos[0],this.pos[1]+1]);
	}
	if (board.open(this.pos[0]-1,this.pos[1],this)) {
	    availables.push([this.pos[0]-1,this.pos[1]]);
	}
	if (board.open(this.pos[0],this.pos[1]-1,this)) {
	    availables.push([this.pos[0],this.pos[1]-1]);
	}
	if (availables.length > 0) {
	    all.push(new Virus(availables[randN(availables.length)],this.colors));
	    this.ani_state = VIR_ANI_BIRTHING;
	    this.spritepos[1] = 7; // beginning of birth sequence
	}
	this.cycle = cfg.vir_rep;
    }
}
Virus.prototype.animate = function (now) {
    if ((now - this.last_update) > this.wait_time) {
	this.last_update = now;
	if (this.ani_state == VIR_ANI_BREATHE) {
	    this.spritepos[1] = (this.spritepos[1] + 1) % 4;
	    if(this.spritepos[1] == 0) {
		this.aniseq--;
	    }
	    if (this.aniseq == 0) {
		this.ani_state = VIR_ANI_FIDGET;
		this.spritepos[1] = 4
	    }
	} else if(this.ani_state == VIR_ANI_FIDGET) {
	    this.spritepos[1]++;
	    if (this.spritepos[1] == 7) {
		this.spritepos[1] = 0;
		this.aniseq = randN(4)+2;
		this.ani_state = VIR_ANI_BREATHE;
	    }
	} else if(this.ani_state == VIR_ANI_BIRTH) {
	    if (this.aniseq > 0) {
		this.aniseq--;
	    } else {
		this.spritepos[1]++;
		if (this.spritepos[1] == 13) {
		    this.aniseq = randN(4) + 2;
		    this.ani_state = VIR_ANI_BREATHE;
		    this.spritepos[1] = 0;
		    this.done = true;
		    this.wait_time = cfg.animate_wait_time;
		}
	    }
	} else if (this.ani_state == VIR_ANI_BIRTHING) {
	    if (this.spritepos[1] < 9) {
		this.spritepos[1]++;
		this.aniseq = 2;
	    } else {
		this.aniseq--;
		if (this.aniseq == 0) {
		    this.spritepos[1] = 0;
		    this.aniseq = randN(4) + 2;
		    this.ani_state = VIR_ANI_BREATHE;
		}
	    }
	}
    }
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
Pill.prototype.size = [SQUARESZ, SQUARESZ*2];
Pill.prototype.adjust = function () {
    // the pill is on the board, but may be a half-pill now
    if ((board[this.pos[0]][this.pos[1]] == this)
	&& (board[this.getpos(1)[0]][this.getpos(1)[1]] == this)) {
	return this;
    } else if(board[this.pos[0]][this.pos[1]] instanceof Splode) {
	half = new HalfPill(this,1);
	board[this.getpos(1)[0]][this.getpos(1)[1]] = half;
	return half;
    } else if(board[this.getpos(1)[0]][this.getpos(1)[1]] instanceof Splode) {
	half = new HalfPill(this,0);
	board[this.pos[0]][this.pos[1]] = half;
	return half;
    } else {
	console.log('erroneous call?');
	return this;
    }
}
Pill.prototype.rotate = function (offset) {
    var newrotation = (this.rotation + offset) % 4;
    if (newrotation < 0) { // trying to implement mod 4 : 0,1,2,3
	newrotation += 4;
    }
    // check if this new second location is taken
    var newindi = this.pos[0] + ROT_SND[newrotation][0];
    var newindj = this.pos[1] + ROT_SND[newrotation][1];
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

var Input = function () {
    this.keyEvent = {};
    this.pressed = false;
};

// main game functions.. the stage constructor sets up the global
// game state stuff.. guess that's sort of ugly, but oh well
var Stage = function (layout) {
    board = new Board();
    this.pill = new Pill(randN(pillIms.length));
    all = [this.pill];
    for (i in layout) {
	all.push(new Virus(layout[i][0], layout[i][1]));
    }
}
Stage.prototype.handle_moves = function (modifier) {
    var now = Date.now(), dir = null, rot = null;

    // convert the keys to more like a d-pad, only one direction at a time
    if ((KEY_LT in input.keyEvent) && !(KEY_RT in input.keyEvent)
	&& !(KEY_DN in input.keyEvent)) {
	dir = DIR_LT;
    } else if (!(KEY_LT in input.keyEvent) && (KEY_RT in input.keyEvent)
	       && !(KEY_DN in input.keyEvent)) {
	dir = DIR_RT;
    } else if (!(KEY_LT in input.keyEvent) && !(KEY_RT in input.keyEvent)
	       && (KEY_DN in input.keyEvent)) {
	dir = DIR_DN;
    } else {
	dir = DIR_NO;
    }
    // convert rotations to just one
    if ((KEY_D in input.keyEvent) && !(KEY_F in input.keyEvent)) {
	rot = ROT_LEFT;
	delete input.keyEvent[KEY_D];
    } else if (!(KEY_D in input.keyEvent) && (KEY_F in input.keyEvent)) {
	rot = ROT_RIGHT;
	delete input.keyEvent[KEY_F];
    } else {
	rot = ROT_NONE;
    }

    if (rot != ROT_NONE) {
	stage.pill.rotate(rot);
    }
    
    if (dir != DIR_NO) {
	if ((input.pressed == false) || (input.pressed.dir != dir)) {
	    stage.pill.move(DIR_MOVES[dir]);
	    if (dir == DIR_DN) { // don't do two falls in a row, it looks weird
		last_update = now;
	    }
	    input.pressed = {
		dir : dir,
		start : now,
		wait : cfg.fast_start
	    }
	} else { // same thing as last time pressed
	    if ( (now - input.pressed.start) > input.pressed.wait) {
		stage.pill.move(DIR_MOVES[dir]);
		input.pressed = {
		    dir : dir,
		    start : input.pressed.start + input.pressed.wait,
		    wait : cfg.fast_move
		}
	    }
	}
    } else {
	input.pressed = false;
    }

    if ((now - last_update) > cfg.user_fall_rate) {
	if(! stage.pill.fall()) {
	    // so if you kill matches first, then reproduce it's possible to
	    // grow into a 4-in-a-row that won't be checked until the next
	    // pill comes. if you reproduce then kill, katie gets mad because
	    // you're constantly having them "get away"
	    matches = board.seek_matches();
	    all = board.kill_matches(matches);
	    for (i in all) {
		all[i].reproduce();
	    }
	    if (matches.length == 0) {
		matches = board.seek_matches();
		if (matches.length == 0) {
		    anims[0].insert(); // animate dr mario putting it in
		    stage.pill = new Pill(randN(pillIms.length));
		    if (state != GAME_OVER) {
			all.push(stage.pill);
			state = GAME_CTLPILL;
			last_update = last_update + cfg.user_fall_rate;
		    }
		} else {
		    state = GAME_BIRTHANDDEATH;
		}
	    } else {
		state = GAME_BIRTHANDDEATH;
	    }
	}
	last_update = last_update + cfg.user_fall_rate;
    }
};


// draw everything
Stage.prototype.render = function () {
    ctx.drawImage(bgIms[0].image, 0, 0);
    for (var i = 0 ; i < anims.length ; i++) {
	anims[i].render();
    }

    for(var i = 0 ; i < all.length ; i++) {
	all[i].render();
    }
    
    // Score
    ctx.fillStyle = "rgb(250, 250, 250)";
    ctx.font = "24px Helvetica";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Points: " + points, 32, 32);
};

// make pills fall
Stage.prototype.handle_fall = function () {
    var now = Date.now();

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
		anim[0].insert();
		stage.pill = new Pill(randN(pillIms.length));
		if (state != GAME_OVER) {
		    all.push(stage.pill);
		    state = GAME_CTLPILL;
		}
	    } else {
		state = GAME_BIRTHANDDEATH;
	    }
	}
    }
}

// call all animatable objects with current time
Stage.prototype.handle_animations = function () {
    var now = Date.now(), done = true;

    for (var i in all) {
	if (all[i] instanceof Virus || all[i] instanceof Splode) {
	    all[i].animate(now);
	    done = done && all[i].done;

	}
    }
    return done;
}
Stage.prototype.handle_rhs = function () {
    var now = Date.now();

    for (i in anims) {
	anims[i].animate(now);
    }
}

// The main game loop
var main = function () {
    if (state == GAME_CTLPILL) {
	stage.handle_moves();
	stage.handle_animations();
	stage.handle_rhs();
	stage.render();
    } else if (state == GAME_LOAD) {
	var checks = [].concat(bgIms,pillIms,halfIms,[virusIms,splodeIms]);
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
	stage.handle_fall();
	stage.handle_animations();
	stage.handle_rhs();
	stage.render();
    } else if (state == GAME_BIRTHANDDEATH) {
	var done = stage.handle_animations();
	stage.handle_rhs();
	if (done) {
	    last_update = Date.now(); // animations shouldn't make pills fall faster
	    matches = board.seek_matches();
	    all = board.kill_matches(matches);
	    if (matches.length == 0) {
		state = GAME_FALLING;
	    } else {
		state = GAME_BIRTHANDDEATH;
	    }
	} else {
	    all = board.obtain_elements();
	}
	stage.render();
    }
};

// create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 640;
canvas.height = 480;
document.body.appendChild(canvas);

// load sprites
var bgIms = [new Sprite("images/background.png")];
var halfIms = [ // yel, tea, mag
    new Sprite("images/pilly.png"),
    new Sprite("images/pillt.png"),
    new Sprite("images/pillm.png")];
var pillIms = [ // yel, tea, mag
    new Sprite("images/pillyy.png"), // 00
    new Sprite("images/pillym.png"), // 02
    new Sprite("images/pillty.png"), // 10
    new Sprite("images/pilltt.png"), // 11
    new Sprite("images/pillmt.png"), // 21
    new Sprite("images/pillmm.png")];// 22
var virusIms = new Sprite("images/virus.png"); // yel, tea, mag
var splodeIms = new Sprite("images/splode.png");
var anims = [new AnimSprite("images/doctor.png",[0.722, 0.396],[1, 9]),
	     new AnimSprite("images/patient.png",[0.611, 0.6], [1, 2]),
	     new AnimSprite("images/radio.png",[0.856, 0.235],[1,4])];
// add animation logic for one-off animations
for (i in anims) {
    anims[i].last_update = Date.now();
    anims[i].state = 0;
}
anims[0].animate = function (now) { // doctor
    if ((now - this.last_update) > cfg.animate_wait_time*2) {
	if (this.state == 0) {
	    this.spritepos[1] = (this.spritepos[1] + 1) % 8;
	    this.last_update += cfg.animate_wait_time*2;
	} else if (this.state == 1) {
	    this.spritepos[1] = 0;
	    this.state = 0;
	}
    }
}
anims[0].insert = function () { // add a pill
    this.state = 1;
    this.spritepos[1] = 8;
}
anims[1].animate = function (now) { // patient
    var states = Math.round(10000/cfg.animate_wait_time);
    if ((now - this.last_update) > cfg.animate_wait_time) {
	this.state = (this.state + 1) % states;
	if (this.state == states-2) {
	    this.spritepos[1] = (this.spritepos[1] + 1) % 2;
	} else if (this.state == states-1) {
	    this.spritepos[1] = (this.spritepos[1] + 1) % 2;
	}
	this.last_update += cfg.animate_wait_time;
    }
}
    

// game objects
var cfg = {
    user_fall_rate : 500, // how long between falls
    grav_fall_rate : 250, // how long between falls
    fast_move : 100, // how long between moves in fast mode
    fast_start : 500, // how long to press down before fast mode
    vir_rep : 3,
    animate_wait_time : 300,
    splode_wait_time : 100
};
var state = GAME_LOAD;
var last_update = Date.now();
var points = 0;

var stage = new Stage([[[10,15],COL_MAG],[[11,16],COL_TEA],[[12,17],COL_YEL]]);
// handle keyboard controls
var input = new Input();
addEventListener("keydown", function (e) {
    input.keyEvent[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
    delete input.keyEvent[e.keyCode];
}, false);

// start main loop
setInterval(main, FRIENDLY); // execute every friendly ms
