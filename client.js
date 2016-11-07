let iosync = (url) => {

	"use strict";
	let _socket = io.connect(url || "ws://" + location.host);
	let _data = {};
	let _ignore = [];
	let _observers = [];

	jsonpatch.observe(_data, (patch) => {

		let clean_indexes = [];
		for (let p in patch) if (patch.hasOwnProperty(p)) {

			// ignore angular modifications
			if(patch[p].path.indexOf("$$hashKey") !==-1) continue;

			// searcing for the patch in _ignore array
			let ign_index = 0;
			let found = 0;
			while (ign_index < _ignore.length){
				if(_ignore[ign_index] && patch[p].path.indexOf(_ignore[ign_index].path)==0){
					found=1;
					if(clean_indexes.indexOf(ign_index)<0) clean_indexes.push(ign_index);
				}
				ign_index++;
			}
			if(!found){ // patch not found in _ignore array
				_socket.emit("patch", [patch[p]]);
				trigger_observers([patch[p]], "client");
			}
		}
		_ignore.splice(0, _ignore.length);

	});

	_socket.on('patch', (patch) => {
		apply_patch(patch, "server");
		for(let p of patch) trigger_observers([p], "server");
	});

	return{
		bind: (options) => {
			let opt = options || {};
			let path = opt.path;
			let params = opt.params;
			let observer = opt.observer;

			if(typeof observer === "function") _observers.push({ // observer is optional, because we provide "reference binding"
				path: path, // what it will observe
				observer: observer // callback function
			});
			let v = xPath_get(path);
			if(v){
				setTimeout(() => { observer(v, []); }, 0);
				return v;
			}else{
				let add = [];
				let exploded_path = path.split("/").filter(e=>!!e);
				let cp = "";
				for(let p of exploded_path ){
					cp += "/" + p;
					add.push({op:"add", path: cp, value: {}});
				}
				apply_patch(add, "server");
				_socket.emit("bind", {path: path, params: params}, (patch) => { // notify server to provide us lastest value, and upcoming updates
					if(patch) {
						apply_patch(patch, "server");
						for(let p of patch) trigger_observers([p], "server");
					}
				});
				return xPath_get(path);
			}

		},
		unbind: (options) => {
			let opt = options || {};
			let path = opt.path || "/";

			_socket.emit("unbind", path); // notify server to stop sending us updates about that let
			let patch = [{"op": "remove", "path": path}];
			apply_patch(patch, "server");
			for(let p of patch) trigger_observers([p], "server");
			let i = 0;
			while (i<_observers.length){
				if(_observers[i].path==path) _observers.splice(i, 1);
				else i++;
			}
		},
		patch: (options) => {
			let opt = options || {};
			let patch = opt.patch;

			apply_patch(patch, "client");
			for(let p of patch) trigger_observers([p], "client");
		},
		apply_params: (options) => {
			let opt = options || {};
			let path = opt.path;
			let params = opt.params;

			_socket.emit("apply_params", {path: path, params: params}, (patch) => {
				if(patch) {
					apply_patch(patch, "server");
					for(let p of patch) trigger_observers([p], "server");
				}
			});
		},
		login: (options) => {
			let opt = options || {};
			let params = opt.params;
			let callback = opt.callback;

			_socket.emit('login', params, callback);
		},
		logout: (options) => {
			let opt = options || {};
			let callback = opt.callback;

			_socket.emit('logout', '', callback);
		},
		check_login: (options) => {
			let opt = options || {};
			let callback = opt.callback;

			_socket.emit('check', "login", callback);
		},
		query: (options) => {
			let opt = options || {};
			let url = opt.url;
			let params = opt.params;
			let callback = opt.callback;

			_socket.emit('query', {url: url, params: params}, callback);
		},
		_data: _data
	};

	function trigger_observers(patch, source) {
		for (let o in _observers) if (_observers.hasOwnProperty(o)) {
			let patches = [];
			for (let p in patch) {
				if (patch.hasOwnProperty(p) && ((patch[p].path && patch[p].path.indexOf(_observers[o].path))===0 || (patch[p].op=="move" && patch[p].from.indexOf(_observers[o].path)===0))) { // check if observer is watching this path
					if(patch[p].path) patch[p].path = patch[p].path.slice(0, _observers[o].path.length);
					if(patch[p].from) patch[p].from = patch[p].from.slice(0, _observers[o].path.length);
					patch[p].source = source;
					patches.push(patch[p]);
				}
			}
			_observers[o].observer(xPath_get(_observers[o].path), patches); // trigger the observer
		}
	}

	function xPath_get(path) {
		let keys = path.split("/");
		let val=_data;
		for (let k in keys) {
			if(keys.hasOwnProperty(k) && keys[k]!==""){ // escape empty keys
				if(val.hasOwnProperty(keys[k])) val=val[keys[k]]; // okay, jump to that key
				else return undefined; // oups, key does not exists
			}
		}
		return val; // path exists so return it's value
	}
	
	function apply_patch(patch, source) { // we use this to keep reference binding working
		let val;
		let new_patch = [];
		for (let p in patch) {
			if (patch.hasOwnProperty(p)) {
				val = xPath_get(patch[p].path);
				if(patch[p].op == "replace" && val instanceof Object && patch[p].value instanceof Object){
					for (let r in val) {
						if (val.hasOwnProperty(r)) {
							new_patch.push({
								op:"remove",
								path: patch[p].path + (patch[p].path[patch[p].path.length-1]=="/"?"":"/") + r.toString()
							});
						}
					}
					for (let a in patch[p].value) {
						if (patch[p].value.hasOwnProperty(a)) {
							new_patch.push({
								op:"add",
								path: patch[p].path + (patch[p].path[patch[p].path.length-1]=="/"?"":"/") + a.toString(),
								value: patch[p].value[a]
							});
						}
					}
				}else new_patch.push(patch[p]);
			}
		}
		if(source=="server") Array.prototype.push.apply(_ignore, new_patch);
		jsonpatch.apply(_data, new_patch);
	}

};
