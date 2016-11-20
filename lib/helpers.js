'use strict'

let controllers = {
	login: null,
	logout: null
}

let users = {}

module.exports = {

	authentification: {

		set login_controller (login_controller) { controllers.login = login_controller },
		set logout_controller (logout_controller) { controllers.logout = logout_controller },

		password_login: (params, session, callback) => {

			if( !controllers.login ) throw 'login_controller_not_provided'

			controllers.login(params, session, (err, res)=> {
				
				if( !err ) session.user = res.user
				if( session.save ) session.save()
				callback(err, ( res ? res.client_params : {} ))

			})

		},

		logout: (session, callback) => {
			
			if( !controllers.logout ) throw 'logout_controller_not_provided'

			controllers.logout(session, (err, res)=> {
				
				if( !err ) delete session.user
				session.save()
				callback(err, ( res ? res.client_params : {} ) )

			})

		}

	},

	/**
	 * Check if user worth access to a scope
	 * @param  {mixed}    scope            current branch visibility
	 * @param  {Object}   user             user requesting access {id, capabilities}
	 * @param  {int}      required_access  0: none, 1: read, 2: write, 3: read&write
	 * @return {boolean}
	 */
	check_scope: (scope, user, required_access) => {

		if( !scope || !required_access ) return false

		if(scope=="public") return true

		if(scope=="user")
			if(user && user.id) return true
			else return false

		if(scope.constructor == Array){

			if( !user || !user.capabilities ) return false

			for(let s of scope){
				for(let c in user.capabilities){
					if(s==c){
						switch(required_access){
							case 1: // read only access required
								if([1, 3].some( (e) => e==user.capabilities[c] )) return true
								break
							case 2: // write only access required
								if([2, 3].some( (e) => e==user.capabilities[c] )) return true
								break
							case 3: // read & write access required
								if([3].some( (e) => e==user.capabilities[c] )) return true
								break
						}
						return false
					}
				}
			}
			return false
			
		}

	}

}