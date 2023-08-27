var inCutscene = false;
(function(window) {
	async function cutscene(callbacks, prepare, after, options) {
		var settings = {
			fadeoutStart: true,
			fadeoutEnd: true,
			skippable: false,
			skipKey: ' ',
			skipKeyText: 'space'
		};
		function drawSkip() {
			if (!settings.skippable) return;
			if (skipped) return;
			draw.push();
			draw.textSize(25);
			draw.fill('black');
			draw.textAlign(draw.RIGHT, draw.BOTTOM);
			draw.text(`${settings.skipKeyText} = skip`, width, height);
			draw.pop();
		}
		function skipcb(ev) {
			if (!settings.skippable) return;
			if (skipped) return;
			if (ev.key != settings.skipKey) return;
			skipped = true;
			fadeOutAndIn(() => {
				return new Promise((resolve) => {
					skipKey.skip = true;
					addEventListener('TankGame.update', async function cb() {if (allDone) {
						removeEventListener('TankGame.update', cb);
						removeEventListener('TankGame.updateDone', drawSkip);
						if (after) await after(cutsceneScope, skipKey);
						resolve();
					}
					})
				});
			})
		}
		var skipped = false;
		var skipKey = {skip: false};
		var cutsceneScope = {};
		var allDone = false;
		for (const k in options) settings[k] = options[k];
		if (prepare) prep = () => prepare(cutsceneScope, skipKey);
		else prep = function() {};
		if (settings.fadeoutStart) await advancedFadeOutAndIn([prep], false);
		addEventListener('TankGame.updateDone', drawSkip);
		if (settings.skippable) addEventListener('keydown', skipcb);
		for (const f of callbacks) await f(cutsceneScope, skipKey);
		allDone = true;
		if (settings.skippable) removeEventListener('keydown', skipcb);
		removeEventListener('TankGame.updateDone', drawSkip);
		if (after) var aft = () => after(cutsceneScope, skipKey);
		else aft = function() {};
		if (settings.fadeoutEnd && !skipped) await fadeOutAndIn(aft);
		else frozen = false;
	}
	function fade(opacityChange = -2, start = 100) {
		return new Promise((resolve) => {
			op = start;
			addEventListener('TankGame.updateDone', function u() {
				op += opacityChange * multiplier;
				draw.fill('black');
				var opacity = Math.round(100 - op) / 100;
				if (opacity < 0) opacity = 0;
				setOpacity(draw, opacity);
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
	function wait(ms, skipToken) {
		return new Promise((resolve) => {
			var frames = ms * fps / multiplier / 1000;
			addEventListener('TankGame.update', function cb() {
				frames--;
				if (frames <= 0 || (skipToken && skipToken.skip)) {
					resolve();
					removeEventListener('TankGame.update', cb);
				}
			});
		});
	}
	function realTimeWait(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
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
	window.cutsceneAPI = {cutscene, fadeOutAndIn, advancedFadeOutAndIn, fadeToBlack, testFading, wait, realTimeWait, fade, spawnExplosion};
})(window);