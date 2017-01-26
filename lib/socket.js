'use strict'

const tree = require('./tree.js')
const helpers = require('./helpers.js')

/**
 * Prepare prerequisities for socket.io app
 * @param  {Object} opt {socket_io, server, port, session, mongodb}
 * @return {Object} the socket.io app
 */
module.exports.init = (opt) => {

	opt = opt || {}

	var io // socket.io app

	if(opt.socket_io){
		// use provided socket

		io = opt.socket_io

	}else{
		// crate own socket

		if(!opt.server) {
			// create own http server

			opt.server = require('http').createServer()
			io = require('socket.io')(opt.server)
			if(opt.adapter) io.adapter(opt.adapter)

			opt.server.listen(opt.port || process.env.PORT || 80)
		}else
			// use provided http server
			io = require('socket.io')(opt.server)
			if(opt.adapter) io.adapter(opt.adapter)
	}

	if(opt.session){
		// use provided session

		let sharedsession = require("express-socket.io-session")
		io.use(sharedsession(opt.session))

	}else{
		// create own session

		let session = require('express-session')

		let store = undefined

		if(opt.mongodb){
			// use mongodb to store sessions

			let mongoStore = require('connect-mongo')(session)
			store = new mongoStore({db: opt.mongodb})
		}

		session = session({
			resave: true,
			saveUninitialized: true,
			store: store,
			secret: "$63Dp94H@smECFVc"
		})

		let sharedsession = require("express-socket.io-session")
		io.use(sharedsession(session))

	}

	return io

}

/**
 * start listening on clients
 * @param  {Object}    io Socket.io app
 * @return {undefined}
 */
module.exports.listen = (io) => {
	
	io.on("connection", (socket) => {
		// new client

		if(!socket.handshake.session) socket.handshake.session={}
		if(socket.handshake.session.save) socket.handshake.session.save()

		/**
		 * Client requested a login
		 * @param  {Object}     login_data       {username, password}
		 * @param  {Function}   client_callback  reply to client if logged in or not with (err, onsuccess_params)
		 * @return {undefined}
		 */
		socket.on("login", (login_data, client_callback) => {

			helpers.authentification.password_login(login_data, socket.handshake.session, (err, client_params) => {
				
				if(err) {
					client_callback(err, client_params)
					return
				}

				for(let branch of tree.client.branches(socket.id)) {

					// ignore not allowed branches
					if ( !helpers.check_scope( branch.scope, socket.handshake.session.user, 1 )) continue

					if( branch.provider ) {
						setImmediate( branch.provider,
							(value)=> {

								if(value) tree.client.verify_scope(socket.handshake.session.user, branch, value)

								socket.emit("patch", [{
									op: "replace",
									path: branch.path,
									value: value
								}])

							},
							branch.path,
							Object.assign({}, socket.handshake.session, {client_id: socket.id}),
							branch.params,
							"update"
						)
					}

				}

				client_callback(err, client_params)

			})

		})

		/**
		 * Client requested a logout
		 * @param  {Undefined}  data             We don't need any parameter
		 * @param  {Function}   client_callback  
		 * @return {undefined}
		 */
		socket.on("logout", (data, client_callback) => {

			if( !socket.handshake.session.user ) {
				client_callback(null, {})
				return
			}

			helpers.authentification.logout(socket.handshake.session, (err, client_params) => {

				if(err) {
					client_callback(err, client_params)
					return
				}

				for(let branch of tree.client.branches(socket.id)) {
					if( branch.scope != "public" && branch.scope != "session" ){
						socket.emit("patch", [{
							op: "remove",
							path: branch.path
						}])
					}
				}
				client_callback(err, client_params)

			})

		})

		/**
		 * Client want to be up to date for a specific path
		 * @param  {Object}    params            {path, params}
		 * @param  {Function}  client_callback)  reply to client with a jsonpatch
		 * @return {undefined}
		 */
		socket.on('bind', (params, client_callback) => {

			let branch = tree.branch.get_branch(params.path, true)

			if( !branch ) branch = tree.branch.create(params.path)

			tree.client.bind(
				{
					id: socket.id,
					socket: socket,
					params: params.params,
					binded_path: params.path
				},
				params.path
			)

			if( branch.provider && helpers.check_scope( branch.scope, socket.handshake.session.user, 1 ) ) {

				setImmediate( branch.provider,
					(value) => {

						tree.client.verify_scope(socket.handshake.session.user, branch, value)

						client_callback([{
							op: "replace",
							path: params.path,
							value: value
						}])

					},
					params.path,
					Object.assign({}, socket.handshake.session, {client_id: socket.id}),
					params.params,
					"bind"
				)
				
			}else{
				client_callback()
			}

		})

		/**
		 * Client requested to stop notifying him updates on a specific path
		 * @param  {String}  path
		 * @return {undefined}
		 */
		socket.on('unbind', (path) => {

			tree.client.unbind(socket.id, path)

		})

		/**
		 * Client updated something
		 * @param  {Object}     patch  JsonPatch format containing updates
		 * @return {undefined}
		 */
		socket.on('patch', (patch, client_callback) => {

			for(let p of patch){

				if( !p.path ) continue

				let branch = tree.branch.get_branch(p.path, true)

				if( !branch || !helpers.check_scope(branch.scope, socket.handshake.session.user, 2) ) continue
				tree.client.verify_scope(socket.handshake.session.user, branch, p.value, 2)

				let full_branch = tree.branch.get_full_branch(p.path)
				if( !full_branch.length ) continue

				for(let b of full_branch){

					for(let w in b.watchers){
						setImmediate( b.watchers[w],
							p.path,
							p.value,
							Object.assign({}, socket.handshake.session, {client_id: socket.id})
						)
					}

					for(let c in b.clients){
						
						let value
						if(typeof p.value == "object")
							value = JSON.parse(JSON.stringify(p.value))
						else
							value = p.value

						if( b.clients[c].socket.id != socket.id && helpers.check_scope( b.scope , b.clients[c].socket.handshake.session.user, 1 ) ) {
							if( value ) tree.client.verify_scope(b.clients[c].socket.handshake.session.user, b, value)
							b.clients[c].socket.emit('patch', [Object.assign({}, p, {value: value})])
						}
					}
					
				}

			}

		})

		/**
		 * Client updated some params for a specific path
		 * @param  {Object}    params           the new params
		 * @param  {Function}  client_callback  reply to client with a jsonpatch
		 * @return {undefined}
		 */
		socket.on('apply_params', (params, client_callback) => {

			let branch = tree.branch.get_branch(params.path, true)

			tree.client.bind(
				{
					id: socket.id,
					socket: socket,
					params: params.params,
					binded_path: params.path
				},
				params.path
			)

			if ( branch.provider && helpers.check_scope( branch.scope , socket.handshake.session.user, 1 ) ) {

				setImmediate( branch.provider,
					(value) => {

						if( value ) tree.client.verify_scope(socket.handshake.session.user, branch, value)

						client_callback([{
							op: "replace",
							path: params.path,
							value: value
						}])

					},
					params.path,
					Object.assign({}, socket.handshake.session, {client_id: socket.id}),
					params.params,
					"update"
				)
			}else{
				client_callback()
			}

		})

		/**
		 * ajax's style query listener
		 * @param  {Object}     params           Free style params
		 * @param  {Function}   client_callback  Reply to the client by calling this function with the response as parameter
		 * @return {undefined}
		 */
		socket.on('query', (params, client_callback) => {

			tree.query.listener.run(params.url, params.params, socket.handshake.session, client_callback)

		})

		/**
		 * Socket closed
		 */
		socket.on("disconnect", () => {

			tree.client.unbind(socket.id)

		})
		
	})

}