var music = function () {
    if (game.state != GAME_LOAD) {
	if (game.music_choice == 0) {
	    return;
	}
	if (music.play_num == undefined) {
	    music.first_time = false;
	    music.play_num = game.music_choice;
	    music.loaded[music.play_num] = new Audio(music.playable[music.play_num]);
	    music.loaded[music.play_num].play();
	} else if (music.loaded[music.play_num].ended) {
	    music.play_num = game.music_choice;
	    if (music.loaded[music.play_num] == undefined) {
		music.loaded[music.play_num] = new Audio(music.playable[music.play_num]);
	    }
	    music.loaded[music.play_num].play();
	}
    }
}

music.play_num = undefined;
music.loaded = [undefined,undefined,undefined,undefined];
music.playable = ["","snd/song1.ogg","snd/song2.ogg","snd/song3.ogg"];

setInterval(music, 1000);
