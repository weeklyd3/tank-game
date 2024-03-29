var radarCanvas;
var radarCanvasScale = 0.05;
var ogradarcanvasscale = 0.05;
var showGreenLine = false;
addEventListener('TankGame.updateDone', async () => {
	if (!experiments.radar) return;
	if (!radarCanvas) radarCanvas = draw.createGraphics(200, 200);
	if (draw.keyIsDown(61)) {
		radarCanvasScale /= 0.9;
		if (radarCanvasScale > 0.1) radarCanvasScale = 0.1;
	}
	if (draw.keyIsDown(173)) {
		radarCanvasScale *= 0.9;
		if (radarCanvasScale < 0.01) radarCanvasScale = 0.01;
	}
	if (draw.keyIsDown(48)) radarCanvasScale = ogradarcanvasscale;
	var scale = radarCanvasScale;
	var ratio = ogradarcanvasscale / radarCanvasScale;
	radarCanvas.push();
	radarCanvas.fill('lightgray');
	radarCanvas.rect(0, 0, 200, 200);
	var playerAngle = angleBetweenTwoPoints(width / 2, height / 2, draw.mouseX, draw.mouseY);
	radarCanvas.push();
	if (levelInfo.background && levelInfo.background.beforeAesthetics) radarCanvas.image(levelInfo.background.image, -x * scale + 100, -y * scale + 100, levelInfo.background.image.width * scale, levelInfo.background.image.height * scale);
	setOpacity(radarCanvas, 0.7);
	radarCanvas.push();
	var mindist = Infinity;
	var mindiste = null;
	for (const type in levelInfo.enemies) {
		if (type === 'debug') continue;
		for (const e of levelInfo.enemies[type]) {
			var theircenter = [e.x + e.sizeX / 2, e.y + e.sizeY / 2];
			var yourcenter = [x, y];
			var dist = Math.sqrt((theircenter[0] - yourcenter[0]) ** 2 + (theircenter[1] - yourcenter[1]) ** 2);
			if (dist < mindist) { 
				mindiste = e;
				mindist = dist;
			}
		}
	}
	setOpacity(radarCanvas, 1);
	radarCanvas.pop();
	radarCanvas.translate(100, 100);
	radarCanvas.angleMode('degrees');
	radarCanvas.rotate(playerAngle);
	radarCanvas.fill('black');
	radarCanvas.rect(-3, 0, 6, 12);
	radarCanvas.fill('green');
	radarCanvas.circle(0, 0, 10);
	radarCanvas.pop();
	radarCanvas.fill(draw.color(0, 0, 0, 0));
	radarCanvas.strokeWeight(2);
	radarCanvas.stroke('black');
	radarCanvas.rect(-x * scale + 100, -y * scale + 100, levelInfo.length * scale, (levelInfo.height ?? 900) * scale);
	radarCanvas.strokeWeight(0);
	for (const type in levelInfo.enemies) {
		if (type == 'debug') continue;
		for (const e of levelInfo.enemies[type]) {
			radarCanvas.fill('gray');
			var [cx, cy] = [e.x + e.sizeX / 2, e.y + e.sizeY / 2];
			radarCanvas.circle((cx - x) * scale + 100, (cy - y) * scale + 100, 10 / ratio);
		}
	}
	for (const type in levelInfo.aesthetics) {
		if (type == 'debug') continue;
		for (const e of levelInfo.aesthetics[type]) {
			switch (type) {
				case 'lava':
				case 'rect':
				case 'barrier':
					if (type == 'lava') var color = 'red';
					else var color = e[4] ?? 'gray';
					if (type == 'barrier') setOpacity(radarCanvas, e[5] ?? 0);
					radarCanvas.fill(color);
					radarCanvas.rect((e[0] - x) * scale + 100, (e[1] - y) * scale + 100, e[2] * scale, e[3] * scale);
					setOpacity(radarCanvas, 1);
					break;
				default:
					break;
			}
		}
	}
	if (levelInfo.background && !levelInfo.background.beforeAesthetics) radarCanvas.image(levelInfo.background.image, -x * scale + 100, -y * scale + 100, levelInfo.background.image.width * scale, levelInfo.background.image.height * scale);
	radarCanvas.pop();
	radarCanvas.push();
	if (mindiste && showGreenLine) {
		var center = [mindiste.x + mindiste.sizeX / 2, mindiste.y + mindiste.sizeY / 2];
		radarCanvas.strokeWeight(5);
		radarCanvas.stroke('lime');
		radarCanvas.line((center[0] - x) * scale + 100, (center[1] - y) * scale + 100, 100, 100);
	}
	radarCanvas.pop();
	draw.image(radarCanvas, 0, 0, 200, 200);
});

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
addSpecial('3', function() {
	if (!window.enemiesToDefeat) {
		console.log('generating enemies to defeat');
		enemiesToDefeat = [];
		for (const num of [0, 1, 2, 3]) {
			enemiesToDefeat.push(levelInfo.getEnemyById(`wall${num}`));
		}
	}
	if (enemiesToDefeat.every((e) => e.health <= 0) && !window.allDefeatedBefore) {
		window.allDefeatedBefore = true;
		cutsceneAPI.cutscene([async (scope, skip) => {
			// target x: 2500, 400
			var upf = 1;
			addEventListener('TankGame.update', function cb() {
				x += 10 * upf;
				y += 3 * upf;
				if (x >= 2500 || y >= 400) {
					x = 2500;
					y = 400;
					removeEventListener('TankGame.update', cb);
				}
			});
			await cutsceneAPI.wait((800 / 10 / upf) / 30 * 1000, skip);
			addEventListener('TankGame.update', function cb() {
				x += 10;
				if (x >= 2750) {
					x = 2750;
					removeEventListener('TankGame.update', cb);
				}
			})
			await cutsceneAPI.wait(250 / 10 / 30 * 1000, skip);
			await cutsceneAPI.wait(500, skip);
			var toplava = levelInfo.aesthetics.lava[0];
			var bottomlava = levelInfo.aesthetics.lava[1];
			var heightdiff = 2;
			addEventListener('TankGame.update', function cb() {
				toplava[3] -= heightdiff;
				bottomlava[3] -= heightdiff;
				bottomlava[1] += heightdiff;
				if (toplava[3] <= 250) removeEventListener('TankGame.update', cb);
			});
			await cutsceneAPI.wait(200 / heightdiff / 30 * 1000, skip);
			await cutsceneAPI.wait(500, skip);
		}], async function() {
			x = 1700;
			y = 160;
		}, function() {
			x = 2750;
			y = 400;
			levelInfo.aesthetics.lava[0][3] = 250;
			levelInfo.aesthetics.lava[1][1] = 650;
			levelInfo.aesthetics.lava[1][3] = 250;
		}, {
			skippable: true,
			fadeoutEnd: false
		});
	}
})
addSpecial('5', function() {
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
				function c() { x += 5 * multiplier; }
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
					boss.y += 5 * multiplier;
				}
				scope.boss = boss;
				scope.bossMove = bossMove;
				addEventListener('TankGame.update', bossMove);
				await cutsceneAPI.wait((360 + 200) / 5 / fps * 1000, key);
				removeEventListener('TankGame.update', bossMove);
				addEventListener('TankGame.enemyDeath', (ev) => {
					if (ev.detail[0] == boss) levelInfo.getAestheticById('bossbarrier')[0] = -1000;
				});
			}], () => {x = 4400; y = 450;}, (scope) => {
				scope.boss.y = 390;
				x = 4595;
				y = 450;
			}, {
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
addSpecial('-5', function() {
	experiments.radar = true;
	showGreenLine = true;
	if (window.noWin == undefined) noWin = true;
	if (window.speedMul == undefined) speedMul = 10;
	if (window.elev == undefined) elev = 500;
	if (window.prevX !== undefined && window.prevY != undefined) {
		x += (x - prevX) * (speedMul - 1);
		y += (y - prevY) * (speedMul - 1);
	}
	prevX = x;
	prevY = y;
	if (draw.keyIsDown(16)) {
		speedMul = 0.95 * speedMul;
		if (speedMul < 3 && !colliding({x: x, y: y, r: 35}, {x: ae[0], y: ae[1], w: ae[2], h: ae[3]})) speedMul = 3;
	}
	var ae = levelInfo.getAestheticById('landing');
	if (draw.keyIsDown(49) && !colliding({x: x, y: y, r: 35}, {x: ae[0], y: ae[1], w: ae[2], h: ae[3]})) {
		elev -= 10;
		if (elev <= -50 && !colliding({x: x, y: y, r: 35}, {x: ae[0], y: ae[1], w: ae[2], h: ae[3]})) hp = 0;
	}
	if (draw.keyIsDown(50)) {
		elev += 10;
		if (elev >= 1000) elev = 1000;
	}
	if (colliding({x: x, y: y, r: 35}, {x: ae[0], y: ae[1], w: ae[2], h: ae[3]}) && elev < 20) {
		spd = 0;
		x += speedMul * 5;
		speedMul *= 0.5;
		if (speedMul <= 0.1) {
			speedMul = 0;
			if (!window.winFrames) winFrames = 0;
			winFrames++;
			if (winFrames == 30) {
				levelInfo.enemies['wall'][0]['health'] = 0;
				noWin = false;
			}
		}
	}
	if (!window.added) {
		added = true;
		addEventListener('TankGame.updateDone', () => {
			draw.push();
			draw.textAlign(draw.CENTER, draw.BOTTOM);
			if (elev < 0) draw.fill('red');
			var ae = levelInfo.getAestheticById('landing');
			var center = [ae[0] + ae[2] / 2, ae[1] + ae[3] / 2];
			var dist = Math.sqrt((x - center[0]) ** 2 + (y - center[1]) ** 2);
			draw.text(`elev: ${elev} ft\nspd: ${spd * speedMul}\ndist from landing: ${dist}`, width / 2, height / 2 - 35);
			draw.pop();
		})
	}
})