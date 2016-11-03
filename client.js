var iosync = function(url){

  "use strict";
  var _socket = io.connect(url || "ws://" + location.host);
  var _data = {};
  var _ignore = [];
  var _observers = [];

  jsonpatch.observe(_data, function (patch) {
		var clean_indexes = [];
    for (var p in patch) if (patch.hasOwnProperty(p)) {

      // ignore angular modifications
      if(patch[p].path.indexOf("$$hashKey") !==-1) continue;

      // searcing for the patch in _ignore array
      var ign_index = 0;
      var found = 0;
      while (ign_index < _ignore.length){
        if(!_ignore[ign_index] || (patch[p].path.indexOf(_ignore[ign_index].path)!==0)){
          found=1;
          if(clean_indexes.indexOf(ign_index)<0) clean_indexes.push(ign_index);
        }
				ign_index++;
      }
      if(!found){ // patch not found in _ignore array
        _socket.emit("patch", [patch[p]]);
        trigger_observers([patch[p]], "client");
      }else{
        trigger_observers([patch[p]], "server");
      }
    }
		clean_indexes.sort(function(a, b) { return a - b; });
   
		var i = clean_indexes.length;
		while(i--) _ignore.splice(clean_indexes[i], 1);
  });

  _socket.on('patch', function (patch) {
    apply_patch(patch, "server");
  });

  return{
    bind: function (options) {
      var opt = options || {};
      var path = opt.path;
      var params = opt.params;
      var observer = opt.observer;

      if(typeof observer === "function") _observers.push({ // observer is optional, because we provide "reference binding"
        path: path, // what it will observe
        observer: observer // callback function
      });
      var v = xPath_get(path);
      if(v){
        setTimeout(function () { observer(v, []); }, 0);
        return v;
      }else{
        var add = [{op:"add", path: path, value: {}}];
        Array.prototype.push.apply(_ignore, add);
        jsonpatch.apply(_data, add);
        _socket.emit("bind", {path: path, params: params}, function (patch) { // notify server to provide us lastest value, and upcoming updates
          if(patch) {
            Array.prototype.push.apply(_ignore, patch);
            apply_patch(patch, "server");
          }
        });
        return xPath_get(path);
      }

    },
    unbind: function (options) {
      var opt = options || {};
      var path = opt.path || "/";

      _socket.emit("unbind", path); // notify server to stop sending us updates about that var
      Array.prototype.push.apply(_ignore, [{"op": "remove", "path": path}]);
      jsonpatch.apply(_data, patch);
      var i = 0;
      while (i<_observers.length){
        if(_observers[i].path==path) _observers.splice(i, 1);
        else i++;
      }
    },
    patch: function (options) {
      var opt = options || {};
      var patch = opt.patch;

      apply_patch(patch, "client");
    },
    apply_params: function (options) {
      var opt = options || {};
      var path = opt.path;
      var params = opt.params;

      _socket.emit("apply_params", {path: path, params: params}, function (patch) {
        if(patch) apply_patch(patch, "server");
      });
    },
    login: function (options) {
      var opt = options || {};
      var params = opt.params;
      var callback = opt.callback;

      _socket.emit('login', params, callback);
    },
    logout: function (options) {
      var opt = options || {};
      var callback = opt.callback;

      _socket.emit('logout', '', callback);
    },
    check_login: function (options) {
      var opt = options || {};
      var callback = opt.callback;

      _socket.emit('check', "login", callback);
    },
    query: function (options) {
      var opt = options || {};
      var url = opt.url;
      var params = opt.params;
      var callback = opt.callback;

      _socket.emit('query', {url: url, params: params}, callback);
    },
    _data: _data
  };

  function trigger_observers(patch, source) {
    for (var o in _observers) if (_observers.hasOwnProperty(o)) {
      var patches = [];
      for (var p in patch) {
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
    var keys = path.split("/");
    var val=_data;
    for (var k in keys) {
      if(keys.hasOwnProperty(k) && keys[k]!==""){ // escape empty keys
        if(val.hasOwnProperty(keys[k])) val=val[keys[k]]; // okay, jump to that key
        else return undefined; // oups, key does not exists
      }
    }
    return val; // path exists so return it's value
  }
  
  function apply_patch(patch, source) { // we use this to keep reference binding working
    var val;
    var new_patch = [];
    for (var p in patch) {
      if (patch.hasOwnProperty(p)) {
        val = xPath_get(patch[p].path);
        if(patch[p].op == "replace" && val instanceof Object && patch[p].value instanceof Object){
          for (var r in val) {
            if (val.hasOwnProperty(r)) {
              new_patch.push({
                op:"remove",
                path: patch[p].path + (patch[p].path[patch[p].path.length-1]=="/"?"":"/") + r.toString()
              });
            }
          }
          for (var a in patch[p].value) {
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
