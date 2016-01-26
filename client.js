var iosync = function(url){

  var _socket = io.connect(url || "ws://" + location.host);
  var _data = {};
  var _ignore = [];
  var _observers = [];

  jsonpatch.observe(_data, function (patch) {
    for (var p in patch) if (patch.hasOwnProperty(p)) {
      var ign_index = 0;
      search_loop: while (ign_index < _ignore.length){ // searcing for the patch in _ignore array
        var diff = jsonpatch.compare(patch[p], _ignore[ign_index]);
        if(diff.length) for (var i=0; i<diff.length; i++) if (diff[i].path=="/op" && (diff[i].value=="add" || diff[i].value=="replace")) diff.splice(i,1);
        if(!diff.length) break search_loop;
        ign_index++;
      }
      if(ign_index==_ignore.length){ // patch not found in _ignore array
        _socket.emit("patch", [patch[p]]);
        trigger_observers([patch[p]], "client");
      }else{
        _ignore.splice(ign_index, 1);
        trigger_observers([patch[p]], "server");
      }
    }
  });

  _socket.on('patch', function (patch) {
    Array.prototype.push.apply(_ignore, patch);
    jsonpatch.apply(_data, patch);
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
            jsonpatch.apply(_data, patch);
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

      jsonpatch.apply(_data, patch);
    },
    apply_params: function (options) {
      var opt = options || {};
      var path = opt.path;
      var params = opt.params;

      _socket.emit("apply_params", {path: path, params: params});
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
        if (patch.hasOwnProperty(p) && ((patch[p].path && patch[p].path.indexOf(_observers[o].path))==0 || (patch[p].op=="move" && patch[p].from.indexOf(_observers[o].path)==0))) { // check if observer is watching this path
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
      if(keys.hasOwnProperty(k) && keys[k]!=""){ // escape empty keys
        if(val.hasOwnProperty(keys[k])) val=val[keys[k]]; // okay, jump to that key
        else return undefined; // oups, key does not exists
      }
    }
    return val; // path exists so return it's value
  }

};
