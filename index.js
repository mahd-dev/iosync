'use strict'

const socket = require('./lib/socket.js')
const server = require('./lib/server.js')

module.exports = function* (opt) {
	
	let io = socket.init(opt)
	socket.listen(io)
	
	return server

}
