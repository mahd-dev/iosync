# iosync
Is a pure javascript Nodejs module that synchronizes data in real-time between server and different connected clients, it includes “data binding”, “scopes”, “session and login”, “query”, “redirect”, “middlewares”, etc...

Simply it's all you need to make a real-time management application

## Principle :

It's based on client-server architecture so client binds to specific variables names and when that variable was changed then the server the “patch_processor” function to store it and diffuse that change to other binded clients based on it's scope and connected user

![principle-image](http://mahdcompany.github.io/iosync/img/drawing-3.svg)

Here is an example of scope principle and how variables works virtually, it supposes that there is a json object contains all data on server and every client has a real-time synchronized copy of the server json object.

![principle-example-image](http://mahdcompany.github.io/iosync/img/drawing-2.svg)

See [Full documentation](http://mahdcompany.github.io/iosync/) for the Getting started and API

See [Runnable](http://code.runnable.com/VpjqJuHit0AHeNJ7/iosync-for-node-js-real-time-and-socket-io) for a working demo
