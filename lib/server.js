'use strict'

const tree = require('./tree.js')
const helpers = require('./helpers.js')

module.exports = {

	bind: (options) => {
		let opt = options || {}
		let path = opt.path
		let scope = opt.scope
		let provider = opt.provider

		let branch = tree.branch.create(path, provider, scope)

		if(branch.provider){
			setImmediate( branch.provider,
				(value) => {

					// run server watchers
					let full_branch = tree.branch.get_full_branch(path)
					for(let b of full_branch){
						for(let w in b.watchers){
							setImmediate( b.watchers[w],
								b.path,
								value,
								"server"
							)
						}
					}

				},
				path,
				"server",
				{}
			)
		}

		// update binded clients
		for(let c in branch.clients){

			if( helpers.check_scope( branch.scope , branch.clients[c].socket.handshake.session.user, 1 ) ) {

				if(branch.provider){
					setImmediate( branch.provider,
						(value) => {

							tree.client.verify_scope(c.socket.handshake.session.user, branch, value)

							branch.clients[c].socket.emit('patch', [{
								op: "replace",
								path: path,
								value: value
							}])

						},
						path,
						branch.clients[c].socket.handshake.session,
						branch.clients[c].params
					)
				}

			}

		}

	},

	unbind: (options) => {
		let opt = options || {}
		let path = opt.path

		let branch = tree.branch.get_branch(path)
		if( !branch ) return

		for(let c in branch.clients){
			branch.clients[c].socket.emit('patch', [{
				op: "remove",
				path: path
			}])
		}

		tree.branch.delete(path)
	},

	patch: (options) => {
		let opt = options || {}
		let patch = opt.patch
		let user = opt.user

		for(let p of patch){

			// run server watchers
			let full_branch = tree.branch.get_full_branch(p.path)
			if( !full_branch.length ) continue

			for(let b of full_branch){
				for(let w in b.watchers){
					setImmediate( b.watchers[w],
						b.path,
						p.value,
						socket.handshake.session
					)
				}
			}

			// update binded clients
			let branch = tree.branch.get_branch(p.path)
			if( !branch ) continue

			for(let c in branch.clients){
				if( helpers.check_scope( branch.scope , branch.clients[c].socket.handshake.session.user, 1 ) ) {
					if( p.value ) tree.client.verify_scope(branch.clients[c].socket.handshake.session.user, branch, p.value)
					branch.clients[c].socket.emit('patch', [p])
				}
			}

		}
		
	},

	watch: (options) => {
		let opt = options || {}
		let path = opt.path
		let callback = opt.callback

		return tree.branch.watch(path, callback)
	},

	stop_watcher: (options) => {
		let opt = options || {}
		let id = opt.id

		tree.branch.stop_watcher(id)
	},

	authenticate: (options) => {
		let opt = options || {}
		let login = opt.login
		let logout = opt.logout

		helpers.authentification.login_controller = login
		helpers.authentification.logout_controller = logout
	},

	set_user_capabilities: (options) => {
		let opt = options || {}
		let id = opt.id
		let capabilities = opt.capabilities

		for(let branch of tree.user.user_branches(id)){

			branch.client.socket.handshake.session.user.capabilities = capabilities

			if ( !helpers.check_scope( branch.scope, branch.client.socket.handshake.session.user, 1 )) continue

			if( branch.provider ) {

				setImmediate( branch.provider,
					(value)=> {

						if(value) tree.client.verify_scope(branch.client.socket.handshake.session.user, branch, value)

						socket.emit("patch", [{
							op: "replace",
							path: branch.path,
							value: value
						}])

					},
					branch.path,
					branch.client.socket.handshake.session,
					branch.params
				)
			}

		}

	},

	on_query: (options) => {
		let opt = options || {}
		let url = opt.url
		let callback = opt.callback

		return tree.query.listener.add(url, callback)
	},

	off_query: (options) => {
		let opt = options || {}
		let id = opt.id

		return tree.query.listener.remove(id)
	},

	redirect: (options) => {
		let opt = options || {}
		let url = opt.url
		let params = opt.params
		let session = opt.session
		let callback = opt.callback

		tree.query.listener.run(url, params, session, callback)

	},

	add_middleware: (options) => {
		let opt = options || {}
		let url = opt.url
		let callback = opt.callback

		return tree.query.middleware.add(url, callback)
		
	},

	delete_middleware: (options) => {
		let opt = options || {}
		let id = opt.id

		return tree.query.middleware.remove(id)
		
	}

}