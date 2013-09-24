automate
======

**Not really ready for prime time. Works well for us**

Automated javascript testing. Esp for phonegap applications where you need to bundle integration tests with the app and test on an actual device.

Dependencies
* Only npm support at this point. So you'll need something like browserify to bundle it into the browser.
* requires jQuery

Has two components. 

* Server: a reporting server where test run information is logged
* lib/automate.js is the runner code that needs to be bundled with the js app

Install
=======
```shell
npm install automatejs
```

Server
=====
Start the server using
```javascript
node app.js 
//or
npm start
```

Automatejs client library
=======================

Create an instance of automate for each run. This creates a unique run id, used to submit reports to server
```javascript
var Automate = require("automate"),
var automate = new Automate(serverUrl, nameOfTest);
```
Now use the various methods to say what all you need to do
```javascript
automate.tap("#foo div");
automate.waitFor(300);
automate.tap("#bar span");
```
Add your asserts at any point. You can use any assert library, here I use chai.
``` javascript
automate.then(function() {
    expect($(".uiPageActive .subToolBar em").html()).to.contain.string("Philadelphia to SF");
});
```
Signal that you are done specifying your tests
```javascript
automate.runAll(); //Runs each step one by one, and submits the report to server
```

API reference
=============
Constructor
-----------
```javascript
var automate = new Automate(automateSeverUrl, nameOfTest);
//example
var automate = new Automate("http://localhost:5000", "regression suite");
```

Methods
-------
Tap
```javascript
automate.tap(jQuerySelector);
//example
automate.tap("#foo");
```

fill a textbox or text input 
```javascript
automate.fill(selector, value);
//example
automate.fill("#loginUsername", "a@b.com");
```

select a drop down
```javascript
automate.select(selector, value);
//example
automate.select("#environment", "production");
```

start/then: execute arbitrary piece of javascript at that time. Useful to add asserts.
start and then are equivalent, just syntax sugar to indicate start of a test.
```javascript
automate.start(function)
automate.then(function)
//example
automate.start(function(){
    expect($("#foo").val()).to.be(500);
});
```

waitFor: timeout or function
```javascript
automate.waitFor(timeMilliSeconds);
automate.waitFor(fn)
fn: return true to indicate waitFor condition is met
//example
automate.waitFor(300);
automate.waitFor(function(){
	return ($("#foo").length === 1);
})
```

runAll: Signal that you are done specifying the test. 
Now run actions one by one. On each step, information will be logged in automate server.
If there is an error in any step, it'll bail out. 
```javascript
automate.runAll()
```

module: Indicate start of a module. Once a module is set, any actions done like a tap are logged under that module. If none specified, all tests go into 'default' module. Module names should be unique, or reports will get messed up.
```javascript
automate.module(moduleName)
//example
automate.module("login module")
```

License & Contribution
======================
Automatejs is released under the Apache 2.0 license.
Comments, bugs, pull requests, and other contributions are all welcomed!
For questions please feel free to contact pnewman@deem.com or paul.yi@deem.com
