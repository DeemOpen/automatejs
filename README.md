roomba
======

**Not ready for public yet**

Automated javascript testing.

Currently here
* assumes commonjs module system
* requires jQuery

Has two components. 

* Server: a reporting server to which test run information is logged
* lib/roomba.js is the runner that needs to be bundled with the js app with which you can tap etc on the app.

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

Create an instance of roomba for each run. THis creates a unique run id, used to submit reports to server
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
```javascript
var roomba = new Roomba(roombaSeverUrl, nameOfTest);
//example
var roomba = new Roomba("http://localhost:5000", "regression suite");
```

Methods
=======
Tap
```javascript
roomba.tap(jQuerySelector);
//example
roomba.tap("#foo");
```

fill a textbox or text input 
```javascript
roomba.fill(element, value);
//example
roomba.fill($("#loginUsername"), "a@b.com");
```

select a drop down
```javascript
roomba.select(element, value);
//example
roomba.select($("#environment"), "production");
```

start/then: execute arbitrary piece of javascript at that time. Useful to add asserts
start and then are equivalent. Just syntax sugar if you want to tell start of a test.
```javascript
roomba.start(function)
roomba.then(function)
//example
roomba.start(function(){
    expect($("#foo").val()).to.be(500);
});
```

waitFor: wait for a timeout. Useful for waiting for a view render
```javascript
roomba.waitFor(timeMilliSeconds);
//example
roomba.waitFor(300);
```

runAll: Signal that you are done specifying the test. 
Now run actions one by one. On each step, information will be logged in roomba server.
If there is an error in any step, it'll bail out. 
```javascript
roomba.runAll()
```