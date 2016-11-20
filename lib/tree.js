'use strict'

const helpers = require('./helpers.js')

/**
 * Branch template generator
 * @return {Object}  an empty branch, useful for creating tree branches
 */
function make_branch() {
	return JSON.parse(JSON.stringify({
		provider: null, // branch's content data provider
		scope: null, // access rights definition on this branch
		watchers: {}, // server-side watchers
		clients: {}, // binded sockets
		branches: {} // sub branches
	}))
}

/**
 * create the root branch
 * @type {Object}
 */
var tree = make_branch()

var query_listeners = {}
var middlewares = {}

/**
 * Simplify the path
 * @param  {String}  path  an rfc6902 path
 * @return {Array}         exploded branch names array
 */
function explode(path) {
	return path
		.split("/") // separate items
		.filter( e => !!e ) // exclude empty elements
}

function generateUUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
	.replace(
		/[xy]/g,
		(c) => {
			let r = Math.random()*16|0,
			    v=c=='x'?r:r&0x3|0x8
			return v.toString(16)
		}
	)
}

module.exports = {
	
	/**
	 * Manage tree branches
	 * @type {Object}
	 */
	branch: {

		/**
		 * create whole new branch
		 * @param  {String}     path      the branch's path to create
		 * @param  {Function}   provider  branch's content data provider
		 * @param  {Mixed}      scope     defines access rights on this branch
		 * @return {undefined}
		 */
		create: (path, provider, scope) => {

			let current_branch = tree

			let exploded_path = explode(path)

			for( let i = 0; i < exploded_path.length; i++ ){

				let branch_name = exploded_path[i]

				// create a branch if not exists
				if( !current_branch.branches[branch_name] )
					current_branch.branches[branch_name] = make_branch()
				
				// seek to next sub branch
				current_branch = current_branch.branches[branch_name]

			}

			current_branch.provider = provider
			current_branch.scope = scope

			return current_branch

		},

		/**
		 * we don't need this branch anymore
		 * @param  {String}     path the branch's path to delete
		 * @return {undefined}
		 */
		delete: (path) => {
			
			(function recursive_delete(tree, branch_names, index = 0) {
	
				if( !tree.branches[branch_names[index]] ) return

				if( index < ( branch_names.length - 1 ) ){
					// branch's end reached
					
					delete tree.branches[branch_names[index]]

				}else{

					recursive_delete(
						tree.branches[branch_names[index]],
						branch_names,
						index+1
					)

					if(
						tree.branches[branch_names[index]] &&
						!Object.keys(tree.branches[branch_names[index]].branches).length &&
						!tree.branches[branch_names[index]].provider &&
						!Object.keys(tree.branches[branch_names[index]].watchers).length
					)
						delete tree.branches[branch_names[index]]

				}

			})(tree, explode(path))

		},

		get_branch: (path, try_nearest = false) => {

			let current_branch = tree

			let exploded_path = explode(path)

			for( let i = 0; i < exploded_path.length; i++ ){

				let branch_name = exploded_path[i]

				// branch not exists
				if( !current_branch.branches[branch_name] )
					return (try_nearest ? current_branch : false )
				
				// seek to next sub branch
				current_branch = current_branch.branches[branch_name]

			}

			return current_branch

		},

		get_full_branch: (path) => {

			let current_branch = tree
			let current_path = "/"

			let exploded_path = explode(path)

			let rslt = []

			for( let i = 0; i < exploded_path.length; i++ ){

				let branch_name = exploded_path[i]

				rslt.push(Object.assign({
					path: current_path
				}, current_branch))

				// branch not exists
				if( !current_branch.branches[branch_name] )
					return rslt

				// seek to next sub branch
				current_branch = current_branch.branches[branch_name]

				current_path += branch_name + "/"

			}

			return rslt

		},

		/**
		 * add a new watcher at this branch so it will be called on each change
		 * @param  {String}     path      path the branch's path to watch on
		 * @param  {function}   watcher   who gonna be called
		 * @return {undefined}
		 */
		watch: (path, watcher) => {

			let current_branch = tree

			let exploded_path = explode(path)

			// look for the branch's end
			for( let i = 0; i < exploded_path.length; i++ ){

				let branch_name = exploded_path[i]

				// fix branch if sectioned
				if( !current_branch.branches[branch_name] )
					current_branch.branches[branch_name] = make_branch()

				// seek to next sub branch
				current_branch = current_branch.branches[branch_name]

			}

			// subscribe the watcher
			let id = generateUUID()
			current_branch.watchers[id] = watcher

			// this is useful to stop_watcher
			return id

		},

		/**
		 * never call a specific watcher
		 * @param  {String}     watcher_id
		 * @return {undefined}
		 */
		stop_watcher: function (watcher_id) {

			(function recursive_stop_watcher(tree, watcher_id) {

				if(tree.watchers[watcher_id]){
					delete tree.watchers[watcher_id]
					return
				}

				for(let i in tree.branches)
					recursive_stop_watcher(tree.branches[i], watcher_id)

			})(tree, watcher_id)

		}

	},

	client: {

		/**
		 * Search for branches binded by specific client
		 * @param  {Object}  client_id [description]
		 * @return {Array}              [{path, provider}]
		 */
		branches: function (client_id) {

			let rslt = [];

			(function recursive_client_branches(tree, client_id) {

				if(tree.clients[client_id])
					rslt.push( Object.assign({
						path: tree.clients[client_id].binded_path,
						params: tree.clients[client_id].params
					}, tree))

				for(let i in tree.branches)
					recursive_client_branches(tree.branches[i], client_id)

			})(tree, client_id)

			return rslt

		},

		user_branches: function (user_id) {

			let rslt = [];

			(function recursive_client_branches(tree, user_id, path = "/") {
				
				for(let c in tree.clients){
					if(
						tree.clients[c].socket.handshake.session.user &&
						tree.clients[c].socket.handshake.session.user.id == user_id
						)
						rslt.push( Object.assign({
							path: tree.clients[c].binded_path,
							params: tree.clients[user_id].params,
							client: tree.clients[c]
						}, tree))
				}

				for(let i in tree.branches)
					recursive_client_branches(tree.branches[i], user_id, (path + i + "/" ))

			})(tree, user_id)

			return rslt

		},

		verify_scope: function (user, branch, value, access = 1) {
			
			(function recursive_verify_scope(user, branch, value, access) {
				
				if( typeof value == "object" ){
					for(let e in value){
						if( value.hasOwnProperty(e) && branch.branches[e] ){
							if(!helpers.check_scope(branch.branches[e].scope, user, access))
								delete value[e]
							else
								recursive_verify_scope(user, branch.branches[e], value[e], access)
						}
					}
				}

			})(user, branch, value, access)

		},

		bind: function (client, path) {

			let current_branch = tree

			let exploded_path = explode(path)

			// look for the branch's end
			for( let i = 0; i < exploded_path.length; i++ ){

				let branch_name = exploded_path[i]

				// bind to nearest branch
				if( !current_branch.branches[branch_name] ){
					current_branch.clients[client.id] = client
					return
				}

				// seek to next sub branch
				current_branch = current_branch.branches[branch_name]

			}

			// bind the client
			current_branch.clients[client.id] = client

		},

		unbind: function (client_id, path) {

			if(path){

				let full_branch = module.exports.branch.get_full_branch(path)
				for(let i = full_branch.length-1; i>=0; i--){
					if(full_branch[i].clients[client_id]){
						// unbind the client
						delete full_branch[i].clients[client_id]
						break
					}
				}

			}else{

				(function recursive_client_unbind(tree, client_id) {
					
					if(tree.clients[client_id])
						delete tree.clients[client_id]

					for(let i in tree.branches)
						recursive_client_unbind(tree.branches[i], client_id)

				})(tree, client_id)

			}

		}

	},

	query: {

		middleware: {

			add: (url, middleware) => {

				let id = generateUUID()
				middlewares[id] = {
					url: url,
					callback: middleware
				}
				return id

			},

			remove: (middleware_id) => {
				delete middlewares[middleware_id]
			}

		},

		listener: {

			add: (url, listener) => {

				for (let q in query_listeners) {
					if (query_listeners.hasOwnProperty(q) && query_listeners[q].url==url) {
						query_listeners[q].callback = callback
						return q
					}
				}

				let id = generateUUID()
				query_listeners[id] = {
					url: url,
					callback: listener
				}
				return id

			},

			remove: (listener_id) => {
				delete query_listeners[listener_id]
			},

			run: (url, params, session, client_callback) => {
				
				// get middlewares listening on this url
				let my_middlewares = []
				for(let m in middlewares)
					if( url.indexOf(middlewares[m].url)===0 ) my_middlewares.push(middlewares[m])

				// run listening middlewares
				let i = -1
				let next_middleware = () => {
					i++
					if (my_middlewares[i])
						my_middlewares[i].callback(url, params, session, next_middleware, client_callback)
					else{ // running all middlewares done, now run query processors
						let ql
						for (let c in query_listeners){

							if (query_listeners[c].url==url){

								ql = query_listeners[c]
								break

							} else if (

								url.indexOf(query_listeners[c].url)==0 &&
								( !ql || ql.url.length < query_listeners[c].url.length )

							){
								ql = query_listeners[c]
							}

						}

						if(ql) ql.callback(params, session, client_callback)
						else client_callback("no_query_processor")
						
					}
				}
				next_middleware()

			}

		}

	}

}
