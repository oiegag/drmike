var Music = function () {
    this.playing = false;
    this.loaded = false;
}
Music.prototype.load = function () {
    if (this.loaded == false) {
	this.file = new Audio("snd/song1.ogg");
	this.file.addEventListener('canplaythrough',function () {
	    music.loaded = true;
	    this.removeEventListener('canplaythrough', arguments.callee, false);
	}, false);
    }
};
Music.prototype.end = function () {
    if (! this.playing) {
	return;
    }
    this.file.pause();
    this.file.currentTime = 0;
    this.playing = false;
};
Music.prototype.play = function () {
    if (this.playing) {
	return;
    }
    if (this.loaded) {
	this.file.play();
	this.playing = true;
    } else {
	this.file.addEventListener('canplaythrough',function () {
	    music.play();
	    this.removeEventListener('canplaythrough', arguments.callee, false);
	}, false);
    }
};

music = new Music();
