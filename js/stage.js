/*
   stage.js -- sets up global stuff for a stage you're in

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

var Stage = function () {
    game.state = GAME_LOAD;

    board = new Board();
    this.pill = this.new_pill();
    all = [this.pill];
    if (game.playmode == 0) {
	this.new_challenge(game.level);
    } else if (game.playmode == 1) {
	this.new_survive(game.survive);
    }
    all = board.obtain_elements(); // kinda redundant, but counts viruses too
    this.reset_all_timers(-1); // total reset
    game.points.accum();
    game.last_update = Date.now();
    if (game.music) {
	music.load();
	music.play();
    }
    this.begin_level = Date.now();
    setTimeout(this.main, FRIENDLY); // execute every friendly ms
};
Stage.prototype.new_survive = function (survive) {

    // ramp probability from 50% to 10% at fillmax
    ramp = function (j) {return Math.exp(-Math.pow((board.height-j)/game.survive,2))};
    for (var i = 0 ; i < board.width ; i++) {
	for (var j = 0 ; j < board.height ; j++) {
	    if (j > 6 && Math.random() < ramp(j)) {
		all.push(new Virus([i,j],randN(3)));
	    }
	}
    }
};
Stage.prototype.draw_score = function (won) {
    if (game.playmode == 0) {
	draw_text(game.level+1, [0.19*canvas.width,0.206*canvas.height], "rgb(0,0,0)", "18px Helvetica");
    } else if (game.playmode == 1) {
	draw_text(game.survive, [0.19*canvas.width,0.206*canvas.height], "rgb(0,0,0)", "18px Helvetica");
    }
    var subtotal = (game.points.pharma + game.points.combos + game.points.highdos + game.points.speed);
    draw_text(randN(1000000), [0.36*canvas.width,0.261*canvas.height], "rgb(0,0,0)", "18px Helvetica");
    draw_text('$'+game.points.standing, [0.36*canvas.width,0.3025*canvas.height], "rgb(0,0,0)", "18px Helvetica");
    draw_text('$'+game.points.pharma, [0.36*canvas.width,0.351*canvas.height], "rgb(0,0,0)", "18px Helvetica");
    draw_text('$'+game.points.combos, [0.36*canvas.width,0.390*canvas.height], "rgb(0,0,0)", "18px Helvetica");
    draw_text('$'+game.points.highdos, [0.36*canvas.width,0.430*canvas.height], "rgb(0,0,0)", "18px Helvetica");
    draw_text('$'+game.points.speed, [0.36*canvas.width,0.472*canvas.height], "rgb(0,0,0)", "18px Helvetica");
    draw_text('$'+ subtotal, [0.36*canvas.width,0.523*canvas.height],
	      "rgb(0,0,0)", "18px Helvetica");
    draw_text('$'+game.points.points(), [0.36*canvas.width,0.586*canvas.height], "rgb(0,0,0)", "18px Helvetica");
    if (parent.kongregate != undefined && (game.virspeed == 1 && game.pillspeed == 1) && won) {
	if (game.playmode == 0) {
	    parent.kongregate.stats.submit("Score_Lvl" + (game.level+1),subtotal);
	} else if (game.playmode == 1) {
	    parent.kongregate.stats.submit("Score_Survival",game.points.points());
	}
    }
};
Stage.prototype.get_fall_rate = function () {
    var ending = cfg.user_fall_rate_end[game.pillspeed],beginning = cfg.user_fall_rate_start[game.pillspeed];
    return (ending - beginning)*
	(Date.now() - this.begin_level)/(15*60*1000) + beginning;
};
Stage.prototype.new_challenge = function (level) {
    var virus_key = "ytm";
    var pill_key = "0123456789ab";

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
};
Stage.prototype.levels = [
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
    "................",
    "................",
    "......tttt......",
    "y..............m"],
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
    "......0110......",
    "......yyyy......",
    "......mmtt......",
    "......ttmm......",
    "......mmtt......"],
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
    ".......22.......",
    ".......tt.......",
    "......2..2......",
    "......0..0......",
    "......0..0......",
    "......m..m......",
    "....11122111....",
    "tt..yyyyyyyy..tt",
    "mm............mm"],
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
    "......0..0......",
    "......t20m......",
    "......y11y......",
    "......m02t......",
    "......m02t......",
    "......y11y......",
    "......t20m......"],
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
    "..00022200022200",
    "1mtttttttttttttt",
    "1mt............t",
    "1mtttttttttttttt",
    "0myyyyyyyyyyyyyy",
    "0my............y",
    "0myyyyyyyyyyyyyy",
    "1mtttttttttttttt",
    "1mt............t",
    "1mtttttttttttttt",
    "0myyyyyyyyyyyyyy",
    "0my............y",
    "0myyyyyyyyyyyyyy"],
   ["................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "..02000222000222",
    "12tttttttttttttt",
    "12..............",
    "12..............",
    "0020222000222000",
    "12tttttttttttttt",
    "12..............",
    "12..............",
    "0002000222000222",
    "12tttttttttttttt",
    "12..............",
    "12.............."],
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
   [".y2..........2t.",
    ".y2..........2t.",
    ".y2..........2t.",
    ".y0..........0t.",
    ".y0..........0t.",
    ".y0..........0t.",
    ".y2..........2t.",
    ".y2..........2t.",
    ".y2..........2t.",
    ".y0..........0t.",
    ".y0..........0t.",
    ".y0..........0t.",
    ".y2..........2t.",
    ".y2..........2t.",
    ".y2..........2t.",
    ".y0..........0t.",
    ".y0..........0t.",
    ".y0..........0t.",
    ".ym..........mt.",
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
    "...............t"]
];

Stage.prototype.new_pill = function () {
    ind = anims.pill.seq[0];
    anims.pill.seq[0] = randN(COL_PILLS.length);
    anims.doctor.insert(ind); // animate dr mario putting it in
    return new Pill(ind);
}
Stage.prototype.handle_reproduce = function () {
    var anyonereproduced = false;
    for (i in all) {
	if (all[i].reproduce()) {
	    anyonereproduced = true;
	}
    }
    game.reproduce = false;
    if (anyonereproduced) {
	snds.birth.play();
    }
};

Stage.prototype.handle_moves = function (modifier) {
    var now = Date.now(), dir = null, rot = null;

    // convert the keys to more like a d-pad, only one direction at a time
    if ((KEY.lt in input.keyEvent) && !(KEY.rt in input.keyEvent)
	&& !(KEY.dn in input.keyEvent)) {
	dir = DIR_LT;
    } else if (!(KEY.lt in input.keyEvent) && (KEY.rt in input.keyEvent)
	       && !(KEY.dn in input.keyEvent)) {
	dir = DIR_RT;
    } else if (!(KEY.lt in input.keyEvent) && !(KEY.rt in input.keyEvent)
	       && (KEY.dn in input.keyEvent)) {
	dir = DIR_DN;
    } else {
	dir = DIR_NO;
    }
    // convert rotations to just one
    if ((KEY.d in input.keyEvent) && !(KEY.f in input.keyEvent)) {
	rot = ROT_LEFT;
	delete input.keyEvent[KEY.d];
    } else if (!(KEY.d in input.keyEvent) && (KEY.f in input.keyEvent)) {
	rot = ROT_RIGHT;
	delete input.keyEvent[KEY.f];
    } else {
	rot = ROT_NONE;
    }

    if (rot != ROT_NONE) {
	stage.pill.brotate(rot);
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

    var fall_rate = stage.get_fall_rate();
    if ((now - game.last_update) > fall_rate) {
	if(! stage.pill.fall()) {
	    snds.thud.play();
	    // clear the input so we don't begin in a free fall
	    input.pressed = false;
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
		snds.kill.play();
		game.state = GAME_BIRTHANDDEATH;
	    }
	}
	game.last_update = game.last_update + fall_rate;
    }
};


// draw everything
Stage.prototype.render = function () {
    ctx.drawImage(bgIms.game.image, 0, 0);
    
    for (var i in animOrder) {
	if (anims[animOrder[i]] != undefined) {
	    anims[animOrder[i]].render();
	}
    }

    for(var i = 0 ; i < all.length ; i++) {
	all[i].render();
    }
    
    draw_text(board.viruses[0], [0.88*canvas.width,0.148*canvas.height], "rgb(0,0,0)", "18px Helvetica");
    draw_text(board.viruses[1], [0.88*canvas.width,0.193*canvas.height], "rgb(0,0,0)", "18px Helvetica");
    draw_text(board.viruses[2], [0.88*canvas.width,0.238*canvas.height], "rgb(0,0,0)", "18px Helvetica");
    draw_text("$" + game.points.points().toString(), [0.8*canvas.width,0.28*canvas.height], "rgb(0,0,0)", "18px Helvetica");
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
		snds.kill.play();
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
	anims[i].animate(now);
    }
}

Stage.prototype.end_stage = function (won) {
    if (! won) {
	game.state = GAME_PAUSE;
	game.oldstate = GAME_OVER;
	ctx.drawImage(bgIms.lose.image, 0, 0);
	snds.lose.play();
	music.pause();
	stage.draw_score(won);
    } else {
	game.state = GAME_PAUSE;
	game.oldstate = GAME_OVER;
	ctx.drawImage(bgIms.win.image, 0, 0);
	snds.win.play();
	game.points.speed_bonus();
	stage.draw_score(won);
	if (game.challenges.reduce(function (x,y) {return x && y;})) {
	    ctx.drawImage(bgIms.complete.image, 0, 0);
	    game.playmode = 1;
	    if (parent.kongregate != undefined && !game.handicap) {
		parent.kongregate.stats.submit("GameComplete",1);
		parent.kongregate.stats.submit("CompleteTime",Math.round((Date.now()-game.start_game)/(60*1000)));
	    }
	}
    }
};
Stage.prototype.reset_all_timers = function (howlong) {
    if (howlong == -1) {
	game.last_update = Date.now();
	for (i in all) {
	    if (all[i] instanceof Virus) {
		all[i].last_update = Date.now();
	    }
	}
	for (i in anims) {
	    anims[i].last_update = Date.now();
	}
    } else {
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
}

// The main game loop
Stage.prototype.main = function () {
    if (game.state != GAME_PAUSE) {
	if (KEY.sp in input.keyEvent) {
	    game.oldstate = game.state;
	    game.state = GAME_PAUSE;
	    game.pause_time = Date.now();
	    if (game.music) {
		music.pause();
	    }
	    ctx.drawImage(bgIms.pause.image, 0, 0);
	    delete input.keyEvent[KEY.sp];
	}
	if (KEY.m in input.keyEvent) {
	    if (game.music) {
		music.end();
	    } else {
		music.play();
	    }
	    game.music = ! game.music;
	    delete input.keyEvent[KEY.m];
	}
    }
    if (KEY.o in input.keyEvent) { // reset the level
	if (game.state == GAME_PAUSE) {
	    stage.reset_all_timers(Date.now() - game.pause_time); // sad sad state of the world we live in
	}
	game.state = GAME_LOAD;
	game.points.reset();
	stage = new Stage();
	delete input.keyEvent[KEY.o];
    }

    if (KEY.q in input.keyEvent) { // quit
	game.state = GAME_OVER;
    }

    if (game.state == GAME_CTLPILL) {
	game.combo = 1; // reset combo when control is back with the player
	stage.handle_moves();
	stage.handle_animations();
	stage.handle_rhs();
	stage.render();
    } else if (game.state == GAME_LOAD) {
	stage.reset_all_timers(Date.now() - game.last_update);
	game.state = GAME_CTLPILL;
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
		snds.kill.play();
		game.state = GAME_BIRTHANDDEATH;
	    }
	} else {
	    all = board.obtain_elements();
	}
	stage.render();
    } else if (game.state == GAME_PAUSE) {
	if (KEY.sp in input.keyEvent) {
	    game.state = game.oldstate;
	    stage.reset_all_timers(Date.now() - game.pause_time); // sad sad state of the world we live in
	    if (game.music) {
		music.play();
	    }
	    delete input.keyEvent[KEY.sp];
	}
    } else if (game.state == GAME_CESSATION) {
	if (game.reproduce == true) { // all tired out?
	    stage.handle_reproduce();
	    game.state = GAME_BIRTHANDDEATH;
	} else {
	    stage.pill = stage.new_pill();
	    stage.handle_rhs();
	    if (! stage.pill.deadpill) {
		all.push(stage.pill);
		game.state = GAME_CTLPILL;
		game.last_update = Date.now();
	    }
	    if (board.viruses[0] == 0 && board.viruses[1] == 0 && board.viruses[2] == 0) {
		if (game.playmode == 0 && (game.level+1) == stage.levels.length) {
		    game.challenges[game.level] = true;
		    stage.end_stage(true);
		} else {
		    if (game.playmode == 0) {
			game.challenges[game.level] = true;
		    }
		    ctx.drawImage(bgIms.win.image, 0, 0);
		    snds.win.play();
		    game.points.speed_bonus();
		    stage.draw_score(true);
		    game.oldstate = GAME_NEWLVL;
		    game.state = GAME_PAUSE;
		    game.pause_time = Date.now();
		}
	    }
	}
    } else if (game.state == GAME_OVER) {
	menu = new Menu();
	music.end();
	return; // no continuation of the stage
    } else if (game.state == GAME_NEWLVL) {
	if (game.playmode == 0) {
	    game.level++;
	} else if (game.playmode == 1) {
	    game.survive += .25;
	}
	stage = new Stage();
	game.state = GAME_LOAD;
    }
	
    setTimeout(stage.main,FRIENDLY);
};
