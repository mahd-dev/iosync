var iosync = (function(){

  var _socket = io.connect("ws://" + location.host);
  var _data = {}; // container of ll syncronized data
  var _tmp_data = {};
  var _observers = [];
  var _ignore = []; // we used this var to prevent observe loopback

  jsonpatch.observe(_data, function (patch) {
    jsonpatch.apply(_tmp_data, jsonpatch.compare(_tmp_data, _data));
    // detecting patch type
    var client_patches = [];
    var server_patches = [];
    patch.forEach(function (p) {
      var ign = false;
      for (var i = 0; i < _ignore.length; i++) {
        if(!jsonpatch.compare(p,_ignore[i]).length){ // patch is from server so prevent loopback to server
          _ignore.splice(i,1); // thanks _ignore, now we don't need that patch anymore
          ign = true;
          server_patches.push(p); // store the ptach to notify client watchers later
          break; // search done
        }
      }
      if(!ign) client_patches.push(p); // if patch don't exists in server patches so it's a client patch
    });
    if(client_patches.length){
      _socket.emit("patch", client_patches); // emit patches to server
    }

    // trigger observers
    _observers.forEach(function (o) {
      var patches = [];
      client_patches.forEach(function (p) {
        if((p.path && p.path.indexOf(o.path))==0 || (p.op=="move" && p.from.indexOf(o.path)==0)){ // check if observer is watching this path
          p.source = "client"; // define patch source
          patches.push(p);
        }
      });
      server_patches.forEach(function (p) {
        if((p.path && p.path.indexOf(o.path))==0 || (p.op=="move" && p.from.indexOf(o.path)==0)){
          p.source = "server";
          patches.push(p);
        }
      });
      if(patches.length) {
        o.observer(xPath_get(o.path), patches); // trigger the observer
      }
    });

  });

  _socket.on('patch', function (patch) { // yeah! we have new patches from server
    jsonpatch.apply(_tmp_data, patch);
    Array.prototype.push.apply(_ignore, jsonpatch.compare(_data, _tmp_data)); // save patches into _ignore to prevent jsonpatch.observe send them back to server
    jsonpatch.apply(_data, patch); // apply patches
  });

  return{
    bind: function (path, params, observer) {
      path = (path.charAt(0)!="/"?"/":"") + path; // add the first '/' if it dosn't exists
      if(typeof observer === "function") _observers.push({ // observer is optional, because we provide "reference binding"
        path: path, // what it will observe
        observer: observer // callback function
      });

      // create an empty var temporary until the server send us the content
      var existing = xPath_get(path);
      if(existing == undefined){
        _socket.emit("bind", {path: path, params: params}, function (patch) { // notify server to provide us lastest value, and upcoming updates
          if(patch){
            jsonpatch.apply(_tmp_data, patch);
            Array.prototype.push.apply(_ignore, jsonpatch.compare(_data, _tmp_data)); // save patches into _ignore to prevent jsonpatch.observe send them back to server
            jsonpatch.apply(_data, patch); // apply patches
          }
        });
        var add = [{op:"add", path: path, value: {}}];
        jsonpatch.apply(_tmp_data, add);
        Array.prototype.push.apply(_ignore, jsonpatch.compare(_data, _tmp_data));
        jsonpatch.apply(_data, add);
      }else{
        _observers.forEach(function (o) {
          if(path.indexOf(o.path)==0){ // check if observer is watching this path
            o.observer(existing, [{op:"add", path: path, source: "server", value: existing}]);
          }
        });
      }
      return xPath_get(path); // return it also for "reference binding"
    },
    unbind: function (path) {
      _socket.emit("unbind", path); // notify server to stop sending us updates about that var
      var patch = {"op": "remove", "path": path};
      jsonpatch.apply(_tmp_data, [patch]);
      Array.prototype.push.apply(_ignore, jsonpatch.compare(_data, _tmp_data)); // prevent sending remove patch to server
      jsonpatch.apply(_data, [patch]); // delete that path locally
    },
    patch: function (path, value) {
      jsonpatch.apply(_data, [{op: "replace", path: path, value: value}]);
    },
    apply_params: function (path, params) {
      _socket.emit("apply_params", {path: path, params: params});
    },
    login: function (params, callback) {
      _socket.emit('login', params, callback);
    },
    logout: function (callback) {
      _socket.emit('logout', '', callback);
    },
    check: function (option, callback) {
      _socket.emit('check', option, callback);
    },
    query: function (url, params, callback) {
      _socket.emit('query', {url: url, params: params}, callback);
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

})();
