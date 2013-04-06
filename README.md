roomba
======

**Not really ready for prime time. Works well for us**

Automated javascript testing. Esp for phonegap applications where you need to bundle integration tests with the app and test on an actual device.

Dependencies
* Only npm support at this point. So you'll need something like browserify to bundle it into the browser.
* requires jQuery

Has two components. 

* Server: a reporting server where test run information is logged
* lib/roomba.js is the runner code that needs to be bundled with the js app

Install
=======
```shell
npm install roombajs
```

Server
=====
Start the server using
```javascript
node app.js 
//or
npm start
```

Roombajs client library
=======================

Create an instance of roomba for each run. This creates a unique run id, used to submit reports to server
```javascript
var Roomba = require("roomba"),
var roomba = new Roomba(serverUrl, nameOfTest);
```
Now use the various methods to say what all you need to do
```javascript
roomba.tap("#foo div");
roomba.waitFor(300);
roomba.tap("#bar span");
```
Add your asserts at any point. You can use any assert library, here I use chai.
``` javascript
roomba.then(function() {
    expect($(".uiPageActive .subToolBar em").html()).to.contain.string("Philadelphia to SF");
});
```
Signal that you are done specifying your tests
```javascript
roomba.runAll(); //Runs each step one by one, and submits the report to server
```

API reference
=============
Constructor
-----------
```javascript
var roomba = new Roomba(roombaSeverUrl, nameOfTest);
//example
var roomba = new Roomba("http://localhost:5000", "regression suite");
```

Methods
-------
Tap
```javascript
roomba.tap(jQuerySelector);
//example
roomba.tap("#foo");
```

fill a textbox or text input 
```javascript
roomba.fill(selector, value);
//example
roomba.fill("#loginUsername", "a@b.com");
```

select a drop down
```javascript
roomba.select(selector, value);
//example
roomba.select("#environment", "production");
```

start/then: execute arbitrary piece of javascript at that time. Useful to add asserts.
start and then are equivalent, just syntax sugar to indicate start of a test.
```javascript
roomba.start(function)
roomba.then(function)
//example
roomba.start(function(){
    expect($("#foo").val()).to.be(500);
});
```

waitFor: timeout or function
```javascript
roomba.waitFor(timeMilliSeconds);
roomba.waitFor(fn)
fn: return true to indicate waitFor condition is met
//example
roomba.waitFor(300);
roomba.waitFor(function(){
	return ($("#foo").length === 1);
})
```

runAll: Signal that you are done specifying the test. 
Now run actions one by one. On each step, information will be logged in roomba server.
If there is an error in any step, it'll bail out. 
```javascript
roomba.runAll()
```

module: Indicate start of a module. Once a module is set, any actions done like a tap are logged under that module. If none specified, all tests go into 'default' module. Module names should be unique, or reports will get messed up.
```javascript
roomba.module(moduleName)
//example
roomba.module("login module")
```
