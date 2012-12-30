// initial plan: pop a pill at the top, let gravity let it drop to the bottom with controls, then stay there

// consts
// keyboard
var KEY_UP = 38;
var KEY_DN = 40;
var KEY_RT = 39;
var KEY_LT = 37;
// d-pad stats
var DIR_NO = 0
var DIR_LT = 1
var DIR_RT = 2
var DIR_DN = 3

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
var last_update = Date.now();
var pressed = false;
var points = 0;
var dir = DIR_NO;

var Pill = function() {
    this.under_ctl = true;
    this.x = canvas.width/2;
    this.y = canvas.height/5;
};
Pill.prototype.fall = function () {
    if (this.y > canvas.height * 4/5) {
	this.under_ctl = false;
    } else {
	this.y += 40;
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

    chg = [0,-20,20,0]; // x coordinate swaps to reduce nesting of ifs
    
    if (now - last_update > 500) {
	pill.fall();
	last_update = now;
    }

    if (pill.under_ctl) {
	if ((dir == DIR_RT) || (dir == DIR_LT)) {
	    if (pill.pressed == false) {
		pill.x += chg[dir]
		pill.pressed = {
		    dir : dir,
		    start : now,
		    wait : 500
		}
	    } else if (pill.pressed.dir != dir) {
		pill.x += chg[dir]
		pill.pressed = {
		    dir : dir,
		    start : now,
		    wait : 500
		}
	    } else { // same thing as last time pressed
		if ( (now - pill.pressed.start) > pill.pressed.wait) {
		    pill.x += chg[dir];
		    pill.pressed = {
			dir : dir,
			start : now,
			wait : 100
		    }
		}
	    }
	} else if (dir == DIR_NO) {
	    pill.pressed = false;
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
	    ctx.drawImage(pillIm.image, all[i].x, all[i].y);
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
    update();
    render();
};

// Let's play this game!
setInterval(main, 1); // Execute as fast as possible
