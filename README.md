# iosync
Is a pure javascript Nodejs module that synchronizes data in real-time between server and different connected clients, it includes “data binding”, “scopes”, “session and login”, “query”, “redirect”, “middlewares”, etc...
Simply it's all you need to make a real-time management application
## Principle :

It's based on client-server architecture so client binds to specific variables names and when that variable was changed then the server the “patch_processor” function to store it and diffuse that change to other binded clients based on it's scope and connected user

![principle-image](http://mahdcompany.github.io/iosync/img/drawing-3.svg)

Here is an example of scope principle and how variables works virtually, it supposes that there is a json object contains all data on server and every client has a real-time synchronized copy of the server json object.

![principle-example-image](http://mahdcompany.github.io/iosync/img/drawing-2.svg)

## Getting started :

### Installation :

<div style="background: #000000; overflow:auto;width:auto;border:solid gray;border-width:.1em .1em .1em .8em;padding:.2em .6em;">

<pre style="margin: 0; line-height: 125%; color:#fff;">npm install iosync --save</pre>

</div>

### Usage :

First, in your app.js file import iosync module

<div style="background: #000000; overflow:auto;width:auto;border:solid gray;border-width:.1em .1em .1em .8em;padding:.2em .6em;">

<pre style="margin: 0; line-height: 125%;background:#000;border-radius: none;border: none;"><span style="color: #00cd00">var</span> <span style="color: #cccccc">iosync</span> <span style="color: #3399cc">=</span> <span style="color: #cccccc">require(</span><span style="color: #cd0000">'iosync'</span><span style="color: #cccccc">).iosync;</span></pre>

</div>

There is two ways to start it :

Start it directly :

<div style="background: #000000; overflow:auto;width:auto;border:solid gray;border-width:.1em .1em .1em .8em;padding:.2em .6em;">

<pre style="margin: 0; line-height: 125%;background:#000;border-radius: none;border: none;"><span style="color: #00cd00">var</span> <span style="color: #cccccc">app</span> <span style="color: #3399cc">=</span> <span style="color: #cccccc">iosync();</span></pre>

</div>

Or

Make it works with express and mongodb ( it helps you store connected clients in the database so server can restart while clients stays connected and it's not recommended to store sessions in the RAM ) :

<div style="background: #000000; overflow:auto;width:auto;border:solid gray;border-width:.1em .1em .1em .8em;padding:.2em .6em;">

<pre style="margin: 0; line-height: 125%;background:#000;border-radius: none;border: none;"><span style="color: #555555">// importing modules</span>
<span style="color: #00cd00">var</span> <span style="color: #cccccc">express</span> <span style="color: #3399cc">=</span> <span style="color: #cccccc">require(</span><span style="color: #cd0000">'express'</span><span style="color: #cccccc">)();</span>
<span style="color: #00cd00">var</span> <span style="color: #cccccc">server</span> <span style="color: #3399cc">=</span> <span style="color: #cccccc">require(</span><span style="color: #cd0000">'http'</span><span style="color: #cccccc">)(express);</span>
<span style="color: #00cd00">var</span> <span style="color: #cccccc">bodyParser</span> <span style="color: #3399cc">=</span> <span style="color: #cccccc">require(</span><span style="color: #cd0000">'body-parser'</span><span style="color: #cccccc">);</span>
<span style="color: #00cd00">var</span> <span style="color: #cccccc">cookieParser</span> <span style="color: #3399cc">=</span> <span style="color: #cccccc">require(</span><span style="color: #cd0000">'cookie-parser'</span><span style="color: #cccccc">);</span>
<span style="color: #00cd00">var</span> <span style="color: #cccccc">session</span> <span style="color: #3399cc">=</span> <span style="color: #cccccc">require(</span><span style="color: #cd0000">'express-session'</span><span style="color: #cccccc">);</span>
<span style="color: #00cd00">var</span> <span style="color: #cccccc">MongoClient</span> <span style="color: #3399cc">=</span> <span style="color: #cccccc">require(</span><span style="color: #cd0000">'mongodb'</span><span style="color: #cccccc">).MongoClient;</span>

<span style="color: #555555">// make express able to read and parse requests headers ( this is useful to access cookies in order to identify sessions )</span>
<span style="color: #cccccc">express.use(bodyParser.json());</span>
<span style="color: #cccccc">express.use(bodyParser.urlencoded({</span> <span style="color: #cccccc">extended</span><span style="color: #3399cc">:</span> <span style="color: #cdcd00">true</span> <span style="color: #cccccc">}));</span>
<span style="color: #cccccc">express.use(cookieParser());</span>

<span style="color: #555555">// first we need to make sure the app is connected to database</span>
<span style="color: #cccccc">MongoClient.connect(</span><span style="color: #cd0000">'mongodb://localhost:27017/my_db'</span><span style="color: #cccccc">,</span> <span style="color: #00cd00">function</span> <span style="color: #cccccc">(err,</span> <span style="color: #cccccc">mongodb)</span> <span style="color: #cccccc">{</span>
	<span style="color: #cdcd00">if</span><span style="color: #cccccc">(</span><span style="color: #3399cc">!</span><span style="color: #cccccc">err)</span> <span style="color: #cccccc">start_iosync(mongodb);</span>
	<span style="color: #cdcd00">else</span> <span style="color: #cccccc">console.log(err);</span>
<span style="color: #cccccc">});</span>

<span style="color: #00cd00">function</span> <span style="color: #cccccc">start_iosync</span> <span style="color: #cccccc">(mongodb){</span>

	<span style="color: #00cd00">var</span> <span style="color: #cccccc">mongoStore</span> <span style="color: #3399cc">=</span> <span style="color: #cccccc">require(</span><span style="color: #cd0000">'connect-mongo'</span><span style="color: #cccccc">)(session);</span>

	<span style="color: #555555">// configuring express session - https://www.npmjs.com/package/express-sessions</span>
	<span style="color: #cccccc">session</span> <span style="color: #3399cc">=</span> <span style="color: #cccccc">session({</span>
		<span style="color: #cccccc">resave</span><span style="color: #3399cc">:</span> <span style="color: #cdcd00">true</span><span style="color: #cccccc">,</span>
		<span style="color: #cccccc">saveUninitialized</span><span style="color: #3399cc">:</span> <span style="color: #cdcd00">true</span><span style="color: #cccccc">,</span>
		<span style="color: #cccccc">store</span><span style="color: #3399cc">:</span> <span style="color: #cdcd00">new</span> <span style="color: #cccccc">module.mongoStore({</span> <span style="color: #cccccc">db</span><span style="color: #3399cc">:</span> <span style="color: #cccccc">mongodb</span> <span style="color: #cccccc">}),</span>
		<span style="color: #cccccc">secret</span><span style="color: #3399cc">:</span> <span style="color: #cd0000">"choose a secret word"</span>
	<span style="color: #cccccc">});</span>

	<span style="color: #cccccc">express.use(session);</span>

	<span style="color: #555555">// start iosync</span>
	<span style="color: #00cd00">var</span> <span style="color: #cccccc">app</span> <span style="color: #3399cc">=</span> <span style="color: #cccccc">iosync</span> <span style="color: #cccccc">({</span>
		<span style="color: #cccccc">server</span> <span style="color: #3399cc">:</span> <span style="color: #cccccc">server,</span> <span style="color: #555555">// iosync will automatically start server</span>
		<span style="color: #cccccc">port</span> <span style="color: #3399cc">:</span> <span style="color: #cd00cd">3000</span><span style="color: #cccccc">,</span>
		<span style="color: #cccccc">session</span> <span style="color: #3399cc">:</span> <span style="color: #cccccc">session</span>
	<span style="color: #cccccc">});</span>
<span style="color: #cccccc">}</span>

<span style="color: #cccccc">express.get(</span><span style="color: #cd0000">"/iosync/client.js"</span><span style="color: #cccccc">,</span> <span style="color: #00cd00">function</span> <span style="color: #cccccc">(req,</span> <span style="color: #cccccc">res)</span> <span style="color: #cccccc">{</span>
	<span style="color: #cccccc">res.sendFile(require.resolve(__dirname</span> <span style="color: #3399cc">+</span> <span style="color: #cd0000">"/iosync/client.js"</span><span style="color: #cccccc">));</span>
<span style="color: #cccccc">});</span>
<span style="color: #cccccc">express.get(</span><span style="color: #cd0000">"/json-patch/json-patch-duplex.js"</span><span style="color: #cccccc">,</span> <span style="color: #00cd00">function</span> <span style="color: #cccccc">(req,</span> <span style="color: #cccccc">res)</span> <span style="color: #cccccc">{</span>
	<span style="color: #cccccc">res.sendFile(require.resolve(__dirname</span> <span style="color: #3399cc">+</span> <span style="color: #cd0000">"/node_modules/iosync/node_modules/fast-json-patch/dist/json-patch-duplex.min.js"</span><span style="color: #cccccc">));</span>
<span style="color: #cccccc">});</span>
<span style="color: #cccccc">express.use(</span><span style="color: #cd0000">"/"</span><span style="color: #cccccc">,</span> <span style="color: #cccccc">express.</span><span style="color: #cdcd00">static</span><span style="color: #cccccc">(require.resolve(__dirname</span> <span style="color: #3399cc">+</span> <span style="color: #cd0000">"/public"</span><span style="color: #cccccc">)));</span>
</pre>

</div>

#### Trying to bind “/test” :

Server-side :

<div style="background: #000000; overflow:auto;width:auto;border:solid gray;border-width:.1em .1em .1em .8em;padding:.2em .6em;">

<pre style="margin: 0; line-height: 125%;background:#000;border-radius: none;border: none;"><span style="color: #555555">// we suppose this var is the database</span>
<span style="color: #00cd00">var</span> <span style="color: #cccccc">test</span> <span style="color: #3399cc">=</span> <span style="color: #cd0000">"default value"</span><span style="color: #cccccc">;</span>

<span style="color: #cccccc">mod.server.iosync.bind({</span>
	<span style="color: #cccccc">path</span><span style="color: #3399cc">:</span> <span style="color: #cd0000">"/test"</span><span style="color: #cccccc">,</span>
	<span style="color: #cccccc">scope</span><span style="color: #3399cc">:</span> <span style="color: #cd0000">"public"</span><span style="color: #cccccc">,</span>
	<span style="color: #cccccc">provider</span><span style="color: #3399cc">:</span> <span style="color: #00cd00">function</span> <span style="color: #cccccc">(callback)</span> <span style="color: #cccccc">{</span>
		<span style="color: #cccccc">callback(test);</span>
	<span style="color: #cccccc">},</span>
	<span style="color: #cccccc">patch_processor</span><span style="color: #3399cc">:</span> <span style="color: #00cd00">function</span> <span style="color: #cccccc">(patch)</span> <span style="color: #cccccc">{</span>
		<span style="color: #cccccc">test</span> <span style="color: #3399cc">=</span> <span style="color: #cccccc">patch.value;</span>
		<span style="color: #cccccc">console.log(</span><span style="color: #cd0000">"patch received"</span><span style="color: #cccccc">);</span>
		<span style="color: #cccccc">console.log(patch);</span>
	<span style="color: #cccccc">}</span>
<span style="color: #cccccc">});</span>
</pre>

</div>

Client-side :

HTML ( /public/index.html ) :

<div style="background: #000000; overflow:auto;width:auto;border:solid gray;border-width:.1em .1em .1em .8em;padding:.2em .6em;">

<pre style="margin: 0; line-height: 125%;background:#000;border-radius: none;border: none;"><span style="color: #555555"><!doctype html></span>
<span style="color: #cccccc">&lt;html&gt;</span>
	<span style="color: #cccccc">&lt;head&gt;</span>
		<span style="color: #cccccc">&lt;title&gt;</span><span style="color: #cccccc">My iosync app</span><span style="color: #cccccc">&lt;/title&gt;</span>

		<span style="color: #555555">&lt;!-- import iosync requirements --&gt;</span>
		<span style="color: #cccccc">&lt;script src=</span><span style="color: #cd0000">"/socket.io/socket.io.js"</span><span style="color: #cccccc">&gt;&lt;/script&gt;</span>
		<span style="color: #cccccc">&lt;script src=</span><span style="color: #cd0000">"/json-patch/json-patch-duplex.js"</span><span style="color: #cccccc">&gt;&lt;/script&gt;</span>
		<span style="color: #cccccc">&lt;script src=</span><span style="color: #cd0000">"/iosync/client.js"</span><span style="color: #cccccc">&gt;&lt;/script&gt;</span>
		<span style="color: #cccccc">&lt;script src=</span><span style="color: #cd0000">"/app.js"</span><span style="color: #cccccc">&gt;&lt;/script&gt;</span>
	<span style="color: #cccccc">&lt;/head&gt;</span>
	<span style="color: #cccccc">&lt;body&gt;</span>
		<span style="color: #cccccc">&lt;input</span> <span style="color: #cccccc">id=</span><span style="color: #cd0000">"input"</span> <span style="color: #cccccc">&gt;</span>
	<span style="color: #cccccc">&lt;/body&gt;</span>
<span style="color: #cccccc">&lt;/html&gt;</span>
</pre>

</div>

JavaScript ( /public/app.js ) :

<div style="background: #000000; overflow:auto;width:auto;border:solid gray;border-width:.1em .1em .1em .8em;padding:.2em .6em;">

<pre style="margin: 0; line-height: 125%;background:#000;border-radius: none;border: none;"><span style="color: #00cd00">var</span> <span style="color: #cccccc">input</span> <span style="color: #3399cc">=</span> <span style="color: #cd00cd">document</span><span style="color: #cccccc">.getElementById(</span><span style="color: #cd0000">"input"</span><span style="color: #cccccc">);</span>

<span style="color: #cccccc">input.value</span> <span style="color: #3399cc">=</span> <span style="color: #cccccc">iosync.bind({</span>
	<span style="color: #cccccc">path</span><span style="color: #3399cc">:</span> <span style="color: #cd0000">"/test"</span><span style="color: #cccccc">,</span>
	<span style="color: #cccccc">observer</span><span style="color: #3399cc">:</span> <span style="color: #00cd00">function</span> <span style="color: #cccccc">(value,</span> <span style="color: #cccccc">patches)</span> <span style="color: #cccccc">{</span>

		<span style="color: #555555">// update input's value</span>
		<span style="color: #cccccc">input.value</span> <span style="color: #3399cc">=</span> <span style="color: #cccccc">value;</span>

		<span style="color: #555555">// make sure it's visually updated</span>
		<span style="color: #cccccc">input.change();</span>
	<span style="color: #cccccc">}</span>
<span style="color: #cccccc">});</span>

<span style="color: #cccccc">$(</span><span style="color: #cd0000">"#input"</span><span style="color: #cccccc">).keyup(</span><span style="color: #00cd00">function</span><span style="color: #cccccc">()</span> <span style="color: #cccccc">{</span>
	<span style="color: #cccccc">iosync.patch([{</span>
		<span style="color: #cccccc">op</span><span style="color: #3399cc">:</span> <span style="color: #cd0000">"update"</span><span style="color: #cccccc">,</span>
		<span style="color: #cccccc">path</span><span style="color: #3399cc">:</span> <span style="color: #cd0000">"/test"</span><span style="color: #cccccc">,</span>
		<span style="color: #cccccc">value</span><span style="color: #3399cc">:</span> <span style="color: #cccccc">input.value</span>
	<span style="color: #cccccc">}]);</span>
<span style="color: #cccccc">});</span>
</pre>

</div>

That's it !, now start the server

<div style="background: #000000; overflow:auto;width:auto;border:solid gray;border-width:.1em .1em .1em .8em;padding:.2em .6em;">

<pre style="margin: 0; line-height: 125%; color:#fff;">node app.js</pre>

</div>

And navigate to [http://localhost:3000](http://localhost:3000/) in two different browsers and write in the input it will automatically update the other browser input value  

# API :

## Server side :

### bind ( { path, scope, provider, patch_processor } )

**Description :  
**binds to a specific “path” and define it's “scope” and controllers

**Attributes :**

<table width="100%" cellpadding="4" cellspacing="0"><colgroup><col width="50*"> <col width="43*"> <col width="31*"> <col width="132*"></colgroup>

<tbody>

<tr valign="top">

<td width="20%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**Option**

</td>

<td width="17%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**type**

</td>

<td width="12%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**required**

</td>

<td width="51%" style="border: 1px solid #000000; padding: 0.04in">

**description**

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

path

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

string

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

yes

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

The path to bind

Example:

“/articles/541”

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

scope

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

string or array or object

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

yes

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

Defines who can see the data for this path and who can edit them

It can be in 4 different cases:

1: “public” : anyone can view and edit even not connected users

2: “user” : a user specific, so each user has it's own data shared between clients connected as this user

3: array or object : only users having one of listed capabilities can access

3.1 : [ ] : an array of capabilities names this will apply for both read and write access

3.2 : { read : [ ], write : [ ] } : dividing who can read from who can write

4 : “session” : client specific scope

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

provider

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

function

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

no

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

provider( callback( data ) , session, params )

When a client needs to read this path's data, this function will be called provided with the client's session and params expecting to callback with data

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

patch_processor

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

function

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

no

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

patch_processor( patch )

When client updated the data this function will be called with the patch from client (patch follows [rfc6902](http://tools.ietf.org/html/rfc6902))

</td>

</tr>

</tbody>

</table>

### patch ( { patch, user } )

**Description :  
**Launch patch_processors and watchers binded to “patch” paths and send patch to binded clients as specified “client”

**Attributes :**

<table width="100%" cellpadding="4" cellspacing="0"><colgroup><col width="50*"> <col width="43*"> <col width="31*"> <col width="132*"></colgroup>

<tbody>

<tr valign="top">

<td width="20%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**Option**

</td>

<td width="17%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**type**

</td>

<td width="12%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**required**

</td>

<td width="51%" style="border: 1px solid #000000; padding: 0.04in">

**description**

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

patch

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

[rfc6902](http://tools.ietf.org/html/rfc6902)

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

yes

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

The patch to apply

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

user

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

object

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

no

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

Apply that patch as a specific user

It must be an object containing the user's id :  
{  
id : “ user's id ”  
}

</td>

</tr>

</tbody>

</table>

### watch ( { paths, bind, callback } )

**Description :  
**Watch for patches that applies on specified “paths” and call “callback” function when there is clients binded to one of “bind”

**Attributes :**

<table width="100%" cellpadding="4" cellspacing="0"><colgroup><col width="50*"> <col width="43*"> <col width="31*"> <col width="132*"></colgroup>

<tbody>

<tr valign="top">

<td width="20%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**Option**

</td>

<td width="17%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**type**

</td>

<td width="12%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**required**

</td>

<td width="51%" style="border: 1px solid #000000; padding: 0.04in">

**description**

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

paths

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

array

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

no

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

Array of paths to watch for changes

if it's undefined so it means watch for all paths

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

bind

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

array

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

no

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

Array of paths strings

The callback will be called only if there is at least one client binded to any of paths defined in this property.

if it's undefined so it means call callback on any patch on specified paths

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

callback

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

function

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

yes

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

callback ( patch )

The function to call when patch applied on any of specified paths and “bind” condition is satisfied

patch : an [rfc6902](http://tools.ietf.org/html/rfc6902) contains applied patch

</td>

</tr>

</tbody>

</table>

### authenticate ( { login, logout } )

**Description :  
**Configure the user login system

**Attributes :**

<table width="100%" cellpadding="4" cellspacing="0"><colgroup><col width="50*"> <col width="43*"> <col width="31*"> <col width="132*"></colgroup>

<tbody>

<tr valign="top">

<td width="20%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**Option**

</td>

<td width="17%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**type**

</td>

<td width="12%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**required**

</td>

<td width="51%" style="border: 1px solid #000000; padding: 0.04in">

**description**

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

login

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

function

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

no

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

login ( login_data, session, callback ( response ) )

When client tries to login this function will be called to check login_data ( username and password … ) expecting to call callback with a response  
If this parameter is undefined, iosync will respond to client { error : "login_system_is_not_configured" }

The response parameter must be in two cases :

1/ Error case :  
{  
error : “error description”  
}  
the entire “response” object will be sent to the client

2/ Success case :  
{  
id : “the connected user id”,  
capabilities : [], // a strings array containing the user's capabilities  
client_params : {} // additional params to send to the client  
}  
only “client_params” will be sent to the client

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

logout

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

function

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

no

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

logout ( session, callback ( response ) )

When client tries to logout this function will be called expecting to call callback with a response  
If this parameter is undefined, iosync will respond to client { error : "logout_system_is_not_configured" }

The response parameter must be in two cases :

1/ Error case :  
{  
error : “error description”  
}  
the entire “response” object will be sent to the client

2/ Success case :  
{  
client_params : {} // additional params to send to the client  
}  
only “client_params” will be sent to the client

</td>

</tr>

</tbody>

</table>

### query ( { url, callback } )

**Description :  
**Wait for client query at specified “url” and call the “callback” function

**Attributes :**

<table width="100%" cellpadding="4" cellspacing="0"><colgroup><col width="50*"> <col width="43*"> <col width="31*"> <col width="132*"></colgroup>

<tbody>

<tr valign="top">

<td width="20%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**Option**

</td>

<td width="17%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**type**

</td>

<td width="12%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**required**

</td>

<td width="51%" style="border: 1px solid #000000; padding: 0.04in">

**description**

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

url

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

string

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

yes

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

the url to listen for

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

callback

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

function

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

yes

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

callback ( params, session, callback ( response ) )

When client send a query this function will be called with “params” ( sent from client ), current client's session and a “callback” function to respond to client

response will be entirely sent to client as it.

</td>

</tr>

</tbody>

</table>

### redirect ( { url, params, session, callback } )

**Description :  
**Server side query redirection

**Attributes :**

<table width="100%" cellpadding="4" cellspacing="0"><colgroup><col width="50*"> <col width="43*"> <col width="31*"> <col width="132*"></colgroup>

<tbody>

<tr valign="top">

<td width="20%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**Option**

</td>

<td width="17%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**type**

</td>

<td width="12%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**required**

</td>

<td width="51%" style="border: 1px solid #000000; padding: 0.04in">

**description**

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

url

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

string

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

yes

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

the url to redirect

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

params

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

object

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

no

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

query parameters

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

session

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

object

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

no

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

client's current session

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

callback

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

function

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

yes

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

callback ( params, session, callback ( response ) )

When client send a query this function will be called with “params” ( sent from client ), current client's session and a “callback” function to respond to client

response will be entirely sent to client as it.

</td>

</tr>

</tbody>

</table>

### middleware ( { url, callback } )

**Description :  
**Listen for queries of specified “url” and enforce call “callback” before the query processor and give “callback” function the ability to complete the query or redirect or directly respond the client and finish the query processing

**Attributes :**

<table width="100%" cellpadding="4" cellspacing="0"><colgroup><col width="50*"> <col width="43*"> <col width="31*"> <col width="132*"></colgroup>

<tbody>

<tr valign="top">

<td width="20%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**Option**

</td>

<td width="17%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**type**

</td>

<td width="12%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**required**

</td>

<td width="51%" style="border: 1px solid #000000; padding: 0.04in">

**description**

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

url

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

string

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

no

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

the url to listen for

set this option to undefined to listen on all queries

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

callback

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

function

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

yes

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

callback ( url, params, session, next ( ), end ( response ) )

url : requested url from the client,  
params : params provided by the client  
session : current client's session  
next : call this function to continue processing this query  
end : call this function to block query processing and respond to client directly

response will be entirely sent to client as it.

</td>

</tr>

</tbody>

</table>

## Client side :

### bind ( { path, params, observer } )

**Description :  
**Binds to specific path with params and wait for patches to call the observer

**Attributes :**

<table width="100%" cellpadding="4" cellspacing="0"><colgroup><col width="50*"> <col width="43*"> <col width="31*"> <col width="132*"></colgroup>

<tbody>

<tr valign="top">

<td width="20%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**Option**

</td>

<td width="17%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**type**

</td>

<td width="12%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**required**

</td>

<td width="51%" style="border: 1px solid #000000; padding: 0.04in">

**description**

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

path

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

string

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

yes

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

The path to bind and receive it's updates

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

params

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

object

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

no

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

parameters to pass to server-side iosync bind provider

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

observer

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

function

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

no

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

observer ( value, patch )

This observer will be called on each change applied on the specified path provided by the updated data and applied patch  
“patch” follows [rfc6902](http://tools.ietf.org/html/rfc6902) but in addition each patch object contains source attribute defines from where this patch come from “client” or “server”  
“client” means it's from this local client  
“server” means it's from server its self or another client

</td>

</tr>

</tbody>

</table>

**Returns :**

The binded object, this is for reference binding, it means when you update the content of returned value (from bind function) iosync will detect the update, call local observers as client source and send it to server in order to save it in database and broadcast to other binded clients.

### unbind ( { path } )

**Description :  
**<span style="font-weight: normal">Unbind from specific path and delete local data related to the path</span>

**Attributes :**

<table width="100%" cellpadding="4" cellspacing="0"><colgroup><col width="50*"> <col width="43*"> <col width="31*"> <col width="132*"></colgroup>

<tbody>

<tr valign="top">

<td width="20%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**Option**

</td>

<td width="17%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**type**

</td>

<td width="12%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**required**

</td>

<td width="51%" style="border: 1px solid #000000; padding: 0.04in">

**description**

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

path

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

string

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

yes

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

The path to unbind from

</td>

</tr>

</tbody>

</table>

### patch ( { patch } )

**Description :  
**<span style="font-weight: normal">Apply patch and call local observers if exists and send it to server in order to save it in database and broadcast to other binded clients.</span>

**Attributes :**

<table width="100%" cellpadding="4" cellspacing="0"><colgroup><col width="50*"> <col width="43*"> <col width="31*"> <col width="132*"></colgroup>

<tbody>

<tr valign="top">

<td width="20%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**Option**

</td>

<td width="17%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**type**

</td>

<td width="12%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**required**

</td>

<td width="51%" style="border: 1px solid #000000; padding: 0.04in">

**description**

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

patch

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

[rfc6902](http://tools.ietf.org/html/rfc6902)

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

yes

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

The patch to apply

</td>

</tr>

</tbody>

</table>

### apply_params ( { path, params } )

**Description :  
**<span style="font-weight: normal">Update current client's params for the specified path</span>

**Attributes :**

<table width="100%" cellpadding="4" cellspacing="0"><colgroup><col width="50*"> <col width="43*"> <col width="31*"> <col width="132*"></colgroup>

<tbody>

<tr valign="top">

<td width="20%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**Option**

</td>

<td width="17%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**type**

</td>

<td width="12%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**required**

</td>

<td width="51%" style="border: 1px solid #000000; padding: 0.04in">

**description**

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

path

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

string

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

yes

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

Path to apply params

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

params

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

object

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

no

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

The params to apply

</td>

</tr>

</tbody>

</table>

### login ( { params, callback } )

**Description :  
**<span style="font-weight: normal">Send to server a login request</span>

**Attributes :**

<table width="100%" cellpadding="4" cellspacing="0"><colgroup><col width="50*"> <col width="43*"> <col width="31*"> <col width="132*"></colgroup>

<tbody>

<tr valign="top">

<td width="20%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**Option**

</td>

<td width="17%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**type**

</td>

<td width="12%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**required**

</td>

<td width="51%" style="border: 1px solid #000000; padding: 0.04in">

**description**

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

params

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

object

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

yes

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

Contains the login informations

Example :  
{  
username : “Client's username”,  
password : “client's password”,  
captcha : “reCAPTCHA sitekey”  
}

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

callback

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

function

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

yes

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

callback ( response )

Will be called when server respond to the login query with response

</td>

</tr>

</tbody>

</table>

### logout ( { callback } )

**Description :  
**<span style="font-weight: normal">Send to server a logout request</span>

**Attributes :**

<table width="100%" cellpadding="4" cellspacing="0"><colgroup><col width="50*"> <col width="43*"> <col width="31*"> <col width="132*"></colgroup>

<tbody>

<tr valign="top">

<td width="20%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**Option**

</td>

<td width="17%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**type**

</td>

<td width="12%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**required**

</td>

<td width="51%" style="border: 1px solid #000000; padding: 0.04in">

**description**

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

callback

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

function

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

yes

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

callback ( response )

Will be called when server respond to the logout query with response

</td>

</tr>

</tbody>

</table>

### check_login ( { callback } )

**Description :  
**<span style="font-weight: normal">Check if user is logged in</span>

**Attributes :**

<table width="100%" cellpadding="4" cellspacing="0"><colgroup><col width="50*"> <col width="43*"> <col width="31*"> <col width="132*"></colgroup>

<tbody>

<tr valign="top">

<td width="20%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**Option**

</td>

<td width="17%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**type**

</td>

<td width="12%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**required**

</td>

<td width="51%" style="border: 1px solid #000000; padding: 0.04in">

**description**

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

callback

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

function

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

yes

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

callback ( response )

Will be called when server respond to the check query with boolean response indicated if user is logged in

</td>

</tr>

</tbody>

</table>

### query ( { url, params, callback } )

**Description :  
**<span style="font-weight: normal">Query the server data for specified “url” with “params” and wait for response with “callback” function</span>

**Attributes :**

<table width="100%" cellpadding="4" cellspacing="0"><colgroup><col width="50*"> <col width="43*"> <col width="31*"> <col width="132*"></colgroup>

<tbody>

<tr valign="top">

<td width="20%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**Option**

</td>

<td width="17%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**type**

</td>

<td width="12%" style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0.04in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

**required**

</td>

<td width="51%" style="border: 1px solid #000000; padding: 0.04in">

**description**

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

url

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

string

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

yes

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

The url to query

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

params

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

object

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

no

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

data to attach with query

</td>

</tr>

<tr valign="top">

<td width="20%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

callback

</td>

<td width="17%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

function

</td>

<td width="12%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: none; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0in">

yes

</td>

<td width="51%" style="border-top: none; border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000; padding-top: 0in; padding-bottom: 0.04in; padding-left: 0.04in; padding-right: 0.04in">

callback ( response )

Will be called when server respond to the query with response

</td>

</tr>

</tbody>

</table>
