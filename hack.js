/*
  Hack developed by vanflux
  Repository: https://github.com/vanflux/google-snake-hack
*/

(async () => {
	function findGlobal(func, obj=window) {
    for (let [key, value] of Object.entries(obj)) {
      if (!value) continue;
      try {
				const res = func(value, key);
				if (res) return res;
      } catch (exc) {}
     };
  }
	
  const renderObj = findGlobal(x => x.prototype.render && x.prototype.render.toString().includes('canvas.width') ? x : undefined);
  if (!renderObj) throw new Error('Render prot not found, signature scan isnt working anymore');
	const [,gameInstanceVarName] = findGlobal(x => x.prototype.render.toString().match(/this\.(\w+)\.direction/)) || [];
  if (!gameInstanceVarName) throw new Error('Game instance var name not found, signature scan isnt working anymore');
	const [,bodyVarName] = findGlobal(x => x.prototype.reset.toString().match(/this\.(\w+)\.push\(new/)) || [];
  if (!bodyVarName) throw new Error('Body var name not found, signature scan isnt working anymore');
	const [,fruitVarName1, fruitVarName2] = findGlobal(x => x.prototype.reset.toString().match(/this.(\w+)\[0\]\.(\w+)\.x/)) || [];
  if (!fruitVarName1 || !fruitVarName2) throw new Error('Fruit var names not found, signature scan isnt working anymore');
	const [,mapSizeVarName] = findGlobal(x => x.prototype.reset.toString().match(/this\.(\w+)\.width;/)) || [];
  if (!mapSizeVarName) throw new Error('Map size var name not found, signature scan isnt working anymore');

	console.log('renderObj.name', renderObj.name);
	console.log('gameInstanceVarName', gameInstanceVarName);
	console.log('bodyVarName', bodyVarName);
	console.log('fruitVarName1', fruitVarName1);
	console.log('fruitVarName2', fruitVarName2);
	console.log('mapSizeVarName', mapSizeVarName);

	function getGameInstance() {
		console.log(renderObj.prototype.render);
		return new Promise(resolve => {
			const original = renderObj.prototype.render;
			renderObj.prototype.render = function (...args) {
				console.log('Game Instance Hooked');
				resolve(this[gameInstanceVarName]);
				renderObj.prototype.render = original;
				return original.call(this, ...args);
			}
		});
	}

	function changeDir(instance, newDir) {
		instance.direction = newDir;
	}

	function getDir(instance) {
		return instance.direction;
	}

	function getBody(instance) {
		return instance[bodyVarName];
	}

	function getFruitPos(instance) {
		return instance[fruitVarName1][0][fruitVarName2];
	}

	function getMapSize(instance) {
		return instance[mapSizeVarName];
	}

	function buildMap(instance) {
		const body = getBody(instance);
		const mapSize = getMapSize(instance);
		const map = new Array(mapSize.width).fill().map(x => new Array(mapSize.height).fill(0));
		body.forEach(({x, y}) => map[x][y] = 1);
		return map;
	}

	function getHeatMap(map, pos) {
		const width = map.length;
		const height = map[0].length;
		const heatMap = new Array(width).fill().map(x => new Array(height).fill(0));
		const stack = [{x: pos.x, y: pos.y, c: 1}];

		while(stack.length > 0) {
			const {x, y, c} = stack.shift();
			if (c > 1 && map[x][y] > 0) continue;
			if (heatMap[x][y] != 0) continue;
			heatMap[x][y] = c;
			if (x > 0) stack.push({c: c+1, x: x-1, y});
			if (x < width-1) stack.push({c: c+1, x: x+1, y});
			if (y > 0) stack.push({c: c+1, x, y: y-1});
			if (y < height-1) stack.push({c: c+1, x, y: y+1});
		}

    //console.log(map.map(x => x.map(x => String(x).padStart(2, '0')).join(' ')).join('\n'));
		//console.log('-----');
    //console.log(heatMap.map(x => x.map(x => String(x).padStart(2, '0')).join(' ')).join('\n'));
		return heatMap;
	}

	async function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
	
	async function run() {
		/*console.log(getHeatMap(
			[[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1] ],
			{x: 16, y: 14},
		));*/
		
		const instance = await getGameInstance();
		let lastHash = 0;
		const calcHash = (x, y) => x * 100000 + y;
		let start = Date.now();
		while(Date.now() - start < 30000000) {
			const body = getBody(instance);
			const {x: headX, y: headY} = body[0];
			const {x: tailX, y: tailY} = body[body.length-1];

			const hash = calcHash(headX, headY);
			if (lastHash != hash) {
        lastHash = hash;

        const {x: fruitX, y: fruitY} = getFruitPos(instance);
        const map = buildMap(instance);
				const tailHeatMap = getHeatMap(map, {x: tailX, y: tailY});
				const fruitHeatMap = getHeatMap(map, {x: fruitX, y: fruitY});

				//console.log(map.map(x => x.map(x => String(x).padStart(2, '0')).join(' ')).join('\n'));
				//console.log('-----');
				//console.log(heatMap.map(x => x.map(x => String(x).padStart(2, '0')).join(' ')).join('\n'));

        const nextDir = () => {
					const actions = [];
					if (tailHeatMap[headX+1]?.[headY]) actions.push(['RIGHT', fruitHeatMap[headX+1]?.[headY] || 1000]);
					if (tailHeatMap[headX-1]?.[headY]) actions.push(['LEFT', fruitHeatMap[headX-1]?.[headY] || 1000]);
					if (tailHeatMap[headX]?.[headY+1]) actions.push(['DOWN', fruitHeatMap[headX]?.[headY+1] || 1000]);
					if (tailHeatMap[headX]?.[headY-1]) actions.push(['UP', fruitHeatMap[headX]?.[headY-1] || 1000]);
					const action = actions.sort((a, b) => a[1]-b[1])[0][0];
					console.log('actions', actions, '->', action);
					return action;
        };
				
				const newDir = nextDir();
        console.log({headX, headY, tailX, tailY, fruitX, fruitY, newDir});

        changeDir(instance, newDir);
      }
			await sleep(50);
		}
	}

	run();
})()
