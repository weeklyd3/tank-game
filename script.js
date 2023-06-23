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

console.log("Please do not abuse this console.")