// front-end menus
// so numbering states was kind of stupid, let's try callbacks.
var Menu = function (bg,ptr) {
    this.state = this.main;
    this.choice = 0;
    this.running = true;
    setTimeout(this.callback, FRIENDLY);
};
Menu.prototype.wait_for = function (waitfors) {
    var finished = true;
    for (i in waitfors) {
	if (! waitfors[i].ready) {
	    finished = false;
	}
    }
    return finished;
};
Menu.prototype.callback = function () {
    menu.state.call(menu);
    if (menu.running == true) {
	setTimeout(menu.callback, FRIENDLY);
    }
};
Menu.prototype.main = function () {
    if (! this.wait_for([bgIms.intro,virusIms,bgIms.loadtext])) {
	return;
    }
    ctx.drawImage(bgIms.intro.image, 0, 0);
    ctx.drawImage(virusIms.image, 0, 0, SQUARESZ, SQUARESZ, 0.323*canvas.width, 
		  (0.645 + this.choice*0.092)*canvas.height, SQUARESZ, SQUARESZ);
    ctx.drawImage(bgIms.introtext.image, .3895*canvas.width, .633*canvas.height);
    if (KEY.dn in input.keyEvent) {
	delete input.keyEvent[KEY.dn];
	this.choice = realMod(this.choice + 1,4);
    }
    if (KEY.up in input.keyEvent) {
	delete input.keyEvent[KEY.up];
	this.choice = realMod(this.choice - 1,4);
    }
    if (KEY.en in input.keyEvent) {
	var choices = [this.lvlselect, this.options, this.instructions, this.credits];
	delete input.keyEvent[KEY.en];
	this.state = choices[this.choice];
	this.opt_choice = 0;
    }
};
Menu.prototype.lvlselect = function () {
    if (! bgIms.challenge.ready) {
	return;
    }
    ctx.drawImage(bgIms.challenge.image, 0, 0);
    ctx.drawImage(sliderIms[3].image, (0.07 + realMod(game.level,5)*0.173)*canvas.width,
		  (0.26+0.27*Math.floor(game.level/5))*canvas.height);
    if (KEY.en in input.keyEvent) {
	delete input.keyEvent[KEY.en];
	this.state = this.start_game;
    }
    if (KEY.dn in input.keyEvent) {
	delete input.keyEvent[KEY.dn];
	game.level = realMod(game.level + 5,10);
    }
    if (KEY.up in input.keyEvent) {
	delete input.keyEvent[KEY.up];
	game.level = realMod(game.level - 5,10);
    }
    if (KEY.rt in input.keyEvent) {
	delete input.keyEvent[KEY.rt];
	game.level = realMod(game.level + 1,10);
    }
    if (KEY.lt in input.keyEvent) {
	delete input.keyEvent[KEY.lt];
	game.level = realMod(game.level - 1,10);
    }
};
Menu.prototype.start_game = function () {
    var checks = [].concat(tableToList(bgIms),pillIms,halfIms,[virusIms,splodeIms]);
    var ready = true, loaded = 0;
    for (var i = 0 ; i < checks.length ; i++) {
	if (! checks[i].ready) {
	    ready = false;
	} else {
	    loaded++;
	}
    }
    for (var i in snds) {
	if (! snds[i].loaded()) {
	    ready = false;
	} else {
	    loaded++;
	}
    }
    if (ready == true) {
	this.running = false;
	stage = new Stage(game.level);
    } else {
	ctx.drawImage(bgIms.intro.image, 0, 0);
	ctx.drawImage(bgIms.loadtext.image, .3895*canvas.width, .733*canvas.height);
	draw_text(loaded + "/" + (checks.length + Object.keys(snds).length), [.45*canvas.width,.9*canvas.height],'rgb(0,0,0)');
    }
};
Menu.prototype.instructions = function () {
    if (bgIms.instructions.ready) {
	ctx.drawImage(bgIms.instructions.image, 0, 0);
    }
    if (KEY.en in input.keyEvent) {
	delete input.keyEvent[KEY.en];
	this.state = this.main;
    }
};
Menu.prototype.options = function () {
    var bool_ind = {true : 0, false : 1};
    var dir = undefined;
    if (! this.wait_for([bgIms.options,sliderIms[0],sliderIms[1],sliderIms[2]])) {
	return;
    }

    ctx.drawImage(bgIms.options.image, 0, 0);
    ctx.drawImage(virusIms.image, 0, 0, SQUARESZ, SQUARESZ, 0.02*canvas.width, 
		  (0.39 + .12*this.opt_choice)*canvas.height, SQUARESZ, SQUARESZ);
    ctx.drawImage(sliderIms[0].image, (0.43 + bool_ind[game.music]*0.183)*canvas.width, 0.365*canvas.height);
    ctx.drawImage(sliderIms[0].image, (0.43 + bool_ind[game.sfx]*0.183)*canvas.width, 0.485*canvas.height);
    ctx.drawImage(sliderIms[1].image, (0.43 + game.pillspeed*0.182)*canvas.width, 0.605*canvas.height);
    ctx.drawImage(sliderIms[1].image, (0.43 + game.virspeed*0.182)*canvas.width, 0.73*canvas.height);
    ctx.drawImage(sliderIms[2].image, (0.43 + game.playmode*0.27)*canvas.width, 0.85*canvas.height);
    if (KEY.en in input.keyEvent) {
	delete input.keyEvent[KEY.en];
	this.state = this.main;
    }
    if (KEY.dn in input.keyEvent) {
	delete input.keyEvent[KEY.dn];
	this.opt_choice = realMod(this.opt_choice + 1,5);
    }
    if (KEY.up in input.keyEvent) {
	delete input.keyEvent[KEY.up];
	this.opt_choice = realMod(this.opt_choice - 1,5);
    }
    if (KEY.rt in input.keyEvent) {
	delete input.keyEvent[KEY.rt];
	dir = 1;
    }
    if (KEY.lt in input.keyEvent) {
	delete input.keyEvent[KEY.lt];
	dir = -1;
    }
    if (dir != undefined) {
	if (this.opt_choice == 0) { // music
	    game.music = ! game.music;
	} else if (this.opt_choice == 1) { // sfx
	    game.sfx = ! game.sfx;
	} else if (this.opt_choice == 2) { // pill speed
	    game.pillspeed = realMod(game.pillspeed + dir,3);
	} else if (this.opt_choice == 3) { // virus speed
	    game.virspeed = realMod(game.virspeed + dir,3);
	} else if (this.opt_choice == 4) { // play mode
	    game.playmode = realMod(game.playmode + dir,2);
	}
    }
};
Menu.prototype.credits = function () {
    if (bgIms.credits.ready) {
	ctx.drawImage(bgIms.credits.image, 0, 0);
    }
    if (KEY.en in input.keyEvent) {
	delete input.keyEvent[KEY.en];
	this.state = this.main;
    }
};
