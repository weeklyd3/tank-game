onerror = (event, source, lineno, colno, error) => {
	if (location.hostname == 'tank-game.idkwutocalmself.repl.co') paused = true;
	totalErrors++;
	var e = document.createElement('div');
	e.classList.add('error-dialog');
	e.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);`;
	e.style.backgroundColor = 'pink';
	e.style.color = 'black';
	var text = document.createElement('strong');
	text.textContent = "ERROR!!! ERROR!!! ERROR!!!";
    var small = document.createElement('small')
    small.textContent = 'try clearing your cache, going to the start page, and clicking the play button. this should fix the problem. if it doesnt, report it below.'
	var pre = document.createElement('pre');
	pre.textContent = `${error}\n${error.stack}\nDate and time: ${new Date().toLocaleString()}\nLine: ${lineno} / Column: ${colno}\nSource: ${source}\nTotal number of errors: ${totalErrors}`;
	var load = document.createElement('button');
	load.textContent = "Inspect file";
	load.onclick = () => {
		this.disabled = 'disabled';
		this.textContent = "Loading file...";
		fetch(source).then((content) => content.text())
		.then((text) => {
			pre.textContent += `\nThe following preview shows the file as it was at ${new Date().toLocaleString()}, not when the error triggered.\nIt will be wrong if the file was then changed.\nPreview:\n`;
			var lines = text.split('\n');
			if (lineno > 2) pre.textContent += `    ${lines[lineno - 3]}\n`;
			if (lineno > 1) pre.textContent += `    ${lines[lineno - 2]}\n`;
			bold = document.createElement('strong');
			bold.style.display = 'block';
			bold.textContent = `    ${lines[lineno - 1]}`;
			pre.appendChild(bold);
			pre.appendChild(document.createTextNode('    ' + (' '.repeat(colno - 1)) + '^'));
			this.textContent = "Loaded!";
		})
	}
	var ok = document.createElement('button');
	ok.onclick = () => e.parentNode.removeChild(e);
	ok.textContent = 'ok...?';

	var getout = document.createElement('button');
	getout.onclick = () => {
		Array.from(document.getElementsByClassName('error-dialog')).forEach((e) => {
			var parent = e.parentNode;
			parent.removeChild(e);
		})
	}
	getout.textContent = "Dismiss all";
	
	ok.classList.add('nostylebutton');
	ok.classList.add('actualnostyle');
	load.classList.add('nostylebutton');
	load.classList.add('actualnostyle');
	getout.classList.add('nostylebutton');
	getout.classList.add('actualnostyle');
	e.appendChild(text);
	// e.appendChild(small);
	e.appendChild(pre);
	e.appendChild(load);
	e.appendChild(document.createTextNode(' '));
	e.appendChild(ok);
	e.appendChild(document.createTextNode(' '));
	e.appendChild(getout);
	var canBeReported = document.createElement('div');
	e.appendChild(canBeReported);
	document.body.appendChild(e);
	if (source === 'debugger eval code') {
		// this kind of stuff is irrelevant to files
		// here. bail out.
		canBeReported.textContent = "This error cannot be reported as it seems to be from user input into the console.";
		return;
	}
	canBeReported.textContent = "You can report this error by sending it to the developers. Some information, like the time, error information, and page location will be collected. (If the issue still persists after a long time, please make an account and open a thread in ";
	i = document.createElement('a');
	i.setAttribute('href', `https://tickets.weeklyd3.repl.co/index.php?do=new`);
	i.textContent = "the bug tracking system";
	canBeReported.appendChild(i);
	canBeReported.appendChild(document.createTextNode('. Thanks!'));
	f = document.createElement('form');
	l = document.createElement('label');
	l.textContent = "(optional) How did you trigger this?";
	t = document.createElement('textarea');
	t.setAttribute('cols', 50);
	t.setAttribute('rows', 10);
	t.setAttribute('name', 'details');
	t.style.display = 'block';
	l.appendChild(t);
	submit = document.createElement('input');
	submit.type = 'submit';
	submit.value = 'report this error';
	f.addEventListener('submit', async () => {
		submit.disabled = 'disabled';
		var file = await fetch(source);
		var text = await file.text();
		var split = text.split('\n');
		var relevantLines = [split[lineno - 3], split[lineno - 2], split[lineno - 1]];
		var data = new FormData();
		data.set('details', t.value);
		data.set('source', source);
		data.set('lineno', lineno);
		data.set('colno', colno);
		data.set('stack', error.stack);
		data.set('error', error);
		data.set('line', JSON.stringify(relevantLines));
		body = [];
		data.forEach((value, key) => {
			var encode1 = encodeURIComponent(key);
			var encode2 = encodeURIComponent(value);
			body.push(`${encode1}=${encode2}`);
		});
		fetch('https://discord-bot.weeklyd3.repl.co/error-report', {
			'method': "POST",

  headers: {
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
  },
			'body': body.join('&')
		})
		.then((r) => r.text())
		.then((t) => {
			submit.value = t;
			l.after(document.createTextNode("Error report sent! Feel free to close this."));
			l.parentNode.removeChild(l);
		});
	})
	submit.style.display = 'block';
	f.appendChild(l);
	f.appendChild(submit);
	f.action = 'javascript:;';
	canBeReported.appendChild(f);
}