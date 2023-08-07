function addSpecial(forwhat, callback) {
	if (typeof level == 'undefined') throwUnderTheBus('no level found');
	if (level == forwhat) updateCallbacks.push(callback);
}
addSpecial('-2', function() {
	levelInfo.length += 0.04;
	window.noWin = true;
	if (!window.customSpawnSet) {
		window.customSpawnSet = true;
		window.enemiesKilled = 0;
		window.targetenemies = 3;
		window.sinceLastExpansion = -100;
		addEventListener('TankGame.enemyDeath', function(ev) {
			window.enemiesKilled++;
			customStatus = `Enemies killed: ${enemiesKilled}`;
			var enemy = ev.detail[0];
			var x = enemy.x;
			var y = enemy.y;
			var skillpercent = (enemiesKilled > 90 ? 90 : enemiesKilled);
			var aliveenemies = 0;
			Object.keys(levelInfo.enemies).forEach((e) => {
				levelInfo.enemies[e].forEach((n) => aliveenemies += n.health > 0);
			});
			if (sinceLastExpansion > 300 && (Math.random() < (skillpercent / 200))) {
				window.sinceLastExpansion = 0;
				window.targetenemies++;
			}
			for (var i = 0; i < targetenemies - aliveenemies; i++) {
				var expand = levelInfo.length / 9;
				var random1 = (Math.random() - 0.5);
				if (random1 > 0) random1 += 1.5;
				else random1 -= 1.5;
				var random2 = (Math.random() - 0.5);
				if (random2 > 0) random2 += 1.5;
				else random2 -= 1.5;
				var newx = random1 * expand + x;
				var newy = random2 * expand + y;
				if (newx < 0) newx = 0;
				if (newy < 0) newy = 0;
				if (newy > (height - 120)) newy = height - 120;
				if (newx > (levelInfo.length - 100)) newx = (levelInfo.length - 100);
				var key = /* Math.random() < 0.5 ? 'basic' : 'machine'; */ 'basic';
				var newe = {
					x: newx,
					y: newy
				};
				if (Math.random() < skillpercent / 100) {
					newe.motile = true;
					newe.lim = [0, 780];
				}
				createAndInitEnemy(key, newe);
			}
		})
	}
	window.sinceLastExpansion++;
})