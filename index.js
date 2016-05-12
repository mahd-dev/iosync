module.exports = {
  iosync: function (opt) {
    "use strict";
    
    var def_opt = {};
    if(!opt.server){
      def_opt.server = require('http').createServer();
    }

    var io = require('socket.io')(opt.server || def_opt.server, opt.socket_io);

    if(opt.session){
      var sharedsession = require("express-socket.io-session");
      io.use(sharedsession(opt.session));
    }

    var callbacks = {
      binding: [],
      login: undefined,
      logout: undefined,
      query: [],
      middleware: []
    };

    var paths = [];

    var watchers = [];

    io.on("connection", function(socket) {

      if(!socket.handshake.session) socket.handshake.session={};
      if(!socket.handshake.session.data) socket.handshake.session.data={};

      socket.on("login", function(login_data, client_callback) {
        if(callbacks.login){
          callbacks.login(login_data, socket.handshake.session, function (err, response) {
            if (!err){
              socket.handshake.session.user = {
                id: response.user.id,
                capabilities: response.user.capabilities
              };
              socket.handshake.session.save();
              client_callback(null, response.client_params);

              for (var p in paths) {
                if (paths.hasOwnProperty(p) && paths[p].provider) {
                  for (var c in paths[p].clients) {
                    if (paths[p].clients.hasOwnProperty(c) && paths[p].clients[c].client.id == socket.id) {
                      if(paths[p].scope == "user"){
                        paths[p].provider(function (value) {
                          if(value) paths[p].clients[c].client.emit("patch", [{op: "replace", path: paths[p].path, value: value}]);
                          else paths[p].clients[c].client.emit("patch", [{op: "remove", path: paths[p].path}]);
                        }, socket.handshake.session);
                      }else if (typeof paths[p].scope == "object" && socket.handshake.session.user.capabilities) {
                        scope_loop: for (var s in paths[p].scope.read) {
                          if (paths[p].scope.read.hasOwnProperty(s) && socket.handshake.session.user.capabilities.indexOf(paths[p].scope.read[s])>-1) {
                            paths[p].provider(function (value) {
                              if(value){
                                var validate_scope = function (path, value) {
                                  if(!value || !(value.constructor===Object || value.constructor===Array) || !socket.handshake.session.user) return value;
                                  for (var v in value) if (value.hasOwnProperty(v)) {
                                    paths_loop: for (var vsp in paths) if (paths.hasOwnProperty(vsp) && paths[vsp].path==path+"/"+v && typeof paths[vsp].scope == "object") {
                                      if(!socket.handshake.session.user || !socket.handshake.session.user.capabilities) {
                                        delete value[v];
                                        break paths_loop;
                                      }else{
                                        var e=false;
                                        scope_loop: for (var vsc in paths[vsp].scope.read) if (paths[vsp].scope.read.hasOwnProperty(vsc) && socket.handshake.session.user.capabilities.indexOf(paths[vsp].scope.read[vsc])>-1){
                                          e=true;
                                          break scope_loop;
                                        }
                                        if(!e) {
                                          delete value[v];
                                          break paths_loop;
                                        }
                                      }
                                    }
                                    value[v]=validate_scope(path+"/"+v, value[v]);
                                  }
                                  return value;
                                };
                                paths[p].clients[c].client.emit("patch", [{op: "replace", path: paths[p].path, value: validate_scope(paths[p].path, value)}]);
                              }
                              else paths[p].clients[c].client.emit("patch", [{op: "remove", path: paths[p].path}]);
                            }, socket.handshake.session);
                            break scope_loop;
                          }
                        }
                      }
                    }
                  }
                }
              }

            }else client_callback(err);
          });
        } else client_callback("login_system_is_not_configured");
      });

      socket.on("logout", function(data, client_callback) {
        if(callbacks.logout){
          callbacks.logout(socket.handshake.session, function (err, response) {
            if (!err){
              delete socket.handshake.session.user;
              socket.handshake.session.save();
              client_callback(null, response.client_params);

              for (var p in paths) {
                if (paths.hasOwnProperty(p) && (paths[p].scope == "user" || typeof paths[p].scope == "object")) {
                  for (var c in paths[p].clients) {
                    if (paths[p].clients.hasOwnProperty(c) && paths[p].clients[c].client.id == socket.id) {
                      paths[p].clients[c].client.emit("patch", [{op: "remove", path: paths[p].path}]);
                    }
                  }
                }
              }

            } else client_callback(err);
          });
        } else client_callback("logout_system_is_not_configured");
      });

      socket.on("check", function (option, client_callback) {
        switch (option) {
          case 'login':
            client_callback(!!socket.handshake.session.user);
            break;
        }
      });

      socket.on('bind', function (params, callback) {
        var path = params.path;
        params = params.params;
        var path_exist = false;
        for (var p in paths) {
          if (paths.hasOwnProperty(p) && paths[p].path==path) {
            var cl_exist = false;
            clients_loop: for (var s in paths[p].clients) {
              if (paths[p].clients.hasOwnProperty(s) && paths[p].clients[s].client.id==socket.id) {
                paths[p].clients[s].params = params;
                cl_exist = true;
                break clients_loop;
              }
            }
            if(!cl_exist) paths[p].clients.push({client: socket, params: {}});

            var provide = function () {
              if(paths[p].provider) paths[p].provider(function (value) {
                if(value) {
                  var validate_scope = function (path, value) {
                    if(!value || !(value.constructor===Object || value.constructor===Array)) return value;
                    for (var v in value) if (value.hasOwnProperty(v)) {
                      paths_loop: for (var vsp in paths) if (paths.hasOwnProperty(vsp) && paths[vsp].path==path+"/"+v && typeof paths[vsp].scope == "object") {
                        if(!socket.handshake.session.user || !socket.handshake.session.user.capabilities) {
                          delete value[v];
                          break paths_loop;
                        }else{
                          var e=false;
                          scope_loop: for (var vsc in paths[vsp].scope.read) if (paths[vsp].scope.read.hasOwnProperty(vsc) && socket.handshake.session.user.capabilities.indexOf(paths[vsp].scope.read[vsc])>-1){
                            e=true;
                            break scope_loop;
                          }
                          if(!e) {
                            delete value[v];
                            break paths_loop;
                          }
                        }
                      }
                      value[v]=validate_scope(path+"/"+v, value[v]);
                    }
                    return value;
                  };
                  value = validate_scope(path, value);
                  callback([{op: "replace", path: path, value: value}]);
                }
                else callback(undefined);
              }, socket.handshake.session, params);
              else callback(undefined);
            };
            if(paths[p].scope == "public") provide();
            else if (typeof paths[p].scope == "object" && socket.handshake.session.user && socket.handshake.session.user.capabilities) {
              var priv_exist = false;
              scope_loop: for (var c in paths[p].scope.read) {
                if (paths[p].scope.read.hasOwnProperty(c) && socket.handshake.session.user.capabilities.indexOf(paths[p].scope.read[c])>-1) {
                  provide();
                  priv_exist=true;
                  break scope_loop;
                }
              }
              if(!priv_exist) callback(undefined);
            }else if (paths[p].scope == "user" && socket.handshake.session.user) {
              provide();
            }else if (paths[p].scope == "session") {
              if(paths[p].provider) paths[p].provider(function (value) {
                if(value) callback([{op: "replace", path: path, value: value}]);
                else callback(undefined);
              }, socket.handshake.session, params);
              else callback(undefined);
            }else callback(undefined);
            path_exist = true;
          }
        }
        if(!path_exist) paths.push({
          path: path,
          scope: undefined,
          provider: undefined,
          patch_processor: undefined,
          clients: [{client: socket, params: {}}]
        });
      });

      socket.on('unbind', function (path) {
        for (var p in paths) {
          if (paths.hasOwnProperty(p) && paths[p].path==path) {
            for (var s in paths[p].clients) {
              if (paths[p].clients.hasOwnProperty(s) && paths[p].clients[s].client.id==socket.id) {
                delete paths[p].clients[s];
              }
            }
          }
        }
      });

      socket.on('patch', function (patch) {
        apply_patch(patch, socket.handshake.session.user, socket);
      });

      socket.on('apply_params', function (params, callback) {
        var path = params.path;
        params = params.params;
        paths_loop: for (var p in paths) {
          if (paths.hasOwnProperty(p) && paths[p].path==path && paths[p].provider) {
            var cl_exist = false;
            clients_loop: for (var s in paths[p].clients) {
              if (paths[p].clients.hasOwnProperty(s) && paths[p].clients[s].client.id==socket.id) {
                cl_exist = true;
                paths[p].clients[s].params = params;
                break clients_loop;
              }
            }
            if(!cl_exist) {
              callback(undefined);
              return;
            }

            var provide = function () {
              if(paths[p].provider) paths[p].provider(function (value) {
                if(value) {
                  var validate_scope = function (path, value) {
                    if(!value || !(value.constructor===Object || value.constructor===Array)) return value;
                    for (var v in value) if (value.hasOwnProperty(v)) {
                      paths_loop: for (var vsp in paths) if (paths.hasOwnProperty(vsp) && paths[vsp].path==path+"/"+v && typeof paths[vsp].scope == "object") {
                        if(!socket.handshake.session.user || !socket.handshake.session.user.capabilities) {
                          delete value[v];
                          break paths_loop;
                        }else{
                          var e=false;
                          scope_loop: for (var vsc in paths[vsp].scope.read) if (paths[vsp].scope.read.hasOwnProperty(vsc) && socket.handshake.session.user.capabilities.indexOf(paths[vsp].scope.read[vsc])>-1){
                            e=true;
                            break scope_loop;
                          }
                          if(!e) {
                            delete value[v];
                            break paths_loop;
                          }
                        }
                      }
                      value[v]=validate_scope(path+"/"+v, value[v]);
                    }
                    return value;
                  };
                  value = validate_scope(path, value);
                  callback([{op: "replace", path: path, value: value}]);
                }
                else callback(undefined);
              }, socket.handshake.session, params);
              else callback(undefined);
            };
            if(paths[p].scope == "public") provide();
            else if (typeof paths[p].scope == "object" && socket.handshake.session.user && socket.handshake.session.user.capabilities) {
              var priv_exist = false;
              scope_loop: for (var c in paths[p].scope.read) {
                if (paths[p].scope.read.hasOwnProperty(c) && socket.handshake.session.user.capabilities.indexOf(paths[p].scope.read[c])>-1) {
                  provide();
                  priv_exist=true;
                  break scope_loop;
                }
              }
              if(!priv_exist) callback(undefined);
            }else if (paths[p].scope == "user" && socket.handshake.session.user) {
              provide();
            }else if (paths[p].scope == "session") {
              if(paths[p].provider) paths[p].provider(function (value) {
                if(value) callback([{op: "replace", path: path, value: value}]);
                else callback(undefined);
              }, socket.handshake.session, params);
              else callback(undefined);
            }else callback(undefined);
            break paths_loop;
          }
        }
      });

      socket.on("disconnect", function() {
        for (var p in paths) {
          if (paths.hasOwnProperty(p)) {
            for (var s in paths[p].clients) {
              if (paths[p].clients.hasOwnProperty(s) && paths[p].clients[s].client.id==socket.id) {
                delete paths[p].clients[s];
              }
            }
          }
        }
      });

      socket.on('query', function (params, client_callback) {
        run_query(params.url, params.params, socket.handshake.session, client_callback);
      });

    });

    if(def_opt.server) def_opt.server.listen(opt.port || process.env.PORT || 80);

    return {
      bind: function (options) {
        var opt = options || {};
        var path = opt.path;
        var scope = opt.scope;
        var provider = opt.provider;
        var patch_processor = opt.patch_processor;

        var exist = false;
        for (var p in paths) {
          if (paths.hasOwnProperty(p) && paths[p].path==path) {
            paths[p].scope = ( scope.constructor===Array ? {read: scope, write: scope} : scope );
            paths[p].provider = provider;
            paths[p].patch_processor = patch_processor;

            if(paths[p].scope == "public") {
              if(provider) provider(function (value) {
                var patches;
                if(value) patches = [{op: "replace", path: path, value: value}];
                else patches = [{op: "remove", path: path}];

                for (var c in paths[p].clients) {
                  if (paths[p].clients.hasOwnProperty(c)) {
                    paths[p].clients[c].client.emit("patch", patches);
                  }
                }

              });
            }else if (typeof paths[p].scope == "object") {

              if(provider) provider(function (value) {
                var patches;
                if(value) patches = [{op: "replace", path: path, value: value}];
                else patches = [{op: "remove", path: path}];

                for (var c in paths[p].clients) {
                  if (paths[p].clients.hasOwnProperty(c) && paths[p].clients[c].client.handshake.session.user && paths[p].clients[c].client.handshake.session.user.capabilities) {
                    scope_loop: for (var s in paths[p].scope.read) {
                      if (paths[p].scope.read.hasOwnProperty(s) && paths[p].clients[c].client.handshake.session.user.capabilities.indexOf(paths[p].scope.read[s])>-1) {
                        paths[p].clients[c].client.emit("patch", patches);
                        break scope_loop;
                      }
                    }
                  }
                }
                
              });

            }else if (paths[p].scope == "user") {
              if(provider) for (var c in paths[p].clients) {
                if (paths[p].clients.hasOwnProperty(c) && paths[p].clients[c].client.handshake.session.user) {
                  provider(function (value) {
                    if(value) paths[p].clients[c].client.emit("patch", [{op: "replace", path: path, value: value}]);
                    else paths[p].clients[c].client.emit("patch", [{op: "remove", path: path}]);
                  }, paths[p].clients[c].client.handshake.session);
                }
              }

            }else if (paths[p].scope == "session") {
              if(provider) for (var c in paths[p].clients) {
                if (paths[p].clients.hasOwnProperty(c) && paths[p].clients[c].client.handshake.session.user) {
                  provider(function (value) {
                    if(value) paths[p].clients[c].client.emit("patch", [{op: "replace", path: path, value: value}]);
                    else paths[p].clients[c].client.emit("patch", [{op: "remove", path: path}]);
                  }, paths[p].clients[c].client.handshake.session);
                }
              }
            }
            exist = true;
          }
        }
        if(!exist) paths.push({
          path: path,
          scope: scope,
          provider: provider,
          patch_processor: patch_processor,
          clients: []
        });
      },
      patch: function (options) {
        var opt = options || {};
        var patch = opt.patch;
        var user = opt.user;

        apply_patch(patch, user, undefined);
      },
      watch: function (options) {
        var opt = options || {};
        var paths = opt.paths;
        var bind = opt.bind;
        var callback = opt.callback;

        watchers.push({paths: paths, bind: bind, callback:callback});
      },
      authenticate: function (options) {
        var opt = options || {};
        var login = opt.login;
        var logout = opt.logout;

        callbacks.login = login;
        callbacks.logout = logout;
      },
      query: function (options) {
        var opt = options || {};
        var url = opt.url;
        var callback = opt.callback;

        var exist = false;
        for (var c in callbacks.query) {
          if (callbacks.query.hasOwnProperty(c) && callbacks.query[c].url==url) {
            callbacks.query[c].callback = callback;
            exist = true;
          }
        }
        if(!exist) callbacks.query.push({url: url, callback: callback});
      },
      redirect: function (options) {
        var opt = options || {};
        var url = opt.url;
        var params = opt.params;
        var session = opt.session;
        var callback = opt.callback;

        run_query(url, params, session, callback);
      },
      middleware: function (options) {
        var opt = options || {};
        var url = opt.url;
        var callback = opt.callback;

        callbacks.middleware.push({
          url: url,
          callback: callback
        });
      }
    };

    function apply_patch(patch, user, socket) {
      for (var p in patch) if (patch.hasOwnProperty(p)) {
        for (var path in paths) {
          if (paths.hasOwnProperty(path) && ((patch[p].path && patch[p].path.indexOf(paths[path].path)===0) || (patch[p].op=="move" && patch[p].from.indexOf(paths[path].path)===0))) {
            if(socket){
              if(patch[p].scope=="public" && !paths[path].patch_processor) return;
              else if(typeof paths[p].scope == "object"){
                if(!socket.handshake.session.user || !socket.handshake.session.user.capabilities) return;
                var exists = false;
                scope_loop: for (var s in paths[p].scope.write) {
                  if (paths[p].scope.write.hasOwnProperty(s) && socket.handshake.session.user.capabilities.indexOf(paths[p].scope.write[s])>-1) {
                    exists = true;
                    break scope_loop;
                  }
                }
                if (!exists) return;
              }else if (paths[p].scope == "user" && !socket.handshake.session.user) return;
            }
            for (var w in watchers) {
              if (watchers.hasOwnProperty(w) && watchers[w].callback) {
                if(watchers[w].paths){
                  watcher_paths_loop: for (var wp in watchers[w].paths) {
                    if (watchers[w].paths.hasOwnProperty(wp) && paths[path].path.indexOf(watchers[w].paths[wp])==0) {
                      if(watchers[w].bind){
                        watcher_bind_loop: for (var b in watchers[w].bind) {
                          if (watchers[w].bind.hasOwnProperty(b)) {
                            for (var wpath in paths) {
                              if (paths.hasOwnProperty(wpath) && paths[wpath].path.indexOf(watchers[w].bind[b])==0 && paths[wpath].clients.length) {
                                watchers[w].callback([patch[p]]);
                                break watcher_bind_loop;
                              }
                            }
                          }
                        }
                      }else{
                        watchers[w].callback([patch[p]]);
                      }
                      break watcher_paths_loop;
                    }
                  }
                }else{
                  watchers[w].callback([patch[p]]);
                }
              }
            }
            
            if(paths[path].patch_processor) {
              paths[path].patch_processor([patch[p]]);
            }
            if (paths[p].scope != "session") for (var c in paths[path].clients) {
              if (paths[path].clients.hasOwnProperty(c) && (!socket || paths[path].clients[c].client.id != socket.id) && ((paths[path].scope != "user") || (paths[path].scope == "user" && paths[path].clients[c].client.handshake.session.user.id==user.id))) {
                paths[path].clients[c].client.emit("patch", [patch[p]]);
              }
            }
          }
        }
      }
    }

    function run_query(url, params, session, callback) {
      run_middlewares(url, params, session, function (url, params, session, callback) {
        for (var c in callbacks.query) {
          if (callbacks.query.hasOwnProperty(c) && callbacks.query[c].url==url) {
            callbacks.query[c].callback(params, session, callback);
          }
        }
      }, callback);
    }

    function run_middlewares(url, params, session, next, client_callback) {
      var i = -1;
      var run_middleware = function () {
        i++;
        if (callbacks.middleware[i]) {
          if (!callbacks.middleware[i].url || url.indexOf(callbacks.middleware[i].url)===0) callbacks.middleware[i].callback(url, params, session, run_middleware, client_callback);
          else run_middleware();
        } else next(url, params, session, client_callback);
      };
      run_middleware();
    }

  }
};
