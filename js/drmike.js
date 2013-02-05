/*
   drmike.js -- main setup

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

// utilities
var tableToList = function (t) {
    var out = [];
    for (var i in t) {
	out.push(t[i]);
    }
    return out;
};

var realMod = function(n,m) {
    n = n % m;
    if (n < 0) {
	n += m;
    }
    return n;
};
var randN = function (n) { // 0 ... n-1 random num
    return Math.floor(Math.random()*n);
}
var repeatN = function (m,n) { // m n times
    var out = [];
    for (var i = 0 ; i < n ; i++) {
	out[i] = m;
    }
    return out;
}
var draw_text = function (text,where,fill,font) {
    if (fill == undefined) {
	fill = "rgb(250, 250, 250)";
    }
    if (font == undefined) {
	font = "24px Helvetica";
    }
    ctx.fillStyle = fill;
    ctx.font = font;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(text, Math.round(where[0]), Math.round(where[1]));
};

// random class-like things
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
var AnimSprite = function (filenmOrSprite, pos, layout, seq, begin, scale) {
    // sprite based on it, where it goes, sprite layout, animation sequence, where to start, 
    // x coordinate of animation sequence, scaling parameter
    if (filenmOrSprite instanceof Sprite) {
	this.sprite = filenmOrSprite;
    } else {
	this.sprite = new Sprite(filenmOrSprite);
    }
    this.pos = [Math.round(pos[0]*canvas.width), Math.round(pos[1]*canvas.height)];
    this.layout = layout;

    this.last_update = Date.now();
    this.seq = seq;
    this.seqstate = 0;
    this.state = 0;
    if (begin == undefined) {
	var begin = 0;
    }
    this.spritepos = [begin, this.seq[this.seqstate]];
    this.wait_time = cfg.animate_wait_time;
};
AnimSprite.prototype.render = function () {
    var sw = this.sprite.image.width/this.layout[0];
    var sh = this.sprite.image.height/this.layout[1];
    ctx.drawImage(this.sprite.image, this.spritepos[0]*sw, this.spritepos[1]*sh, sw, sh,
		  this.pos[0], this.pos[1], sw, sh);
};
AnimSprite.prototype.animate = function (now) {
    if ((now - this.last_update) > this.wait_time) {
	this.seqstate = (this.seqstate + 1) % this.seq.length;
	this.spritepos[1] = this.seq[this.seqstate];
	this.last_update = this.last_update + this.wait_time;
    }
};


// the board and its related stuff
var Board = function () {
    this.width = 16;
    this.height = 20;
    this.viruses = [0,0,0];
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
	game.points.pharma += 1000;
	game.points.combos += Math.round(1000*(game.combo-1)/10)*10;
	game.combo *= 1.1;
	game.points.highdos += Math.round((1000*Math.pow(1.1,matches[i].length-4) - 1000)/10)*10;
    }
    return this.obtain_elements();
}

Board.prototype.obtain_elements = function () {
    // now run through the board, return objects still on it. let them adjust themselves if
    // necessary (pills may have to return just a half-pill)
    var ordered = [];
    this.viruses = [0,0,0];
    for (var i = 0 ; i < this.width ; i++) {
	for (var j = 0 ; j < this.height ; j++) {
	    if (this[i][j] != null) {
		var newbie = this[i][j].adjust();
		ordered[ordered.length] = newbie;
		if (this[i][j] instanceof Virus) {
		    this.viruses[this[i][j].color(i,j)]++;
		}
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

// occupants of the board are viruses or pills
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
    var ret = this.place([this.pos[0] + offset[0], this.pos[1] + offset[1]]);
    return ret;
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
    this.cycle = cfg.vir_rep[game.virspeed];
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
    var success = false;
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
	    success = true;
	}
	this.cycle = cfg.vir_rep[game.virspeed];
    }
    return success;
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
		this.aniseq = 1;
		this.spritepos[1] = 4
	    }
	} else if(this.ani_state == VIR_ANI_FIDGET) {
	    var fidget_order = [4,5,6,5];
	    this.spritepos[1] = fidget_order[this.aniseq];
	    if (this.aniseq == fidget_order.length) {
		this.spritepos[1] = 0;
		this.aniseq = randN(4)+2;
		this.ani_state = VIR_ANI_BREATHE;
	    } else {
		this.aniseq++;
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

var HalfPill = function() {
    // two possible constructors: frompill, which_half, build from a pill
    // or pos, color, rotation
    this.locations = [[0,0]];
    if (arguments.length == 2) {
	frompill = arguments[0];
	which_half = arguments[1];
	this.pos = frompill.getpos(which_half);
	if (which_half == 0) {
	    this.rotation = frompill.rotation;
	} else {
	    this.rotation = (frompill.rotation + 2) % 4;
	}
	this.colors = frompill.colors[which_half];
    } else if (arguments.length == 3) {
	this.pos = arguments[0];
	if (! this.place(this.pos)) {
	    return false;
	}
	this.colors = arguments[1];
	this.rotation = arguments[2];
    }
    this.sprite = halfIms[this.colors];	
    return true;
}
HalfPill.prototype = new Occupant();

var Pill = function(pilltype) {
    this.rotation = 0; // number of 90 degree rotations
    this.locations = [[0,0],ROT_SND[this.rotation]]; // offsetted locations in board occupied by this sprite
    this.colors = COL_PILLS[pilltype];
    this.pilltype = pilltype;
    this.pos = [];
    this.deadpill = false;
    if (! this.place([board.width/2 , 0])) {
	this.deadpill = true;
	stage.end_stage(false);
    }
    this.sprite = pillIms;
    this.spritepos = [0,pilltype*2];
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
    var newrotation = realMod(this.rotation + offset,4);
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
    return true;
};
Pill.prototype.brotate = function (offset) {
    // rotate with a possible bump off a nearby object
    offsets = [[0,0],[-1,0],[1,0]];
    ioffsets = offsets.map(function (x) {return [-x[0],-x[1]]});
    for (var off in offsets) {
	if(this.move(offsets[off])) {
	    if (this.rotate(offset)) {
		return true;
	    } else {
		this.move(ioffsets[off]);
	    }
	}
    }
};	    
	
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

var Points = function () {
    this.standing = 0;
    this.pharma = 0;
    this.combos = 0;
    this.highdos = 0;
    this.speed = 0;
};
Points.prototype.speed_bonus = function () {
    var val = Math.round(10000*(1 - (Date.now() - stage.begin_level)/(10*60*1000))/10)*10;
    if (val < 0) {
	val = 0;
    }
    this.speed += Math.round(val);
};
Points.prototype.points = function () {
    return this.standing + this.pharma + this.combos + this.highdos + this.speed;
};
Points.prototype.reset = function () {
    this.pharma = 0;
    this.combos = 0;
    this.highdos = 0;
    this.speed = 0;
};
Points.prototype.accum = function () {
    this.standing += this.pharma + this.combos + this.highdos + this.speed;
    this.reset();
};

// end of definitions of class-like things

// remove the no javascript warning
document.getElementById("warning").style.display = "none";

// create the canvas
var canvas = document.getElementById("drmike");
var ctx = canvas.getContext("2d");
canvas.width = 640;
canvas.height = 480;
ctx.imageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
document.body.appendChild(canvas);

// load sprites
var bgIms = {
    game:new Sprite("images/background.png"), intro:new Sprite("images/intro.png"),
    instructions:new Sprite("images/instructions.png"), options:new Sprite("images/options.png"),
    credits:new Sprite("images/credits.png"), pause:new Sprite("images/pause.png"),
    lose:new Sprite("images/lose.png"), win:new Sprite("images/win.png"),
    introtext:new Sprite("images/introtext.png"), loadtext:new Sprite("images/loadtext.png"),
    logo:new Sprite("images/logo.png"), challenge:new Sprite("images/challenge.png"),
    survival:new Sprite("images/survival.png"), complete: new Sprite("images/complete.png")
};
var halfIms = [ // yel, tea, mag
    new Sprite("images/pilly.png"),
    new Sprite("images/pillt.png"),
    new Sprite("images/pillm.png")];
var pillIms = new Sprite("images/pill.png");
var virusIms = new Sprite("images/virus.png"); // yel, tea, mag
var splodeIms = new Sprite("images/splode.png");
var sliderIms = [new Sprite("images/slider1.png"), new Sprite("images/slider2.png"), new Sprite("images/slider3.png"),
		 new Sprite("images/slider4.png")];

// game objects
var cfg = {
    user_fall_rate_start : [150,400,400], // how long between falls at beginning
    user_fall_rate_end : [50,50,400], // at end
    grav_fall_rate : 125, // how long between falls
    fast_move : 25, // how long between moves in fast mode
    fast_start : 200, // how long to press down before fast mode
    vir_rep : [3,4,5],
    animate_wait_time : 300,
    splode_wait_time : 100,
    survives : [1, 2, 3, 4, 6, 7, 8, 9, 10, 13] // survival level settings
};
var game = {
    state:GAME_LOAD,
    last_update:Date.now(),
    start_game:Date.now(),
    reproduce : false,
    points : new Points(),
    combo : 1,
    level : 0, // challenge number 0-9
    survive : 1, // approx fill percentage
    music : true,
    sfx : true,
    pillspeed : 1,
    virspeed : 1,
    playmode : 0,
    handicap: false,
    challenges : repeatN(false,10) // challenges completed
};

var anims = {doctor:new AnimSprite("images/doctor.png",[0.606,0.375],[1, 5],
			    [0,1,0,2,0,1,3,2]),
	     patient:new AnimSprite("images/patient.png",[0.606, 0.606], [1, 2],
			   repeatN(0,30).concat([1,0,1])),
	     screen:new AnimSprite("images/screen.png",[0.861, 0.3825],[1,2],[0]),
	     cloud:new AnimSprite("images/cloud.png",[0.75, 0.09],[1,4],[0,1,2,3]), // this isn't in the right location yet, didn't have time to finish
	     pill:new AnimSprite(pillIms, [0.792, 0.175], [1, COL_PILLS.length],
		   [randN(COL_PILLS.length)]),
	     virus1:new AnimSprite(virusIms,[0.842, 0.148],[3,13],[0,1,2,3]),
	     virus2:new AnimSprite(virusIms,[0.842, 0.192],[3,13],[0,1,2,3],1),
	     virus3:new AnimSprite(virusIms,[0.842, 0.238],[3,13],[0,1,2,3],2),
};
animOrder = ["doctor","patient","screen","cloud","pill","virus1","virus2","virus3","heldpill","finger"];

var snds = {
    thud:new SoundFX("snd/thud"),kill:new SoundFX("snd/kill"),
    birth:new SoundFX("snd/birth"),win:new SoundFX("snd/bell"),
    lose:new SoundFX("snd/dead")
};
var fingSprite = new AnimSprite("images/fingers.png",[0.606, 0.37],[1, 1], [0],0,1); // only animation that's temporary but not loaded
// animation-specific stuff
anims.doctor.insert = function (ind) { // add a pill
    this.spritepos[1] = 4;
    this.last_update = Date.now();
    anims.heldpill = new AnimSprite(pillIms,[0.617, 0.365],[1, COL_PILLS.length], [ind]);
    anims.finger = fingSprite;
    this.animate = function (now) {
	if ((now - this.last_update) > this.wait_time*2) {
	    this.last_update += this.wait_time;
	    delete anims.heldpill;
	    delete anims.finger;
	    this.spritepos[1] = 0;
	    delete this.animate;
	}
    }
};
anims.screen.render = function () {
    var sw = this.sprite.image.width/this.layout[0];
    var sh = this.sprite.image.height/this.layout[1];
    ctx.drawImage(this.sprite.image, this.spritepos[0]*sw, this.spritepos[1]*sh, sw, sh,
		  this.pos[0], this.pos[1], sw, sh);
    var spriteByMusic = {true:1, false:0};
    this.seq = [spriteByMusic[game.music]];
};


// handle keyboard controls
var input = new Input();
addEventListener("keydown", function (e) {
    input.keyEvent[e.keyCode] = true;
    if (e.keyCode in PKEYS) {
	e.preventDefault();
    } // try to prevent scrolling
}, false);

addEventListener("keyup", function (e) {
    delete input.keyEvent[e.keyCode];
    if (e.keyCode in PKEYS) {
	e.preventDefault();
    }
}, false);

var menu = undefined;

logowait = function () {
    if (bgIms.logo.ready) {
	ctx.drawImage(bgIms.logo.image, 0, 0);
	setTimeout(function () {
	    menu = new Menu();
	}, 2000);
    } else {
	setTimeout(logowait,FRIENDLY);
    }
}; 

setTimeout(logowait,FRIENDLY);
