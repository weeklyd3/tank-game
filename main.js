var game = JSON.parse(localStorage.getItem("gameIn"));
if (game[0] == -1) window.location.href = "mainpage.html";
var gameStarted = false;
var width = 2000;
var height = 800;
var fps = 30;
var player;
var loadStage;
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
var x = 35;
var y = 400;
var stage = game[0];
if (stage == undefined) stage = 1;
var level = game[1];
var guns = game[2];
var speed = 5;
var levelInfo;
function updateGame() {
    if (draw.keyIsDown(draw.RIGHT_ARROW) || draw.keyIsDown(68)) x += 4;
	if (draw.keyIsDown(draw.LEFT_ARROW) || draw.keyIsDown(65)) x -= 4;
	if (draw.keyIsDown(draw.UP_ARROW) || draw.keyIsDown(87)) y -= 4;
	if (draw.keyIsDown(draw.DOWN_ARROW) || draw.keyIsDown(83)) y += 4;
    var mouseX = draw.mouseX;
    var mouseY = draw.mouseY;
    draw.strokeWeight(36);
    draw.stroke("white");
    draw.line(0, 0, levelInfo['length'], 0);
    draw.line(levelInfo['length'], 0, levelInfo['length'], height);
    draw.line(0, height, levelInfo['length'], height);
    draw.line(0, 0, 0, height);
    draw.background(draw.color(loadStage['background']));
    draw.push();
    draw.strokeWeight(65);
    draw.stroke('black');
	draw.strokeCap(draw.SQUARE);
    draw.line(width/2, height/2, width/2+movePointTowardsAnotherPoint(width/2, height/2, mouseX, mouseY, 70)[0], height/2+movePointTowardsAnotherPoint(width/2, height/2, mouseX, mouseY, 70)[1])
    draw.pop();
    if (y < 35) y = 35;
    draw.image(player, width/2-35, height/2-35, 70, 70);
}
var xoffset = 0;
var firstTime = true;
function update() {
    draw.clear();
	resized();
    // draw.push();
    draw.translate(xoffset, 0);
    // wait no
    // timmy make index.html a start page
    // and a levels page and stuff like plane game
    // this is for just the game page
    // oh
    // just do what u did in plane game
    // that's tuff
    // i would normally read from a save json
    // but i guess we would have to use localStorage now
    if (!gameStarted) {
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
        draw.text(`You are playing stage ${game[0]} level ${game[1]}.`, width/2, height/2-60);
        draw.textSize(50);
        draw.text("Click this to start", width/2, height/2+40);
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
    // draw.pop();
}
resized = () => {
    const screenWidth = innerWidth;
    const screenHeight = innerHeight;
    const ratio = screenWidth / screenHeight;
    var text;
    if (ratio > width / height) text = "height: 99vh;";
    else text = "width: 99vw;";
    if (document.querySelector("canvas").style.cssText !== text) document.querySelector("canvas").style.cssText = text;
};
addEventListener('resize', resized);
var s = function (sketch) {
    sketch.setup = async function () {
        sketch.createCanvas(width, height);
        globalThis.updateInterval = setInterval(update, 1000 / fps);
    	player = draw.loadImage("player.svg");
        draw.canvas.onclick = () => {
            if (!gameStarted) gameStarted = true;
        };
        loadStage = await getJSONResource("stage" + stage + ".json");
        levelInfo = loadStage['level'+level];
    };
};
var draw = new p5(s, "pad");