'use strict';

const socket = require('./lib/socket.js');
const server = require('./lib/server.js');

module.exports = (opt) => {
	
	let io = socket.init(opt);
	socket.listen(io);
	
	return server;

};
