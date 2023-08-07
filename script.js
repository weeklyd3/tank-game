// this is fun
Object.prototype.debug = function(override = null) {
	function represent(value) {
		if (value == null || value == undefined) {
			var nullString = document.createElement('span');
			nullString.classList.add('debug-null');
			nullString.textContent = String(value);
			return nullString;
		}
		else if (typeof value == 'string') {
			var str = document.createElement('span');
			str.classList.add('debug-string');
			str.textContent = JSON.stringify(value);
			return str;
		}
		else if (typeof value == 'function') {
			var func = document.createElement('span');
			func.classList.add('debug-function');
			func.textContent = 'function';
			return func;
		}
		else if (typeof value == 'number' || typeof value == 'boolean') {
			var num = document.createElement('span');
			num.classList.add('debug-number');
			num.textContent = value;
			return num;
		}
		else if (typeof value == 'object') {
			var showButton = document.createElement('button');
			showButton.classList.add('nostylebutton');
			if (Array.isArray(value)) showButton.textContent = `show ${value.length} items`;
			else showButton.textContent = `show ${Object.getOwnPropertyNames(value).length} keys`;
			showButton.style.cssText = 'border: 1px solid;';
			showButton.onclick = () => {
				var toShow = value;
				var parent = showButton.parentNode;
				parent.removeChild(showButton);
				var d = getDumpOfObjectOrArray(value);
				d.style.marginLeft = '15px';
				parent.appendChild(d);
			}
			return showButton;
		}
	}
	function getDumpOfObjectOrArray(obj) {
		var element = document.createElement('ul');
		element.classList.add('debug-info-objectlist');
		if (Array.isArray(obj)) element.classList.add('debug-info-array');
		(Array.isArray(obj) ? obj : Object.getOwnPropertyNames(obj)).forEach((o, i) => {
			var list = document.createElement('li');
			list.classList.add('debug-info-list');
			var name = document.createElement('span');
			name.style.color = 'blue';
			name.textContent = (Array.isArray(obj) ? i : o);
			var value = (Array.isArray(obj) ? o : obj[o]);
			list.appendChild(name);
			list.appendChild(document.createTextNode(': '));
			list.appendChild(represent(value));
			element.appendChild(list);
		})
		return element;
	}
	var clone = (!Array.isArray(this) ? Object.assign({}, this) : [...this]);
	if (override) clone = override;
	var dialog = document.createElement('div');
	dialog.style.position = 'fixed';
	dialog.style.left = '10px';
	dialog.style.top = '10px';
	dialog.style.overflow = 'scroll';
	dialog.style.maxHeight = '90vh';
	dialog.style.padding = '5px';
	dialog.style.backgroundColor = 'white';
	dialog.style.border = '1px solid black';
	dialog.style.color = 'black';
	var n = document.createElement('strong');
	n.textContent = `Object debug as it was at ${new Date().toLocaleTimeString("en-US")}`;
	dialog.appendChild(n);
	dialog.appendChild(getDumpOfObjectOrArray(clone));
	close = document.createElement('button');
	close.textContent = 'close';
	close.onclick = () => dialog.parentNode.removeChild(dialog);
	dialog.appendChild(close);
	close.setAttribute('class', 'nostylebutton actualnostyle');
	document.body.appendChild(dialog);
}
totalErrors = 0;
Array.prototype.debug = Object.prototype.debug;
class _underTheBus extends Error {
	constructor(msg) {
		super(msg);
		this.name = "TankGameError";
	}
}
// for idiots like me
documnent = document;
documnet = document;
function throwUnderTheBus(msg) {
	throw new _underTheBus(msg);
}
// move point [x, y] distance at angle degrees.
function movePointAtAngle(x, y, angle, distance) {
	angle = angle * (180/Math.PI);
    return [
        x + (Math.sin(angle) * distance),
        y - (Math.cos(angle) * distance)
    ];
}
function angleBetweenTwoPoints(x1, y1, x2, y2) {
	return (180 + (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI) + 90;
    // just get chatgpt to write it
	// oh wait
	// i was copy pasting from guthib
	// YOU SPELLED IT WRONG. --guthib.com
}
function dist(x1, y1, x2, y2){
    return Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2))
}
// checks for collision between circle {x:x, y:y, r:r} and rectangle {x:x1, y:y1, w:w, h:h}
function colliding(circle, rect) {
    var distX = Math.abs(circle.x - rect.x - rect.w / 2);
    var distY = Math.abs(circle.y - rect.y - rect.h / 2);
    if (distX > (rect.w / 2 + circle.r)) {return false;}
    if (distY > (rect.h / 2 + circle.r)) {return false;}
    if (distX <= (rect.w / 2)) {return true;}
    if (distY <= (rect.h / 2)) {return true;}
    var dx = distX - rect.w / 2;
    var dy = distY - rect.h / 2;
    return (dx * dx + dy * dy <= (circle.r * circle.r));
}
// moves (p1x, p1y) towards p2x, p2y by amount units, then returns the change [delta x, delta y]
function movePointTowardsAnotherPoint(p1x, p1y, p2x, p2y, amount) {
    var distance = draw.dist(p1x, p1y, p2x, p2y);
	var ratio = amount / distance;
	return [(p2x - p1x) * ratio, (p2y - p1y) * ratio];
}
// generates random integer between s and e
function randint(s, e){
    return Math.floor(Math.random()*(e-s+1)) + s;
}
// rotates point (x1, y1) around point (x2, y2) clockwise by k degrees
function rotatePoint(x1, y1, x2, y2, k) {
	const rad = k * (Math.PI / 180);
	const xPrime = (x1 - x2) * Math.cos(rad) - (y1 - y2) * Math.sin(rad) + x2;
	const yPrime = (x1 - x2) * Math.sin(rad) + (y1 - y2) * Math.cos(rad) + y2;
	return [xPrime - x2, yPrime - y2];
}
// checks for intersection between 2 rectangles {x:x, y:y, width:width, height:height}
function checkRectIntersection(rect1, rect2) {
    if (rect1.x + rect1.width > rect2.x &&
        rect1.x < rect2.x + rect2.width &&
        rect1.y + rect1.height > rect2.y &&
        rect1.y < rect2.y + rect2.height) {
        return true;
    }
    if (rect2.x + rect2.width > rect1.x && rect2.x < rect1.x + rect1.width &&
        rect2.y + rect2.height > rect1.y && rect2.y < rect1.y + rect1.height) {
        return true;
    }
    return false;
}
function setOpacity(draw, opacity) {
	var canvas = draw.canvas;
	var ctx = canvas.getContext('2d');
	ctx.globalAlpha = opacity;
}
var link = document.createElement('a');
link.style.display = 'block';
link.href = 'https://tickets.weeklyd3.repl.co/?do=new';
link.textContent = "report a bug";
link.style.backgroundColor = 'black';
link.style.color = 'white';
if (['/intro.html', '/game.html'].indexOf(location.pathname) == -1) document.body.appendChild(link);
console.log("Please do not abuse this console.")