var game = JSON.parse(localStorage.getItem("gameIn"));
if (!game || game[1] == undefined || !game[0]) {
	alert('You are not currently in a game. Either your localStorage is broken or you never started a game.');
	window.location.href = 'index.html';
}
var equippedGuns = JSON.parse(localStorage.weapons);
if (game[0] == -1) window.location.href = "mainpage.html";
var tips = [
    "Use recoil to move faster",
    "Don't always shoot, sometimes it's better to save your ammo",
    "You can't pause the game because it can be exploited to cheat",
    "Make sure you collect all the coins before you kill the last enemy",
    "You still earn your coins if you die",
    "Press space to skip cutscenes",
    "Move right and kill all enemies to win",
    "Win a level to unlock the next one",
    "Use coins to buy upgrades from the shop",
	"Send feedback by pressing F after the level",
    "Barriers are very sticky and lava is very hot",
    "The bar on the bottom right shows the damage you dealt to all enemies",
    "Press E to enable autofire",
	"Hold SHIFT to accelerate on open highways"
];
var gameStarted = false;
var width = 2000;
var height = 900;
var ogfps = 30;
var fps = 30;
if (new URL(location.href).searchParams.get('fps')) fps = new URL(location.href).searchParams.get('fps');
var physicsSpeed = 1;
var player;
var autofire = false;
var prevaf = false;
var gun1, gun2, gun3, gunX;
var loadStage, weapons;
var recoil = [0, 0];
var debugMode = false;
p5.disableFriendlyErrors = true;
// load stuff from stage1.json
// wait in what function
// because loading takes time
// global?
// how much time
// or acutally timmy
// can u load `stage${game[0]}.json`?
// you never know how much time
// await can only be used in functions tho
// yeah updateGame()
//do not abuse this console?
var updateCallbacks = [];
var callbacks = {
	'update': updateCallbacks,
	'enemyDeath': [],
	'yourDeath': [],
	'yourWin': [],
	'updateDone': []
};
var callbackDoc = {
	'update': "Calls when the screen is updated",
	'updateDone': "Calls when all objects have been drawn.",
	"enemyDeath": "Calls when enemies die. ev.detail is the enemy that died.",
	"yourDeath": "Calls the frame death time is set.",
	"yourWin": "Calls the frame after all particles disappear after all enemies are defeated."
}
function addCallback(event, cb) {
	if (event.startsWith('TankGame.')) {
		console.log(`It is unnecessary to specify TankGame. at the start of callback events. Removing it.`);
		event = event.slice(9);
	}	
	if (callbacks[event] == null) {
		callbacks[event] = [];
		console.warn(`Event ${event} doesn't exist yet. It was created.`);
	}
	callbacks[event].push(cb);
}
function callEvents(event, ...params) {
	if (event.startsWith('TankGame.')) {
		console.warn(`Using TankGame. at the start of an event name to call is unnecessary. Removing it.`);
		event = event.slice(9);
	}
	if (callbacks[event] == null) {
		throwUnderTheBus(`Unrecognized event ${event}, cannot execute`);
		return;
	}
	var ev = new CustomEvent(`TankGame.${event}`, {
		detail: params
	});
	dispatchEvent(ev);
	callbacks[event].forEach((c) => c({"detail": params}));
}
function addCallbackEvent(name, doc) {
	callbackDoc[name] = doc;
	callbacks[name] = [];
}
function getEnemyById(id, ...types) {
	var keys = Object.keys(levelInfo.enemies);
	if (types.length) keys = [types];
	for (const key of keys) {
		if (!levelInfo.enemies[key]) throwUnderTheBus(`Bad ID ${id} for searching.`);
		for (const e of levelInfo.enemies[key]) {
			if (e.id == id) return e;
		}
	}
	return null;
}
function getAestheticById(id) {
	for (const k in levelInfo.aesthetics) {
		for (const a of levelInfo.aesthetics[k]) {
			if (a.id === id) return a;
		}
	}
	return null;
}
function initEnemy(type, en, add = true) {
	en._type = type;
	if (!en.__lookupSetter__('type')) {
		en.__defineGetter__('type', () => en._type);
		en.__defineSetter__('type', (newType) => {
			if (newType == en._type) return;
			levelInfo.enemies[type].splice(levelInfo.enemies[type].indexOf(en), 1);
			if (!levelInfo.enemies[newType]) levelInfo.enemies[newType] = [];
			levelInfo.enemies[newType].push(en);
			Object.assign(en, {type: newType});
			return newType;
		});
	}
	if (!add) return;
	if (!levelInfo.enemies[type]) levelInfo.enemies[type] = [];
	levelInfo.enemies[type].push(en);
}
function createEnemy(type, options) {
	var opt = {"x": 0, "y": 0, "motile": false, "sizeX": 100, "sizeY": 120, "frames": 0, "killable": true, "speed": 0, "angle": 0, "lim":[200, 800], "type": type};
	for (const o in options) opt[o] = options[o];
	return opt;
}
function createAndInitEnemy(type, options) {
	initEnemy(type, createEnemy(type, options));
}
triggerEvent = callEvents;
var experimentDoc = {};
var experiments = {
	add: function(name, doc) {
		if (experiments.name) throwUnderTheBus(`Experiment ${name} is already here. Maybe you meant .enable()?`);
		experiments[name] = false;
		experimentDoc[name] = doc;
	},
	getAll: function() {
		var result = [];
		for (const k in experiments) {
			if (typeof experiments[k] !== 'function') result.push(k);
		}
		return result;
	},
	setAll: function(b) {
		for (const k in experiments) {
			if (typeof experiments[k] !== 'function') experiments[k] = b;
		}
	},
	all: function() {
		experiments.setAll(true);
	},
	none: function() {
		experiments.setAll(false);
	},
	listAll: function() {
		console.log(`ALL EXPERIMENTS:\nThey are listed below. To enable one, set experiments[name here] to true, or use experiments.all().`);
		for (const name of experiments.getAll()) {
			console.group(name);
			console.log('doc:', experimentDoc[name]);
			console.log('enabled:', experiments[name]);
			console.groupEnd();
		}
	}
};
experiments.add('mousemode', "Allows moving with the mouse. There are 8 areas which move the player differently. Clicking still shoots, and holding B brakes.");
experiments.add('ammoloss', "Removes and replenishes ammo, like it always should!");
experiments.add('revive', "Revives you on death. For testing.");
experiments.add('radar', "Shows nearby objects.");
var totalDeadFrames = 40;
var x = 50;
var y = height / 2;
var hp = 100;
var hits = 0;
var oghp = hp;
var stage = game[0];
if (stage == undefined) stage = 1;
var level = game[1];
var guns = game[2];
if (!guns) location.href = 'index.html';
var speed = 5;
var levelInfo;
var paused = false;
var frozen = false; // new: keeps updating, but stops physics
var prevPause = false;
var mouseX, mouseY;
var spd = 5;
var ogspd = spd;
var maxspd = 30;
var selected = 1;
var firing = false;
var gunSize;
onmousedown = (ev) => { firing = true; };
onmouseup = (ev) => { firing = false; };
var cooldowns = { 1: 0, 2: 0, 3: 0 };
var bullets = [];
var missiles = [];
var pauseDrawn = true;
var fadeoutTime = 500;
var images = {'enemies': {}, 'other': {}};
var explosionParticles = [];
var customExplosionColor = null;
var posWhenDead = [];
var bubbleFrames = 0;
var maxBubbleFrames = 120;
var coins = [];
var medpacks = [];
var moneyCollected = 0;
var prizeCollected = false;
var kills = 0;
var dead = false;
var stageDone = false;
var immortal = false;
var firstDone = false;
var aimTowards = [0, 0];

customStatus = null;
customStatusLength = null;
customStatusOriginal = null;
function updateGame() {
    if (immortal) hp = Infinity;
	if (paused) return;
	aimTowards[0] = draw.mouseX;
	aimTowards[1] = draw.mouseY;
	multiplier = physicsSpeed * ogfps / fps;
	triggerEvent('update');
	gunSize = weapons[guns[selected - 1]].size[weapons[guns[selected - 1]].size.length - 1] + 10;
	draw.push();
	draw.strokeWeight(10);
	draw.stroke("white");
	draw.background(draw.color(loadStage['background']));
	draw.pop();
	draw.stroke('white');
	if (levelInfo.background && levelInfo.background.beforeAesthetics) {
		draw.image(levelInfo.background.image, -x + width / 2, -y + height / 2);
	}
    Object.keys(levelInfo.aesthetics).forEach(function(key) {
        var value = levelInfo.aesthetics[key];
        for (var i = 0; i < value.length; i++){
			var ae = value[i];
			if (ae.x > (x + width / 2 + 500) || (ae.x < (x - width / 2 - 500))) continue;
            draw.strokeWeight(0);
			if (key == "rect"){
                draw.push();
                draw.fill(value[i][4]);
                draw.rect(value[i][0] - x+width/2, value[i][1] -y+height/2, value[i][2], value[i][3])
                draw.pop();
            }
			if (key == "circle" || key == "circ") {
                draw.push();
				draw.fill(value[i][value[i].length - 1]);
				draw.circle(value[i][0]- x+width/2, value[i][1]-y+height/2, value[i][2] * 2);
                draw.pop();
			}
			if (key == "line") {
                draw.push();
				draw.stroke(value[i][value[i].length - 2]);
				draw.fill(value[i][value[i].length - 1]);
				draw.line(value[i][0] - x + width/2, value[i][1] - y + width/2, value[i][2] - x + width/2, value[i][3] - y + width/2);
                draw.pop();
			}
            if (key == "text") {
                draw.push();
            	draw.fill(value[i][value[i].length - 2]);
                draw.stroke(0);
            	draw.textSize(value[i][value[i].length - 1]);
                draw.textAlign(draw.CENTER, draw.CENTER);
            	draw.text(value[i][2], value[i][0] - x + width/2, value[i][1] - y + height/2);
                draw.pop()
            }
			if (key == 'barrier') {
				draw.fill(value[i][4] ?? 'gray');
				setOpacity(draw, value[i][5] ?? 0);
				draw.rect(value[i][0] - x+width/2, value[i][1] -y+height/2, value[i][2], value[i][3]);
				setOpacity(draw, 1);
			}
			if (key == 'lava') {
				if (value[i].frames == undefined) {
					value[i].frames = 0;
					value[i].change = 1;
					value[i].bubbles = [];
				}
				value[i].frames += multiplier * value[i].change;
				if (!(value[i].frames % 10)) value[i].bubbles.push({
                    // make the end size random
                    // ur making it bubble? yeah
					x: value[i][0] + 25 + Math.random() * (value[i][2] - 25),
					y: value[i][1] + 25 + Math.random() * (value[i][3] - 25),
					r: 0,
					opacity: 100,
					opacityChange: 2 + Math.random() * 4,
					speed: 0.5 + Math.random() * 0.1
				});
				if (value[i].frames > 30) value[i].change = -value[i].change;
				if (value[i].frames < 0) {
					value[i].frames = 0;
					value[i].change = -value[i].change;
				}
				draw.push();
				draw.fill(draw.color(255, value[i].frames / 50 * 160, 0));
				draw.rect(value[i][0] - x+width/2, value[i][1] -y+height/2, value[i][2], value[i][3]);
				value[i].bubbles = value[i].bubbles.filter((b) => {
					if (value[i][4]) {
						b.x += value[i][4][0];
						b.y += value[i][4][1];
					}
					setOpacity(draw, b.opacity / 100);
					draw.fill(draw.color(0, 0, 0, 0));
					draw.stroke('white');
					draw.strokeWeight(2);
                    b.speed += 0.01 * multiplier;
					b.r += b.speed * multiplier;
					b.opacity -= b.opacityChange * multiplier;
					if (b.opacity < 0) b.opacity = 0;
					draw.circle(-x + width / 2 + b.x, -y + height / 2 + b.y, b.r * 2);
					setOpacity(draw, 1);
					return b.opacity > 0;
				})
				draw.pop();
			}
        }
    });
	if (levelInfo.background && !levelInfo.background.beforeAesthetics) {
		draw.image(levelInfo.background.image, -x + width / 2, -y + height / 2);
	}
	draw.push();
	draw.strokeWeight(gunSize);
	draw.stroke('black');
	draw.strokeCap(draw.SQUARE);
	var opac = 0.5 + (0.5 * (maxBubbleFrames - bubbleFrames) / maxBubbleFrames);
	var gunopac = 0 + (1 * (maxBubbleFrames - bubbleFrames) / maxBubbleFrames);
	setOpacity(draw, gunopac);
	if (bubbleFrames < maxBubbleFrames) draw.line(width / 2, height / 2, width / 2 + movePointTowardsAnotherPoint(width / 2, height / 2, ...aimTowards, 70)[0], height / 2 + movePointTowardsAnotherPoint(width / 2, height / 2, ...aimTowards, 70)[1]);
	setOpacity(draw, 1);
	for (var i = 0; i < bullets.length; i++) {
		draw.fill("blue");
		draw.stroke(0);
		draw.strokeWeight(0);
		draw.circle(bullets[i].x - x + width / 2, bullets[i].y - y + height / 2, bullets[i].r);
	}
	var bmultiplier = 2 / 3;
	if (bubbleFrames < maxBubbleFrames) {
		if (hp > 0) {
			draw.image(player, width / 2 - 35, height / 2 - 35, 70, 70);
			var hpwidth = 100;
			var hpheight = 10;
			draw.push();
			var params = [width / 2 - hpwidth / 2, height / 2 - 35 - hpheight * 2, hpwidth, hpheight];
			draw.fill('white');
			draw.strokeWeight(0);
			draw.rect(...params);
			params[2] *= hp / oghp;
			draw.fill('lime');
			draw.rect(...params);
			draw.pop();
		}
	    draw.fill("#00d700");
	    draw.strokeWeight(0);
		setOpacity(draw, opac);
	    draw.circle(width/2, height/2, 63 + bmultiplier * 2 * bubbleFrames);
		draw.push();
		draw.fill(draw.color(0, 0, 0, 0));
		draw.strokeWeight(10);
		setOpacity(draw, 1);
		if (cooldowns[selected] > -fadeoutTime) {
			cooldowns[selected] -= (1000 / ogfps) * multiplier * Math.pow(equippedGuns[guns[selected - 1]][2], 1/5.5);
            // wats multiplier
            // wheres it defined
			// basically how fast the physics should go
			// like if physicsSpeed = 2
			// multiplier = 2
			draw.angleMode(draw.DEGREES);
			var percentDone = (weapons[guns[selected - 1]].cooldown - cooldowns[selected]) * 100 / weapons[guns[selected - 1]].cooldown;
			var done = percentDone / 100;
			draw.stroke(draw.color(255 * (1 - done), 255 * done, 0));
			var over = -cooldowns[selected];
			var opacity = 1;
			if (done > 1) {
				var opacity = (1 - over / fadeoutTime) * 255;
				draw.stroke(draw.color(255 * (1 - done), 255 * done, 0, opacity));
				done = 1;
			}
			draw.arc(width / 2, height / 2, 90, 90, 0, 360 * done);
		}
		draw.pop();
	}
	draw.pop();
	// VERY IMPORTANT: when drawing enemies/bullets/other stuff, always add -x+width/2 in its x value and -y+height/2 in its y value.
    Object.keys(levelInfo.enemies).forEach(function(key) {
        var value = levelInfo.enemies[key];
        var newEnemies = [];
        for (var i = 0; i < value.length; i++){
			if (!enemies[key].noCannon && Date.now() - value[i].frames >= enemies[key].cooldown && dist(x, y, value[i].x + value[i].sizeX/2, value[i].y + value[i].sizeY/2) <= 1250 && value[i].health > 0 && !frozen) {
				var centerX = value[i].x + value[i].sizeX / 2;
				var centerY = value[i].y + value[i].sizeY / 2;
				var speed = enemies[key].speed;
				var tempSpeed = movePointTowardsAnotherPoint(centerX, centerY, x, y, speed);
                var bulletSpeed = rotatePoint(centerX - x + width/2+tempSpeed[0], centerY - y + height/2+tempSpeed[1], centerX-x+width/2, centerY-y+height/2, randint(-enemies[key].spread, enemies[key].spread)); // this creates the spread
				var bulletSpawn = movePointTowardsAnotherPoint(centerX, centerY, x, y, Math.max(images.enemies[key].cannon.width, images.enemies[key].cannon.height) - 15);
                var rand1 = randint(0,enemies[key].size.length-1)
                var rand2 = randint(0,enemies[key].damage.length-1)
                if (enemies[key].sameRand) rand1 = rand2;
				missiles.push({
					'x': bulletSpawn[0]+value[i].x + value[i].sizeX/2,
					'y': bulletSpawn[1]+value[i].y + value[i].sizeY/2,
					'r': enemies[key].size[rand1],
                    'size': enemies[key].size[rand1],
                    'damage': enemies[key].damage[rand2],
                    'range': enemies[key].range,
					'speed': [bulletSpeed[0], bulletSpeed[1], bulletSpeed[0] + bulletSpeed[1]],
					'from': value[i],
                    'travelled': 0,
                    'homing': enemies[key].homing
				})
				value[i].frames = Date.now();
			}
			if (!value[i].originalHealth) {
				value[i].health = enemies[key].health;
				value[i].originalHealth = value[i].health;
			}
            // how do you find the height of the image
            // like the laoded svg
			// [image object].height?
			if (value[i].treadFrame == undefined) value[i].treadFrame = 0;
			value[i].treadFrame++;
			if (value[i].treadFrame > 1) value[i].treadFrame = 0;
			var tank = value[i];
			if (value[i].motile) {
                draw.push();
				var coords = [value[i].x-x+width/2 - value[i].sizeX / 8, value[i].y-y+height/2 - value[i].sizeY / 6, value[i].sizeX + value[i].sizeX / 4, value[i].sizeY + value[i].sizeY / 3];
				if (value[i].treadFrame == 0) value[i].frame = !value[i].frame
                var img = images['other'][`treads${value[i].frame + 1}`];
				if (img) draw.image(img, ...coords);
                draw.image(value[i].image ?? images.enemies[key].body, value[i].x-x+width/2, value[i].y-y+height/2, value[i].sizeX, value[i].sizeY);
                draw.pop();
			}
            else draw.image(value[i].image ?? images.enemies[key].body, value[i].x-x+width/2, value[i].y-y+height/2, value[i].sizeX, value[i].sizeY);
			draw.push();
			draw.translate(-x+width/2 + value[i].x + value[i].sizeX / 2, -y+height / 2 + value[i].y + value[i].sizeY / 2);
			var cannon = images.enemies[key].cannon;
			var ang = angleBetweenTwoPoints(value[i].x + value[i].sizeX/2, value[i].y+value[i].sizeY/2, x, y);
			if (value[i].health <= 0 && !frozen) {
				if (value[i].cannonAngle == undefined) value[i].cannonAngle = ang;
				ang = value[i].cannonAngle;
			}
			draw.rotate(ang);
			if (!enemies[key].noCannon) draw.image(images.enemies[key].cannon, -cannon.width / 2, -cannon.width / 2);
			draw.pop();
			if (value[i].damagedThisFrame) {
				value[i].damagedThisFrame = false;
				setOpacity(draw, 0.1);
				draw.fill('red');
				draw.rect(value[i].x-x+width/2, value[i].y-y+height/2, value[i].sizeX, value[i].sizeY);
				setOpacity(draw, 1);
			}
			if (value[i].health < value[i].originalHealth) {
				var barwidth = value[i].sizeX + value[i].sizeX / 4;
				var barheight = 10;
				draw.fill('black');
				var params = [
					-x+width/2 + value[i].x - (value[i].motile ? value[i].sizeX / 8 : 0),
					-y+height/2 + value[i].y + (value[i].motile ? (-value[i].sizeY / 6) : 0) - barheight * 2,
					value[i].sizeX * (value[i].motile ? 1.25 : 1), 
					10
				];
				draw.rect(
					...params
				);
				var full = value[i].health / value[i].originalHealth;
				draw.fill(draw.color(255 * (1 - full), 255 * full, 0));
				params[2] *= full;
				draw.rect(...params);
			}
			if (colliding({
				'x': x,
				'y': y,
				'r': 35
			}, {
				'x': value[i].x,
				'y': value[i].y,
				'w': value[i].sizeX,
				'h': value[i].sizeY
			}) && value[i].health > 0 && !frozen) {
				var enemyhp = value[i].health;
				if (enemyhp < hp) {
					value[i].health = 0;
					hp -= enemyhp;
				}
				else if (enemyhp === hp) {
					hp = 0;
					value[i].health = 0;
				}
				else if (enemyhp > hp) {
					hp = 0;
					value[i].health -= hp;
					if (value[i].health < 0) value[i].health = 0;
				}
			}
			if (value[i].health <= 0) {
                if (!value[i].deadFrames) coins.push([randint(value[i].x+25, value[i].x + value[i].sizeX-25), randint(value[i].y+25, value[i].y + value[i].sizeY-25), randint(value[i].money ? value[i].money[0] : enemies[key].money[0], value[i].money ? value[i].money[1] : enemies[key].money[1])]);
                if (!value[i].deadFrames){kills++; if (Math.random() < 0.2) medpacks.push([randint(value[i].x+25, value[i].x + value[i].sizeX-25), randint(value[i].y+25, value[i].y + value[i].sizeY-25)]);}
				value[i].health = 0;
				if (value[i].deadFrames == undefined) {
					callEvents('enemyDeath', value[i]);
					value[i].deadFrames = 0;
				}
				if (!frozen) value[i].deadFrames += multiplier;
				// make it start shaking
				var smultiplier = Math.sqrt(value[i].deadFrames);
				setOpacity(draw, value[i].deadFrames / totalDeadFrames);
				draw.fill('white');
				draw.rect(value[i].x-x+width/2, value[i].y-y+height/2, value[i].sizeX, value[i].sizeY)
				setOpacity(draw, 1);
				value[i].x += (Math.random() - 0.5) * smultiplier;
				value[i].y += (Math.random() - 0.5) * smultiplier;
				if (value[i].deadFrames > totalDeadFrames) value[i].actuallyDead = true;
			}
			if (value[i].motile) {
				if (!value[i].lim) {
					console.warn("motile enemy:", value[i], "is missing a `lim` attribute.");
				} else {
					if (!value[i].speed) value[i].speed = 3;
	                if (value[i].y > value[i].lim[1] || value[i].y < value[i].lim[0]){
	                    value[i].speed *= -1;
	                }
	                if (!frozen) value[i].y += value[i].speed * multiplier;
				}
			}
            newEnemies.push(value[i]);
			// should it also add the treads automatically?
            // only if value[i].motile
        }
        levelInfo.enemies[key] = newEnemies;
    });
	explosionParticles = explosionParticles.filter((p) => {
		p.opacity -= multiplier;
		if (p.opacity < 0) p.opacity = 0;
		setOpacity(draw, Math.round(100 * p.opacity / 50) / 100);
		p.color[2] -= 4 * multiplier;
		p.color[1] -= 1.1 * multiplier;
		if (p.custom) draw.fill(...p.custom);
		else draw.fill(...p.color);
		draw.strokeWeight(0);
		draw.circle(p.x-x+width/2, p.y-y+height/2, p.r * 2);
		setOpacity(draw, 1);
		if (frozen) return;
		point = movePointAtAngle(p.x, p.y, p.angle, p.speed * multiplier);
		p.x = point[0];
		p.y = point[1];
        if (p.opacity < 0 && p.player) {paused = true; pauseDrawn = false;}
		return p.opacity > 0;
	})
	Object.keys(levelInfo.enemies).forEach((key) => {
		levelInfo.enemies[key] = levelInfo.enemies[key].filter((e) => {
			if (e.actuallyDead && !e.spawned) {
				if (e.spawned) return false;
				e.spawned = true;
				var max = e.originalHealth;
				if (max > 200) max = 200;
				for (var i = 0; i < max; i++) {
					explosionParticles.push({
						'x': e.x + e.sizeX / 2,
						'y': e.y + e.sizeY / 2,
						'angle': Math.random() * 360,
						'r': 20,
						'color': [255, 255, 255],
						'custom': customExplosionColor,
						'speed': Math.random() * 20,
						'opacity': 50 // out of 75
					})
				}
			}
			return !e.actuallyDead;
		})
	})
    var newcoins = [];
    for (var i = 0; i < coins.length; i++){
		if (coins[i][0] != coins[i][0] || coins[i][1] != coins[i][1]) throwUnderTheBus("Some coin has NaN coordinates.");
        draw.image(images['other']['coin'], coins[i][0] - 25 - x + width/2, coins[i][1] - 25 - y + height/2, 50, 50);
        if ((coins[i][0] - x)*(coins[i][0] - x) + (coins[i][1] - y)*(coins[i][1] - y) < 3600 && !frozen){
            moneyCollected += coins[i][2]
        }
        else newcoins.push(coins[i]);
    }
	coins = newcoins;
    var newmedpacks = [];
    for (var i = 0; i < medpacks.length; i++){
		if (medpacks[i][0] != medpacks[i][0] || medpacks[i][1] != medpacks[i][1]) throwUnderTheBus("Some medpack has NaN coordinates.");
        draw.image(images['other']['medpack'], medpacks[i][0] - x + width/2, medpacks[i][1] - y + height/2, 50, 40);
        if (colliding({"x":x, "y":y, "r":35}, {"x":medpacks[i][0], "y":medpacks[i][1], "w":50, "h":40}) && !frozen){
            hp += 25;
            hp = Math.min(oghp, hp);
        }
        else newmedpacks.push(medpacks[i]);
    }
	medpacks = newmedpacks;
	draw.strokeWeight(3);
	var levelheight = levelInfo.height ?? height;
	draw.line(width / 2 - x, height / 2 - y, levelInfo.length - x + width / 2, height / 2 - y);
	draw.line(width / 2 - x, height / 2 - y, width / 2 - x, height / 2 - y + levelheight);
	draw.line(width / 2 - x, height / 2 - y + levelheight, levelInfo.length - x + width / 2, levelheight + height / 2 - y);
	draw.line(levelInfo.length - x + width / 2, height / 2 - y, levelInfo.length - x + width / 2, levelheight + height / 2 - y);
	draw.fill('black');
	for (var i = 0; i < levelInfo.length; i += 100) {
		draw.text(i, i - x + width / 2, -y+height/2);
		draw.text(i, i - x + width / 2, -y+height/2 + levelheight);
	}
	// draw everything up here
	if (paused) return;
	var inlava = false;
	var lavamove = [0, 0];
	if (levelInfo.aesthetics['lava']) {
		for (const a of levelInfo.aesthetics.lava) {
			if (colliding({x: x, y: y, r: 30}, {x: a[0], y: a[1], w: a[2], h: a[3]})) {
				if (a[4] && colliding({x: x, y: y, r: 5}, {x: a[0], y: a[1], w: a[2], h: a[3]})) {
					lavamove[0] += a[4][0];
					lavamove[1] += a[4][1];
				}
				inlava = true;
				hp -= 2;
			}
		}
	}
	x += lavamove[0];
	y += lavamove[1];
	var lavaMultiplier = 1;
	if (inlava) lavaMultiplier = 0.5;
	var oldx = x, oldy = y;
	// move everything down here
	if (Math.abs(recoil[1]) > 0.1 || Math.abs(recoil[0]) > 0.1) {
		if (!frozen) {
			x += recoil[0] * multiplier;
			y += recoil[1] * multiplier;
			recoil[0] -= 0.1 * multiplier * recoil[0];
			recoil[1] -= 0.1 * multiplier * recoil[1];
		}
	}
	else {
		recoil[1] = 0
		recoil[0] = 0
	}
	if (hp <= 0 && experiments.revive) hp = oghp;
	if (hp > 0) {
		if (!experiments.mousemode && !frozen) {
			if (draw.keyIsDown(draw.RIGHT_ARROW) || draw.keyIsDown(68)) x += spd * multiplier * lavaMultiplier;
			if (draw.keyIsDown(draw.LEFT_ARROW) || draw.keyIsDown(65)) x -= spd * multiplier * lavaMultiplier;
			if (draw.keyIsDown(draw.UP_ARROW) || draw.keyIsDown(87)) y -= spd * multiplier * lavaMultiplier;
			if (draw.keyIsDown(draw.DOWN_ARROW) || draw.keyIsDown(83)) y += spd * multiplier * lavaMultiplier;
		} else {
			var mousex = draw.mouseX;
			var mousey = draw.mouseY;
			var centerx = width / 2;
			var centery = height / 2;

			var ang = angleBetweenTwoPoints(centerx, centery, mousex, mousey) - 90;
			// 0 is absolute left
			// thaas weird
			var xmul = 0, ymul = 0;
			// i don't want to talk about this monstrosity
			if (ang >= 337.5 || ang < 22.5) {
				xmul = -1;
				ymul = 0;
			} else if (ang < 67.5) {
				xmul = -1;
				ymul = -1;
			} else if (ang < 112.5) {
				xmul = 0;
				ymul = -1;
			} else if (ang < 157.5) {
				xmul = 1;
				ymul = -1;
			} else if (ang < 202.5) {
				xmul = 1;
				ymul = 0;
			} else if (ang < 247.5) {
				xmul = 1;
				ymul = 1;
			} else if (ang < 292.5) {
				xmul = 0;
				ymul = 1;
			} else if (ang < 337.5) {
				xmul = -1;
				ymul = 1;
			} else throwUnderTheBus("Huh...? bad mouse angle");
			if (Math.sqrt((centerx - mousex) ** 2 + (centery - mousey) ** 2) < 35 || draw.keyIsDown(66) || frozen) {
				xmul = 0;
				ymul = 0;
			}
			x += spd * xmul * multiplier * lavaMultiplier;
			y += spd * ymul * multiplier * lavaMultiplier;
		}
		var ok = true;
		if (levelInfo.aesthetics['barrier']) {
			for (const a of levelInfo.aesthetics.barrier) {
				if (colliding({x: x, y: y, r: 35}, {x: a[0], y: a[1], w: a[2], h: a[3]})) ok = false;
			}
			if (!ok) {
				x = oldx;
				y = oldy;
			}
			for (const a of levelInfo.aesthetics.barrier) {
				// if (colliding({x: x, y: y, r: 35}, {x: a[0], y: a[1], w: a[2], h: a[3]})) {
    //                 if (Math.abs(x - a[0]) < 38/* && Math.abs(x - a[0]) > 27*/){
    //                     x = a[0] - 36;
    //                 }
    //                 if (Math.abs(x - (a[0] + a[2])) < 38/* && Math.abs(x - (a[0] + a[2])) > 27*/){
    //                     x = a[0] + a[2] + 36;
    //                 }
    //                 if (Math.abs(y - a[1]) < 38/* && Math.abs(y - a[1]) > 27*/){
    //                     y = a[1] - 36;
    //                 }
    //                 if (Math.abs(y - (a[1] + a[3])) < 38/* && Math.abs(y - (a[1] + a[3])) > 27*/){
    //                     y = a[1] + a[3] + 36;
    //                 }
    //             }
			}
		}
	} else {

        if (!firing) {
			if (window.deadTime == undefined) deadTime = Date.now();
			if (!window.yourDeathTriggered) {
				window.yourDeathTriggered = true;
				triggerEvent('yourDeath');
			}
			dead = true;
		}
		draw.textAlign(draw.CENTER);
		draw.textSize(50);
		draw.fill('black');
		draw.text('YOU DIED', 0, 200, width);
		draw.text('Click the screen to return to the main page', 0, 300, width);
		bubbleFrames += multiplier;
		if (bubbleFrames == maxBubbleFrames) {
			// create explosion
			for (var i = 0; i < 200; i++) {
				explosionParticles.push({
					'x': x + ((Math.random() - 0.5) * 20),
					'y': y + ((Math.random() - 0.5) * 20),
					'angle': Math.random() * 360,
					'r': 20,
                    'player': true,
					'color': [255, 255, 255],
					'custom': [0, 240, 24],
					'speed': Math.random() * 20,
					'opacity': 50
				})
			}
            return;
		}
		if (posWhenDead.length) {
			x = posWhenDead[0];
			y = posWhenDead[1];
		} else posWhenDead = [x, y];
        if (prizeCollected) return;
        prizeCollected = true;
        localStorage.money = parseInt(localStorage.money) + moneyCollected;
	}
	var totalEnemies = 0;
	Object.values(levelInfo.enemies).forEach((v) => totalEnemies += v.length);
	if (totalEnemies <= 0 && !explosionParticles.length && !window.noWin) {
		if (!window.winFrames) window.winFrames = 0;
		winFrames += multiplier;
		if (!stageDone) doneTime = Date.now();
		if (!firing) stageDone = true;
		if (winFrames > (fps * 2)) {
			if (!stageDone) triggerEvent('yourWin');
			draw.textAlign(draw.CENTER);
			draw.textSize(50);
			draw.fill('black');
			draw.text('YOU WON', 0, 200, width);
			draw.text('You actually killed all of them? no way', 0, 300, width);
			if (!window.winCoinsGiven) {
				winCoinsGiven = true; localStorage.money = Number(localStorage.money) + moneyCollected; 
			}
		    paused = true;
			return;
		}
	}
	if (!frozen) {
		if (draw.keyIsDown(49) && guns[0]) { selected = 1; cooldowns[selected] = -1000; }
		if (draw.keyIsDown(50) && guns[1]) { selected = 2; cooldowns[selected] = -1000; }
		if (draw.keyIsDown(51) && guns[2]) { selected = 3; cooldowns[selected] = -1000; }
		if (y < 35) y = 35;
		if (x < 35) x = 35;
		if (y > (levelInfo.height ?? height) - 35) y = (levelInfo.height ?? height) - 35;
		if (x > levelInfo.length - 35) x = levelInfo.length - 35;
	}
        if (draw.keyIsDown(69) /*YEAH THATS THE NUMBER*/){
            if (!prevaf){
            prevaf = true;
            autofire = !autofire;
        }}
        else prevaf = false;
    // dont worry about the above formatting
	mouseX = draw.mouseX;
	mouseY = draw.mouseY;
	var gun = guns[selected - 1];
	if ((firing || autofire || (experiments.mousemode && draw.keyIsDown(32))) && (cooldowns[selected] <= 0) && hp > 0 && !frozen) {
        if (equippedGuns[guns[selected-1]][3] > 0){
            equippedGuns[guns[selected-1]][3] --;
    		var rec = movePointTowardsAnotherPoint(width / 2, height / 2, ...aimTowards, -weapons[guns[selected - 1]]["recoil"]);
    		cooldowns[selected] = weapons[guns[selected - 1]].cooldown;
    		recoil[0] += rec[0];
    		recoil[1] += rec[1];
			for (var i = 0; i < (weapons[guns[selected - 1]].shots ?? 1); i++) {
	    		if (guns[selected - 1] == "basic" || guns[selected - 1] == "destroyer") {
	    			var tempSpeed = movePointTowardsAnotherPoint(width / 2, height / 2, ...aimTowards, weapons[gun].speed[0] * Math.sqrt(Math.sqrt(equippedGuns[gun][0])));
	                var bulletSpeed = rotatePoint(width/2+tempSpeed[0], height/2+tempSpeed[1], width/2, height/2, randint(-weapons[guns[selected-1]].spread, weapons[guns[selected-1]].spread)); // placeholder
	    			var bulletSpawn = movePointTowardsAnotherPoint(width / 2, height / 2, ...aimTowards, Math.abs(70 - i * 5));
	    			draw.stroke(0);
	    			bullets.push({ "x": x + bulletSpawn[0], "y": y + bulletSpawn[1], "r": weapons[gun].size[0], "total": 0, "speed": weapons[gun].speed[0] * Math.sqrt(Math.sqrt(equippedGuns[gun][0])), "xSpeed": bulletSpeed[0], "ySpeed": bulletSpeed[1], "range": weapons[gun].range[0], "dmg": weapons[gun].damage[0] * Math.cbrt(equippedGuns[gun][1]) });
	    		}
                
	        }
	        localStorage.weapons = JSON.stringify(equippedGuns);
		}
	}
    newMissiles = [];
	var toCheck = [];
	if (levelInfo.aesthetics.barrier) toCheck.push(...levelInfo.aesthetics.barrier);
	if (levelInfo.aesthetics.lava) toCheck.push(...levelInfo.aesthetics.lava);
    for (var i = 0; i < missiles.length; i++){
		if (toCheck.length) {
			for (const b of toCheck) {
				if (colliding({
					x: missiles[i].x,
					y: missiles[i].y,
					r: missiles[i].size/2
				}, {
					x: b[0],
					y: b[1],
					w: b[2],
					h: b[3]
				})) missiles[i].damage = 0;
			}
		}
        if ((x-missiles[i].x)*(x-missiles[i].x) + (y-missiles[i].y)*(y-missiles[i].y) <= (35 + missiles[i].size/2)*(35 + missiles[i].size/2) && !frozen){
			hits++;
            hp -= missiles[i].damage;
            missiles[i].damage = 0;
        }
        for (var j = 0; j < bullets.length; j++){
            if ((bullets[j].x-missiles[i].x)*(bullets[j].x-missiles[i].x) + (bullets[j].y-missiles[i].y)*(bullets[j].y-missiles[i].y) <= (bullets[j].r/2 + missiles[i].size/2)*(bullets[j].r/2 + missiles[i].size/2)){
                var minHP = Math.min(bullets[j].dmg, missiles[i].damage);
                bullets[j].dmg -= minHP;
                missiles[i].damage -= minHP;
            }
        }
        draw.fill("red");
        draw.stroke(0);
        draw.strokeWeight(0);
        draw.circle(missiles[i].x - x + width / 2, missiles[i].y - y + height/2, missiles[i].size);
		if (frozen) {
			newMissiles.push(missiles[i]);
			continue;
		}
        if (missiles[i].homing){
            var next = movePointTowardsAnotherPoint(missiles[i].x, missiles[i].y, x, y, missiles[i].speed[2]);
            missiles[i].x += next[0] * multiplier;
            missiles[i].y += next[1] * multiplier;
        }
        else {
            missiles[i].x += missiles[i].speed[0] * multiplier;
            missiles[i].y += missiles[i].speed[1] * multiplier;
        }
        missiles[i].travelled += missiles[i].speed[2] * multiplier;
        if (missiles[i].travelled <= missiles[i].range && missiles[i].damage > 0){
            newMissiles.push(missiles[i]);
        }
    }
    missiles = newMissiles;
	var newBullets = [];
	var toCheck = [];
	if (levelInfo.aesthetics.barrier) toCheck.push(...levelInfo.aesthetics.barrier);
	if (levelInfo.aesthetics.lava) toCheck.push(...levelInfo.aesthetics.lava);
	for (var i = 0; i < bullets.length; i++) {
		if (frozen) {
			newBullets.push(bullets[i]);
			continue; // HAHA NO WINDBLIGHT SKIP 4 U
		}
		bullets[i].x += bullets[i].xSpeed * multiplier;
		bullets[i].y += bullets[i].ySpeed * multiplier;
		bullets[i].total += bullets[i].speed * multiplier;
		var collided = false;
		if (toCheck.length) {
			for (const b of toCheck) {
				if (colliding({
					x: bullets[i].x,
					y: bullets[i].y,
					r: bullets[i].r/2
				}, {
					x: b[0],
					y: b[1],
					w: b[2],
					h: b[3]
				})) collided = true;
			}
		}
		Object.keys(levelInfo.enemies).forEach((k) => {
			if (collided) return;
			var array = levelInfo.enemies[k];
			array.forEach((enemy, index) => {
				if (collided) return;
				if (enemy.health > 0 && colliding({
					'x': bullets[i].x,
					'y': bullets[i].y,
					'r': bullets[i].r/2
				}, {
					'x': enemy.x,
					'y': enemy.y,
					'w': enemy.sizeX,
					'h': enemy.sizeY
				})) {
					levelInfo.enemies[k][index].damagedThisFrame = true;
					if (bullets[i].dmg >= levelInfo.enemies[k][index].health){
                        bullets[i].dmg -= levelInfo.enemies[k][index].health;
                        levelInfo.enemies[k][index].health = 0;
                    }
                    else {
                        levelInfo.enemies[k][index].health -= bullets[i].dmg;
                        bullets[i].dmg = 0;
                    }
					if (levelInfo.enemies[k][index].health < 0) levelInfo.enemies[k][index].health = 0;
				}
			})
		})
		if (bullets[i].total < bullets[i].range && bullets[i].dmg > 0 && !collided) {
			newBullets.push(bullets[i]);
		}
	}
	bullets = newBullets;
    // timmy
    // how do you loop thorugh a map
	// map?
	// wat's that
    // {1:2, 3:4, 5:6}
	// wait is that not a normal object?
    // oh in like every other language
    // its called a map
	// so it is a normal object
	// so you want to loop over it like `debug()`?
    // i want to loop thorugh all the keys in levelInfo.enemies
	// oh
	// Object.keys(levelInfo.enemies).forEach
    // wait no all the values
	// wait it's an object?
	// i think array could be better
	// if you want to go with values then Object.values
}
var xoffset = 0;
var firstTime = true;
var gunsLoaded = true;
var tipSelected = randint(0, tips.length-1);
function update() {
	if (draw.keyIsDown(70) && document.activeElement == document.body) {
		document.querySelector('#feedback').style.display = 'block';
	}
	if (draw.keyIsDown(80) && document.activeElement == document.body && false) {
		if (!prevPause) {
			paused = !paused;
			prevPause = true;
		}
	}
	else {
		prevPause = false;
	}
	enemiesLeft = 0;
	Object.values(levelInfo.enemies).forEach((s) => enemiesLeft += s.length);
	if (paused && (enemiesLeft <= 0 && !explosionParticles.length)) {
        if (hp > 0 && !firing) stageDone = true;
		return;
	}
	if (paused) return;
	draw.clear();
	resized();
	// draw.push();
	// draw.translate(xoffset, 0);
	// wait no
	// timmy make index.html a start page
	// and a levels page and stuff like plane game
	// this is for just the game page
	// oh
	// just do what u did in plane game
	// that's tuff
	// i would normally read from a save json
	// but i guess we would have to use localStorage now
	if (weapons && gunsLoaded) {
		if (guns[0]) {
			gun1 = draw.loadImage(weapons[guns[0]]['image']);
		}
		if (guns[1]) {
			gun2 = draw.loadImage(weapons[guns[1]]['image']);
		}
		if (guns[2]) {
			gun3 = draw.loadImage(weapons[guns[2]]['image']);
		}
		gunsLoaded = false;
	}
	if (!gameStarted) {
		mouseX = draw.mouseX;
		mouseY = draw.mouseY;
		draw.push();
		if (loadStage) draw.background(draw.color(loadStage.background));
		draw.textAlign(draw.CENTER, draw.CENTER);
		draw.textSize(100);
		draw.stroke("white");
		draw.strokeWeight(3);
		draw.line(0, 0, width, 0);
		draw.line(width, 0, width, height);
		draw.line(0, height, width, height);
		draw.line(0, 0, 0, width);
		draw.fill("white");
		draw.text(`You are playing stage ${game[0]} level ${game[1]}.`, width / 2, height / 2 - 60);
		draw.textSize(50);
		draw.text("Click this to start", width / 2, height / 2 + 40);
		draw.text("Tip: " + tips[tipSelected], width / 2, height / 2 + 110);
		draw.color("white");
		// not working, after i click it it doesnt draw what is in updateGame()
		// it goes in there but dfoesnt draw anything
		draw.pop();
		return;
	}
	else {
		draw.push();
		updateGame();
		draw.pop();
	}
	draw.push();
	draw.stroke('white');
	draw.push();
	var currentWeaponX = 1;
	if (selected == 1 && guns[0]) {
		draw.fill("cyan");
		draw.stroke(0);
		draw.strokeWeight(0);
		draw.rect(currentWeaponX + 82, 793, 170, 104)
	}
	if (guns[0] && gun1) {
		draw.image(gun1, currentWeaponX + 84, 795, 166, 100);
	}
	else {
		draw.image(gunX, currentWeaponX + 84, 795, 166, 100);
	}
    draw.textAlign(draw.CENTER, draw.CENTER);
	draw.textSize(50);
	draw.strokeWeight(0);
	currentWeaponX += 250;
	if (selected == 2 && guns[1]) {
		draw.fill("cyan");
		draw.stroke(0);
		draw.strokeWeight(0);
		draw.rect(currentWeaponX + 82, 793, 170, 104)
	}
	if (guns[1] && gun2) {
		draw.image(gun2, currentWeaponX + 84, 795, 166, 100);
	}
	else {
		draw.image(gunX, currentWeaponX + 84, 795, 166, 100);
	}
	currentWeaponX += 250;
	if (selected == 3 && guns[2]) {
		draw.fill("cyan");
		draw.stroke(0);
		draw.strokeWeight(0);
		draw.rect(currentWeaponX + 82, 793, 170, 104)
	}
	if (guns[2] && gun3) {
		draw.image(gun3, currentWeaponX + 84, 795, 166, 100);
	}
	else {
		draw.image(gunX, currentWeaponX + 84, 795, 166, 100);
	}
	draw.textAlign(draw.CENTER);
	draw.textSize(50);
	draw.fill('black');
	if (!paused && !frozen) draw.text(`${moneyCollected} coins earned, ${kills} kill(s), ${hits} hits`, 0, 20, width);
	draw.pop();
	draw.strokeWeight(0);
	draw.fill('black');
    draw.stroke(0);
	draw.textSize(50);
    draw.textAlign(draw.CENTER, draw.CENTER);
	draw.textSize(25);
	var onhighway = false;
	if (levelInfo.aesthetics.highway) {
		for (const f of levelInfo.aesthetics.highway) {
			if (colliding({x: x, y: y, r: 35}, {x: f[0], y: f[1], w: f[2], h: f[3]})) {
				onhighway = true;
				break;
			}
		}
	}
	if (!onhighway) spd = ogspd;
	else {
		draw.text(`[${(100 * (spd - ogspd) / (maxspd - ogspd)).toFixed(1)}%] SHIFT = accelerate`, 750, 800, 500);
		if (draw.keyIsDown(16)) spd += 0.4;
		else spd -= 0.1;
		if (spd < ogspd) spd = ogspd;
		if (spd > maxspd) spd = maxspd;
	}
    if (equippedGuns[guns[selected-1]][3] > 1000000000 && !experiments.ammoloss){
	    draw.text(`Ammo: infinity`, 750, 870, 500);
    }
    else {
		equippedGuns[guns[selected-1]][3] += 0.01;
        if (equippedGuns[guns[selected-1]][3] == 0){
            draw.fill(red); // uhh which one of you guys did this
        }
    	draw.text(`Ammo: ${Math.round(equippedGuns[guns[selected-1]][3])}`, 750, 870, 500);
    }
	var now = Date.now();
	if (hp <= 0 && window.deadTime) now = deadTime;
	var totalHealth = 0;
	var aliveEnemies = 0;
	Object.keys(levelInfo.enemies).forEach((type) => {
		levelInfo.enemies[type].forEach((en) => {
			if (en.health > 0) aliveEnemies++;
			totalHealth += en.health;
		});
	});
	if (stageDone) now = doneTime;
	var time = (now - started) / 1000;
	var hours = Math.floor(time / 3600);
	var minutes = Math.floor(time / 60) % 60;
	var seconds = time % 60;
	seconds = seconds.toFixed(2);
	var timeString = '';
	draw.textSize(30);
	if (hours) timeString = `${hours}:`;
	if (minutes && hours) timeString += `${String(minutes).padStart(2, '0')}:`;
	if (hours && !minutes) timeString += "00:";
	if (minutes && !hours) timeString += minutes + ":";
	if (hours || minutes) timeString += `${String(seconds).padStart(5, '0')}`;
	else timeString += seconds;
	draw.fill('black');
	if (hp <= 0) draw.fill('red');
	if (stageDone) draw.fill('blue');
	draw.text(timeString, 1300, 875);
	draw.fill('black');
	draw.textSize(15);
	if (!frozen) {
		draw.text(window.customStatus ?? `Enemies left: ${aliveEnemies}/${totalOriginalEnemies}`, 1475, 855, 500);
		draw.rect(1475, 875, 500, 10);
		draw.fill('green');
		draw.rect(1475, 875, 500 * (window.customStatusLength ?? totalHealth) / (window.customStatusOriginal ?? totalOriginalHealth), 10);
	}
	draw.pop();
	// draw.pop();
	if (debugMode) {
		draw.push();
		debugStrings = [];
		debugStrings.push(`position: ${x} ${y}`);
		debugStrings.push(`recoil: ${recoil[0]} ${recoil[1]}`);
		debugStrings.push(`hp: ${hp} / ${oghp}`);
		debugStrings.push(`gameIn: ${localStorage.gameIn}`);
		draw.fill('black');
		draw.stroke('white');
		draw.textAlign(draw.LEFT, draw.TOP);
		draw.textSize(30);
		draw.text(debugStrings.join("\n"), 10, 10);
		draw.pop();
	}
	triggerEvent('updateDone');
}
resized = () => {
	if (!document.querySelector('canvas')) return;
	const screenWidth = innerWidth;
	const screenHeight = innerHeight;
	const ratio = screenWidth / screenHeight;
	var text;
	if (ratio > width / height) text = "height: 99vh;";
	else text = "width: 99vw;";
	if (document.querySelector("canvas").style.cssText !== text) document.querySelector("canvas").style.cssText = text;
};
addEventListener('resize', resized);
var tassing = new URL(location.href).searchParams.get('tas');
var s = function(sketch) {
	sketch.setup = async function() {
		draw.angleMode(draw.DEGREES);
		sketch.createCanvas(width, height);
		player = draw.loadImage("player.svg");
		gunX = draw.loadImage("images/other/x.svg");
		draw.canvas.onclick = () => {
			if (!gameStarted) {
				started = Date.now();
				gameStarted = true;
				if (tassing) {
					var toolbar = document.createElement('div');
					toolbar.addEventListener('mousedown', (ev) => ev.stopPropagation());
					toolbar.addEventListener('mouseup', (ev) => ev.stopPropagation());
					toolbar.style.position = 'absolute';
					toolbar.style.top = 0;
					toolbar.style.left = 0;
					document.body.appendChild(toolbar);
					toolbar.textContent = 'Speedrun tools: ';
					var fadvance = document.createElement('button');
					fadvance.onclick = function() {
						if (fakemouse) {
							draw.mouseX = fakemouse[0];
							draw.mouseY = fakemouse[1];
						}
						update();
					};
					fadvance.textContent = "frame advance";
					var mouse = document.createElement('button');
					mouse.textContent = "mousedown";
					mouse.onclick = function() {
						if (this.textContent == 'mousedown') {
							this.textContent = 'mouseup';
							dispatchEvent(new Event('mousedown'));
							return;
						}
						this.textContent = 'mousedown';
						dispatchEvent(new Event('mouseup'));
					}
					var pointer = document.createElement('button');
					pointer.textContent = "Emulate mouse position";
					var fakemouse = false;
					var fakemousepos = null;
					pointer.onclick = function() {
						if (fakemouse) {
							fakemouse = false;
							this.textContent = "Emulate mouse position";
							return;
						}
						fakemouse = true;
						this.textContent = "Stop emulating mouse position";
						if (!fakemousepos) fakemousebutton.click();
					}
					var fakemousebutton = document.createElement('button');
					fakemousebutton.textContent = "Set mouse position";
					fakemousebutton.onclick = () => {
						var c1 = prompt("Input x coordinate:");
						var c2 = prompt("Input y coordinate:");
						fakemousepos = [c1, c2];
					}
					toolbar.appendChild(fadvance);
					toolbar.appendChild(mouse);
					// toolbar.appendChild(pointer);
					// toolbar.appendChild(fakemousebutton);
					addEventListener('TankGame.updateDone', function removeUpdateInterval() {
						clearInterval(updateInterval);
						removeEventListener('TankGame.updateDone', removeUpdateInterval);
					})
				}
			}
            if (dead) window.location.href = "mainpage.html";
            if (stageDone) window.location.href = "mainpage.html";
		};
		loadStage = await getJSONResource("stage" + stage + ".json");
		levelInfo = loadStage['level' + level];
		if (levelInfo.background) {
			levelInfo.background.image = draw.loadImage(`images/backgrounds/${levelInfo.background.filename ?? `bg_level${level}`}.svg`);
		}
		for (const k of Object.keys(levelInfo.aesthetics)) {
			for (const a of levelInfo.aesthetics[k]) a['type'] = k;
		}
		if (new URL(location.href).searchParams.get('hard')) {
			for (const e of Object.keys(levelInfo.allEnemies)) {
				if (e.type !== 'machine') e.type = 'machine';
			}
		}
		for (const k of Object.keys(levelInfo.enemies)) {
			for (const a of levelInfo.enemies[k]) initEnemy(k, a, false);
		}
		levelInfo.getEnemyById = getEnemyById;
		levelInfo.getAestheticById = getAestheticById;
		levelInfo.__defineGetter__('all', () => {
			return [
				...levelInfo.allEnemies,
				...levelInfo.allAesthetics
			]
		});
		levelInfo.__defineGetter__('allEnemies', () => {
			const a = [];
			for (const k in levelInfo.enemies) {
				if (k === 'debug') continue;
				for (const e of levelInfo.enemies[k]) {
					if (!e.type) e.type = k;
				}
				a.push(...levelInfo.enemies[k]);
			}
			return a;
		})
		levelInfo.__defineGetter__('allAesthetics', () => {
			const a = [];
			for (const k in levelInfo.aesthetics) {
				if (k !== 'debug') a.push(...levelInfo.aesthetics[k]);
			}
			return a;
		});
		weapons = await getJSONResource('weapons.json');
	 	enemies = await getJSONResource('enemies.json');
		totalOriginalHealth = 0;
		totalOriginalEnemies = 0;
		Object.keys(enemies).forEach((e) => {
			// console.log(`${e} og health: ${enemies[e].health}`);
			if (levelInfo.enemies[e]) levelInfo.enemies[e].forEach((n) => {
				totalOriginalEnemies++;
				totalOriginalHealth += n.health ?? enemies[e].health;
			});
			images['enemies'][e] = {};
			if (!enemies[e].noCannon) images['enemies'][e]['cannon'] = draw.loadImage('images/tank_cannons/' + e + '.svg');
			images['enemies'][e]['body'] = draw.loadImage(`images/tank_bodies/${e}.svg`);
		})
		var other = [
			'coin',
			'medpack',
			'pistol',
			'treads1',
			'treads2',
			'x'
		];
		other.forEach((o) => {
			images['other'][o] = draw.loadImage(`images/other/${o}.svg`);
		});
		globalThis.updateInterval = setInterval(update, 1000 / fps);
    };
};
var draw = new p5(s, "pad");