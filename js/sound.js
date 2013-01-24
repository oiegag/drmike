// sound loading setup
var SoundFile = function (filenm,parent,loop) {
    this.playing = false;
    this.loaded = false;
    this.error = false;
    this.loop = loop;
    this.parent = parent;
    this.filenm = filenm;
}
SoundFile.prototype.load = function () {
    if (! this.loaded) {
	this.file = new Audio(this.filenm);
	this.file.parent = this;
	this.file.addEventListener('canplaythrough',function () {
	    this.parent.loaded = true;
	    this.parent.parent.register(this.parent,true);
	    this.removeEventListener('canplaythrough', arguments.callee, false);
	    if (this.parent.loop) {
		this.addEventListener('ended',function () {
		    this.parent.playing = false;
		    this.parent.play();
		}, false);
	    } else {
		this.addEventListener('ended',function () {
		    this.parent.playing = false;
		}, false);
	    }
	}, false);
	this.file.addEventListener('error',function () {
	    this.parent.error = true;
	    this.parent.loaded = true;
	    this.parent.parent.register(this.parent,false);
	    this.removeEventListener('error', arguments.callee, false);
	}, false);
    }
};
SoundFile.prototype.end = function () {
    if (! this.playing || this.error) {
	return;
    }
    this.file.pause();
    this.file.currentTime = 0;
    this.playing = false;
};
SoundFile.prototype.play = function () {
    if (this.playing || this.error) {
	return;
    }

    if (this.loaded) {
	this.file.play();
	this.playing = true;
    }
};

var Sound = function (trylist,loop) {
    this.loaded = false;
    this.playonload = false;
    this.trying = 0;
    this.trylist = trylist;
    this.error = false;
    this.loop = loop;
};
Sound.prototype.load = function () {
    if (! this.loaded) {
	this.kid = new SoundFile(this.trylist[this.trying],this,this.loop);
	this.kid.load();
    }
};
Sound.prototype.register = function(which,working) {
    if (working) {
	this.mine = which;
	this.loaded = true;
	if (this.playonload) {
	    this.mine.play();
	}
    } else {
	this.trying++;
	if (this.trying == this.trylist.length) {
	    this.loaded = true;
	    this.error = true;
	} else {
	    this.kid = new SoundFile(this.trylist[this.trying],this,this.loop);
	    this.kid.load();
	}
    }
};
Sound.prototype.play = function () {
    if (this.loaded && ! this.error) {
	this.mine.play();
    } else {
	this.playonload = true;
    }
};
Sound.prototype.end = function () {
    if (this.loaded && ! this.error) {
	this.mine.end();
    }
};
// now a subobject for the effects
var SoundFX = function (audiofile) {
    this.mine = new Sound([audiofile+".ogg", audiofile+".mp3"],false);
    this.mine.load();
};
SoundFX.prototype.play = function () {
    if (game.sfx) { // weird choice of ordering here..
	this.mine.play();
    }
};
SoundFX.prototype.loaded = function () {
    return this.mine.loaded;
};


var music = new Sound(["snd/song1.ogg","snd/song1.mp3"],true);
