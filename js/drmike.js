// dr mike

// consts
// game states
var GAME_CTLPILL = 0;
var GAME_OVER = 1;
var GAME_LOAD = 2;
var GAME_FALLING = 3;
var GAME_BIRTHANDDEATH = 4;
var GAME_PAUSE = 5;
var GAME_CESSATION = 6;
// keyboard
var KEY_UP = 38;
var KEY_DN = 40;
var KEY_RT = 39;
var KEY_LT = 37;
var KEY_D = 68; // rotate
var KEY_F = 70; // rotate
var KEY_SP = 32; // pause
var KEY_O = 79; // reset
var KEY_S = 83; // switch music
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
// animations
var ANIM_LASTPILL = 2;
var ANIM_DOCTOR = 3;
var ANIM_RADIO = 5;
var ANIM_VIRUS = 8;

// utilities
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
    // Score
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
    ctx.fillText(text, where[0], where[1]);
};

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
    this.pos = [pos[0]*canvas.width, pos[1]*canvas.height];
    this.layout = layout;
    if (scale == undefined) {
	this.scale = 1;
    } else {
	this.scale = scale;
    }
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
		  this.pos[0], this.pos[1], sw*this.scale, sh*this.scale);
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
    }
    if (matches.length > 0) {
	game.combo += matches.length;
	game.points += 1000*Math.pow(2,game.combo-1);
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
    if (! ret) {
	snds[0].play();
    }
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
    if (! this.place([board.width/2 , 0])) {
	console.log('end of game');
	game.state = GAME_OVER;
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
var Stage = function (level) {
    var virus_key = "ytm";
    var pill_key = "0123456789ab";
    game.last_update = Date.now();
    board = new Board();
    this.pill = this.new_pill();
    all = [this.pill];
    for (var i = 0 ; i < board.width ; i++) {
	for (var j = 0 ; j < board.height ; j++) {
	    chr = this.levels[level][j][i];
	    if ((ind = virus_key.indexOf(chr)) != -1) {
		all.push(new Virus([i,j],ind));
	    } else if ((ind = pill_key.indexOf(chr)) != -1) {
		all.push(new HalfPill([i,j], ind % 3, Math.floor(ind/3)));
	    }
	}
    }
    all = board.obtain_elements(); // kinda redundant, but counts viruses too
}
Stage.prototype.levels = [ // levels are 16 x 20
  ["................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "........t.......",
    "............y...",
    "...m............",
    "................",
    "................"],
    ["................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "..t.............",
    ".............t..",
    "...y...m........",
    "..........m.....",
    ".........y......",
    "................",
    "................"],
    ["................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "m..t..y..m..t..y",
    "................",
    ".y..m..t..y..m..",
    "................"],
    ["................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "...y............",
    ".........t......",
    ".....my...m.....",
    ".............m..",
    "..t.........y...",
    "........t.......",
    "................"],
    ["................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "....t...........",
    "........m.......",
    "..m....y..t...y.",
    "...t....m.......",
    ".y.......t...m..",
    ".....t..........",
    "....m...m...m...",
    "......y.........",
    "...t......y.....",
    "....y.......t...",
    "................"],
    ["................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "....yy..........",
    "...mttmt........",
    "..yt..ymy.......",
    ".tm.....mtm.....",
    ".my......ytmt...",
    "ty.........ymyt.",
    "m............mym",
    "...............t"],
    ["................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "tttttttttttttttt",
    "mmmmmmmmmmmmmmmm",
    "yyyyyyyyyyyyyyyy",
    "tttttttttttttttt",
    "tttttttttttttttt",
    "mmmmmmmmmmmmmmmm",
    "tttttttttttttttt",
    "mmmmmmmmmmmmmmmm",
    "yyyyyyyyyyyyyyyy",
    "tttttttttttttttt"],
    ["................",
    "................",
    "................",
    "................",
    "......mttm......",
    "....ty....yt....",
    "................",
    ".....m..........",
    "..........m.....",
    "......y.........",
    "........t.......",
    "...........t....",
    "................",
    "....y...........",
    "......m.........",
    "................",
    "..........y.....",
    "................",
    "................",
    "......t........."],
    ["................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "ytmytmytmytmytmy",
    "ytmmmmyyyytmmmmt",
    "yttttttttttmtytm",
    "yyyyyyyyyyyyyyyy",
    "tttttttmmmmmmmmm",
    "tmmymmmmyttttyym",
    "mmyymyyyytymmmyy",
    "myytyyttttymymmm",
    "mmttymmmmyyttttm",
    "yyyyymttttttyymm"],
    ["................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "..........m.....",
    ".........mmm....",
    ".........mmm...m",
    "........mmmmm.mm",
    "...yyyy...m...mm",
    "..yyyyyy..m..mmm",
    ".yyyyyyyy.tt...m",
    ".yyyyyyyytttt..m",
    ".yyyyyyytttttttt",
    ".yyyyytttttttttt",
    "..yttttttttttttt",
    "tttttttttttttttt"]
];
Stage.prototype.new_pill = function () {
    ind = anims[2].seq[0];
    anims[2].seq[0] = anims[1].seq[0];
    anims[1].seq[0] = anims[0].seq[0];
    anims[0].seq[0] = randN(COL_PILLS.length);
    anims[ANIM_DOCTOR].insert(ind); // animate dr mario putting it in
    return new Pill(ind);
}
Stage.prototype.handle_reproduce = function () {
    for (i in all) {
	all[i].reproduce();
    }
    game.reproduce = false;
};

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
		game.last_update = now;
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

    if ((now - game.last_update) > cfg.user_fall_rate) {
	if(! stage.pill.fall()) {
	    snds[0].play();
	    // so if you kill matches first, then reproduce it's possible to
	    // grow into a 4-in-a-row that won't be checked until the next
	    // pill comes. if you reproduce then kill, katie gets mad because
	    // you're constantly having them "get away"
	    matches = board.seek_matches();
	    all = board.kill_matches(matches);

	    game.reproduce = true; // tag determines how cessation state goes

	    all = board.obtain_elements();
	    if (matches.length == 0) {
		game.state = GAME_CESSATION;
	    } else {
		snds[1].play();
		game.state = GAME_BIRTHANDDEATH;
	    }
	}
	game.last_update = game.last_update + cfg.user_fall_rate;
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
    
    draw_text(board.viruses[0], [0.73*canvas.width,0.195*canvas.height], "rgb(0,0,0)", "18px Helvetica");
    draw_text(board.viruses[1], [0.73*canvas.width,0.240*canvas.height], "rgb(0,0,0)", "18px Helvetica");
    draw_text(board.viruses[2], [0.73*canvas.width,0.285*canvas.height], "rgb(0,0,0)", "18px Helvetica");
    draw_text("$" + game.points, [0.66*canvas.width,0.34*canvas.height], "rgb(0,0,0)", "18px Helvetica");
};

// make pills fall
Stage.prototype.handle_fall = function () {
    var now = Date.now();

    if ((now - game.last_update) > cfg.grav_fall_rate) {
	game.last_update = game.last_update + cfg.grav_fall_rate;
	var falling = false;
	for (i in all) {
	    thisone = all[i].fall();
	    falling = falling || thisone;
	}
	if (! falling) {
	    matches = board.seek_matches();
	    all = board.kill_matches(matches);
	    if (matches.length == 0) {
		game.state = GAME_CESSATION;
	    } else {
		snds[1].play();
		game.state = GAME_BIRTHANDDEATH;
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
    
    // animate can delete some elements of animate
    for (var i in anims) {
	if (anims[i] != undefined) {
	    anims[i].animate(now);
	}
    }
}

Stage.prototype.reset_all_timers = function (howlong) {
    game.last_update += howlong;
    for (i in all) {
	if (all[i] instanceof Virus) {
	    all[i].last_update += howlong;
	}
    }
    for (i in anims) {
	anims[i].last_update += howlong;
    }
}

// The main game loop
var main = function () {
    if ((game.state != GAME_PAUSE) && (KEY_SP in input.keyEvent)) {
	game.oldstate = game.state;
	game.state = GAME_PAUSE;
	game.pause_time = Date.now();
	if ((music.play_num != undefined) && (music.play_num != 0)) {
	    music.loaded[music.play_num].currentTime = music.loaded[music.play_num].duration;
	    game.music_choice = 0;
	    anims[ANIM_RADIO].seq = [game.music_choice];
	}
	draw_text('PAUSE', [canvas.width*.24, canvas.height*.5]);
	delete input.keyEvent[KEY_SP];
    }
    if ((game.state != GAME_PAUSE) && (KEY_S in input.keyEvent)) {
	if ((music.play_num != undefined) && (music.play_num != 0)) {
	    music.loaded[music.play_num].currentTime = music.loaded[music.play_num].duration;
	}
	game.music_choice = (game.music_choice + 1) % 4;
	anims[ANIM_RADIO].seq = [game.music_choice];
	delete input.keyEvent[KEY_S];
    }
    if (KEY_O in input.keyEvent) { // reset the level
	if (game.state == GAME_PAUSE) {
	    stage.reset_all_timers(Date.now() - game.pause_time); // sad sad state of the world we live in

	}
	game.state = GAME_LOAD;
	stage = new Stage(game.level);
	delete input.keyEvent[KEY_O];
    }

    if (game.state == GAME_CTLPILL) {
	game.combo = 0; // reset combo when control is back with the player
	stage.handle_moves();
	stage.handle_animations();
	stage.handle_rhs();
	stage.render();
    } else if (game.state == GAME_LOAD) {
	var checks = [].concat(bgIms,pillIms,halfIms,[virusIms,splodeIms]);
	var ready = true;
	for (var i = 0 ; i < checks.length ; i++) {
	    if (! checks[i].ready) {
		ready = false;
	    }
	}
	for (var i = 0 ; i < snds.length ; i++) {
	    if (! snds[i].readyState) {
		ready = false;
	    }
	}
	if (ready == true) {
	    game.state = GAME_CTLPILL;
	}
    } else if (game.state == GAME_FALLING) {
	stage.handle_fall();
	stage.handle_animations();
	stage.handle_rhs();
	stage.render();
    } else if (game.state == GAME_BIRTHANDDEATH) {
	var done = stage.handle_animations();
	stage.handle_rhs();
	if (done) {
	    game.last_update = Date.now(); // animations shouldn't make pills fall faster
	    matches = board.seek_matches();
	    all = board.kill_matches(matches);
	    if (matches.length == 0) {
		game.state = GAME_FALLING;
	    } else {
		snds[1].play();
		game.state = GAME_BIRTHANDDEATH;
	    }
	} else {
	    all = board.obtain_elements();
	}
	stage.render();
    } else if (game.state == GAME_PAUSE) {
	if (KEY_SP in input.keyEvent) {
	    game.state = game.oldstate;
	    stage.reset_all_timers(Date.now() - game.pause_time); // sad sad state of the world we live in
	    delete input.keyEvent[KEY_SP];
	}
    } else if (game.state == GAME_CESSATION) {
	if (game.reproduce == true) { // all tired out?
	    stage.handle_reproduce();
	    game.state = GAME_BIRTHANDDEATH;
	} else {
	    stage.pill = stage.new_pill();
	    stage.handle_rhs();
	    if (game.state != GAME_OVER) {
		all.push(stage.pill);
		game.state = GAME_CTLPILL;
		game.last_update = game.last_update + cfg.user_fall_rate;
	    }
	    if (board.viruses[0] == 0 && board.viruses[1] == 0 && board.viruses[2] == 0) {
		game.level++;
		if (game.level == stage.levels.length) {
		    console.log('you win');
		    game.state = GAME_OVER;
		} else {
		    stage = new Stage(game.level);
		}
	    }
	}
    }
};

// create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 640;
canvas.height = 480;
ctx.imageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
document.body.appendChild(canvas);

// load sprites
var bgIms = [new Sprite("images/background.png")];
var halfIms = [ // yel, tea, mag
    new Sprite("images/pilly.png"),
    new Sprite("images/pillt.png"),
    new Sprite("images/pillm.png")];
var pillIms = new Sprite("images/pill.png");
var virusIms = new Sprite("images/virus.png"); // yel, tea, mag
var splodeIms = new Sprite("images/splode.png");


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
var game = {
    state:GAME_LOAD,
    last_update:Date.now(),
    reproduce : false,
    points : 0,
    combo : 0,
    level : 6,
    music_choice : 0
};

var anims = [new AnimSprite(pillIms, [0.678, 0.535], [1, COL_PILLS.length],
			    [randN(COL_PILLS.length)]),
	     new AnimSprite(pillIms, [0.715, 0.535], [1, COL_PILLS.length],
			    [randN(COL_PILLS.length)]),
	     new AnimSprite(pillIms, [0.752, 0.535], [1, COL_PILLS.length],
			    [randN(COL_PILLS.length)]),
	     new AnimSprite("images/doctor.png",[0.722, 0.396],[1, 5],
			    [0,1,0,2,0,1,3,2]),
	     new AnimSprite("images/patient.png",[0.611, 0.6], [1, 2],
			   repeatN(0,30).concat([1,0,1])),
	     new AnimSprite("images/radio.png",[0.856, 0.235],[1,4],[0]),
	     new AnimSprite(virusIms,[0.672, 0.2],[3,13],[0,1,2,3]),
	     new AnimSprite(virusIms,[0.672, 0.245],[3,13],[0,1,2,3],1),
	     new AnimSprite(virusIms,[0.672, 0.29],[3,13],[0,1,2,3],2),
];

var snds = [new Audio("snd/click.ogg"),new Audio("snd/kill.ogg")];
var fingSprite = new AnimSprite("images/fingers.png",[0.72 , 0.40],[1, 1], [0],0,1); // only animation that's temporary but not loaded
// animation-specific stuff
anims[ANIM_DOCTOR].insert = function (ind) { // add a pill
    this.spritepos[1] = 4;
    this.last_update = Date.now();
    anims.push(new AnimSprite(pillIms,[0.735, 0.39],[1, COL_PILLS.length], [ind]));
    anims.push(fingSprite);
    this.animate = function (now) {
	if ((now - this.last_update) > this.wait_time*2) {
	    this.last_update += this.wait_time;
	    // note that it's technically possible to end up getting a bunch of inserts before this function gets called
	    // so you may need to drop multiple copies of fingers/pills here.
	    anims = anims.slice(0,ANIM_VIRUS+1);
	    this.spritepos[1] = 0;
	    delete this.animate;
	}
    }
}

var stage = new Stage(game.level);
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

