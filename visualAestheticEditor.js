(async function(window) {
	function log(...msg) {
		console.log(`%cvisual aesthetic editor:`, 'color: red; font-weight: bold;', ...msg);
	}
	log('waiting for 5000 ms... (for stuff to load)');
	function wait(ms) {
		return new Promise((r) => setTimeout(r, ms));
	}
	await wait(5000);
	log('finished loading');
	var url = new URL(location.href);
	log('looking for `editaesthetics` url parameter');
	if (!url.searchParams.get('editaesthetics')) return log;
	log('starting visual aesthetic editor');
	immortal = true;
	noWin = true;
	var aesthetics = levelInfo.aesthetics;
	var types = Object.keys(levelInfo.aesthetics);
	function addOverlay() {
		var div = document.createElement('div');
		div.innerHTML = `<button onclick="paused = !paused;">pause/unpause</button>`;
		var f = document.createElement('form');
		f.action = 'javascript:;';
		var l = document.createElement('label');
		l.innerHTML = 'aesthetic type: ';
		var el = document.createElement('select');
		for (const t of ['rect', 'circle', 'text', 'barrier', 'lava', 'line']) el.innerHTML += `<option>${t}</option>`;
		l.appendChild(el);
		f.appendChild(l);
		var submit = document.createElement('button');
		submit.textContent = 'load';
		f.appendChild(submit);
		var actualArea = document.createElement('textarea');
		load(actualArea, 'rect');
		actualArea.rows = 10;
		actualArea.cols = 80;
		f.addEventListener('submit', () => load(actualArea, el.value));
		var tarea = document.createElement('label');
		tarea.style.display = 'block';
		tarea.innerHTML = '<div>Edit aesthetic code:</div>';
		tarea.appendChild(actualArea);
		f.appendChild(tarea);
		var apply = document.createElement('button');
		apply.type = 'button';
		apply.textContent = "apply";
		apply.addEventListener('click', () => applyAesthetics(actualArea.value, el.value));
		f.appendChild(apply);
		var ex = document.createElement('button');
		ex.type = 'button';
		ex.textContent = "DONE";
		ex.addEventListener('click', exportAesthetics);
		f.appendChild(ex);
		div.appendChild(f);
		document.body.appendChild(div);
	}
	function applyAesthetics(contents, type) {
		var parsed;
		try {
			parsed = JSON.parse(contents);
		} catch (e) {
			alert("Not valid JSON!");
			return;
		}
		levelInfo.aesthetics[type] = JSON.parse(contents);
	}
	function exportAesthetics() {
		var ae = levelInfo.aesthetics;
		for (const key in ae) {
			if (!ae[key].length) delete ae[key];
		}
		var output = document.createElement('div');
		output.innerHTML = `<h2>Outputted aesthetic code</h2>` +
			`<p>To apply this:</p>` +
			`<ol><li>Press APPLY or else it won't save.</li>` +
			`<li>If you don't have write access to ` +
			`the repl, fork @idkwutocalmself/tank-game ` +
			`and message some_random_chatting_person#3872 ` +
			`on discord to make me give you access.</li>` +
			`<li>look for key <code>level${level}</code> ` + 
			`inside <code>stage${stage}.json</code>.</li>` +
			` modify the <code>aesthetics</code> property ` + 
			`to contain this:</li></ul>`;
		var label = document.createElement('label');
		label.innerHTML = `<div>Code:</div>`;
		var area = document.createElement('textarea');
		area.style.display = 'block';
		area.rows = 10;
		area.cols = 40;
		area.value = JSON.stringify(ae, null, 4);
		label.appendChild(area);
		ok(output, label);
	}
	function load(area, type) {
		log(`loading type ${type}`);
		var ae = aesthetics[type];
		if (ae == null) log(`creating type`);
		if (ae == null) ae = [];
		area.value = JSON.stringify(ae, null, 2);
	}
	async function ok(...nodes) {
		return new Promise((resolve, reject) => {
			var overlay = document.createElement('div');
			overlay.style.cssText = `top: 50%; left: 50%; position: fixed; transform: translate(-50%, -50%); border: 1px solid; padding: 5px; background: white; color: black;`;
			for (const n of nodes) overlay.appendChild(n);
			var ok = document.createElement('button');
			ok.addEventListener('click', () => {
				overlay.parentNode.removeChild(overlay);
				resolve();
			});
			ok.textContent = "OK";
			ok.style.color = 'black';
			overlay.appendChild(ok);
			document.body.appendChild(overlay);
		});
	}
	addOverlay();
})(window)