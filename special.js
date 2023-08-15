function addSpecial(forwhat, callback, once = false) {
	if (typeof level == 'undefined') {
		// throwUnderTheBus('no level found');
		return;
	}
	if (level == forwhat) {
		if (once) callback();
		else updateCallbacks.push(callback);
	}
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
addSpecial('2', function() {
	if (window.allDead == undefined) allDead = false;
	if (window.twoSpawned == undefined) twoSpawned = false;
	if (window.bossStart == undefined) bossStart = false;
	if (!window.oneframe) {
		oneframe = true;
		return;
	}
	if (!twoSpawned) {
		if (x > 3000) {
			twoSpawned = true;
			levelInfo.getEnemyById('rndspawn1').y = 100;
			levelInfo.getEnemyById('rndspawn2').y = 700;
			cutsceneAPI.spawnExplosion(3550, 160, 100, 60, [255, 0, 0]);
			cutsceneAPI.spawnExplosion(3550, 760, 100, 60, [255, 0, 0]);
		}
	}
	if (!bossStart) {
		if (x > 4500) {
			bossStart = true;
			cutsceneAPI.cutscene([async (scope, key) => {
				x = 4400;
				y = 450;
				function c() { x += 5; }
				addEventListener('TankGame.update', c);
				await cutsceneAPI.wait(1300, key);
				removeEventListener('TankGame.update', c);
				await cutsceneAPI.wait(500, key);
				var e = [4300, 350, 100, 200, "chocolate", 1];
				e.id = 'bossbarrier';
				scope.bossbarrier = e;
				levelInfo.aesthetics['barrier'].push(e);
				var boss = levelInfo.getEnemyById('boss');
				boss.y = -200;
				function bossMove() {
					boss.y += 5;
				}
				scope.boss = boss;
				scope.bossMove = bossMove;
				addEventListener('TankGame.update', bossMove);
				await cutsceneAPI.wait(118 / fps * 1000, key);
				removeEventListener('TankGame.update', bossMove);
				addEventListener('TankGame.enemyDeath', (ev) => {
					if (ev.detail[0] == boss) levelInfo.getAestheticById('bossbarrier')[0] = -1000;
				});
			}], () => {x = 4400; y = 450;}, (scope) => {
				scope.boss.y = 390;
				x = 4595;
				y = 450;
			}
				, {
				fadeoutEnd: false,
				skippable: true
			})
		}
	}
	if (!allDead) {
		allDead = true;
		var firstTextAesthetic = levelInfo.aesthetics.text[0];
		for (const e of levelInfo.allEnemies) {
			if (e.health == undefined) return;
			if (e.x > 300) continue;
			if (e.health >= 0) {
				allDead = false;
				break;
			}
		}
		if (!allDead) return;
		cutsceneAPI.cutscene([async () => {
			await cutsceneAPI.wait(250);
			firstTextAesthetic[2] = "You are entering an enemy base. Good luck!";
			await cutsceneAPI.wait(500);
			levelInfo.aesthetics.barrier.splice(0, 1);
			await cutsceneAPI.wait(500);
		}], () => {
			x = 865;
			y = 450;
		}, () => 1, {
			fadeoutEnd: false
		});
	}
})