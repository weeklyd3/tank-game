var inCutscene = false;
(function(window) {
	async function cutscene(callbacks, prepare, after, options) {
		var settings = {
			fadeoutStart: true,
			fadeoutEnd: true
		};
		for (const k in options) settings[k] = options[k];
		if (settings.fadeoutStart) await advancedFadeOutAndIn([prepare ?? function() {}], false);
		for (const f of callbacks) await f();
		if (settings.fadeoutEnd) await fadeOutAndIn(after ?? function() {});
		else frozen = false;
	}
	function fade(opacityChange = -2, start = 100) {
		return new Promise((resolve) => {
			op = start;
			addEventListener('TankGame.updateDone', function u() {
				op += opacityChange;
				draw.fill('black');
				setOpacity(draw, (100 - op) / 100);
				draw.fill('black');
				draw.rect(0, 0, width, height);
				setOpacity(draw, 1);
				if ((opacityChange < 0 && op <= 0) || (opacityChange > 0 && op >= 100)) {
					removeEventListener('TankGame.updateDone', u);
					resolve();
				}
			})
		});
	}
	async function fadeToBlack() {
		await fade();
		return;
	}
	async function fadeOutAndIn(...betweenCallbacks) {
		advancedFadeOutAndIn(betweenCallbacks, true);
	}
	async function advancedFadeOutAndIn(betweenCallbacks, unpause = true) {
		// pass a bunch of functions to be executed between 
		// the fadeout and the fadein.
		await fade();
		frozen = true;
		const udcb = () => {
			draw.fill('black');
			draw.rect(0, 0, width, height);
			draw.fill('white');
			draw.textSize(20);
			draw.textAlign(draw.LEFT, draw.BOTTOM);
			draw.text('Loading...', 0, height);
		};
		addEventListener('TankGame.updateDone', udcb);
		for (const cb of betweenCallbacks) await cb();
		removeEventListener('TankGame.updateDone', udcb);
		if (unpause) frozen = false;
		await fade(2, 0);
	}
	function wait(ms) {
		return new Promise((a) => setTimeout(a, ms));
	}
	function testFading() {
		fadeOutAndIn(async () => {
			await wait(3000);
			return;
		});
	}
	function spawnExplosion(x, y, r, amount, color) {
		for (var i = 0; i < amount; i++) {
			explosionParticles.push({
				'x': x - r + Math.random() * r * 2,
				'y': y - r + Math.random() * r * 2,
				'angle': Math.random() * 360,
				'r': 20,
				'color': [255, 255, 255],
				'custom': color,
				'speed': Math.random() * 20,
				'opacity': 50 // out of 75
			})
		}
	}
	window.cutsceneAPI = {cutscene, fadeOutAndIn, advancedFadeOutAndIn, fadeToBlack, testFading, wait, fade, spawnExplosion};
})(window);