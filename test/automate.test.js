var Automate = require('../lib/automate'),
    expect = require("chai").expect,
    assert = require("chai").assert;

describe('automate', function() {
    var server;

    before(function() {
        server = new Automate("http://localhost:5000", "automate server");
    });

    describe("attributes", function() {
        it('should be set correctly', function() {
            assert.strictEqual(server.serverUrl, "http://localhost:5000");
            assert.strictEqual(server.name, "automate server");
            assert.strictEqual(server.thenIndex, -1);
            assert.strictEqual(server.taskTimeoutInterval, 25000);
            assert.isTrue(server.tasks.length === 0);
            assert.isUndefined(server.options);
        });
    });

    describe(".module(moduleName)", function() {
        it('should set the moduleName to correct value', function() {
            server.module("Sample Test");
            assert.strictEqual(server.moduleName, "Sample Test");
        });
    });

    describe(".fill(el, val)", function() {
        it('should add a fill object to the tasks queue', function() {
            server.fill("$(.foo #bar)", "sample fill value");
            fillObj = server.tasks.pop();
            assert.propertyVal(fillObj, "moduleName", "Sample Test");
            assert.propertyVal(fillObj, "el", "$(.foo #bar)");
            assert.propertyVal(fillObj, "val", "sample fill value");
            assert.propertyVal(fillObj, "type", "fill");
            assert.propertyVal(fillObj, "name", "$(.foo #bar)");
        });
    });

    describe(".select(el, val)", function() {
        it('should add a select object to the tasks queue', function() {
            server.select("$(.select #element)", "sample select value");
            selectObj = server.tasks.pop();
            assert.propertyVal(selectObj, "moduleName", "Sample Test");
            assert.propertyVal(selectObj, "el", "$(.select #element)");
            assert.propertyVal(selectObj, "val", "sample select value");
            assert.propertyVal(selectObj, "type", "select");
            assert.propertyVal(selectObj, "name", "$(.select #element)");
        });
    });

    describe(".tap(selector)", function() {
        it('should add a tap object to the tasks queue', function() {
            server.tap("$(.tap #element)");
            tapObj = server.tasks.pop();
            assert.propertyVal(tapObj, "moduleName", "Sample Test");
            assert.propertyVal(tapObj, "name", "$(.tap #element)");
            assert.propertyVal(tapObj, "type", "tap");
            assert.propertyVal(tapObj, "tap", "$(.tap #element)");
        });
    });

    describe(".then(task)", function() {
        it('should add a then object to the tasks queue', function() {
            server.then(function(){console.log('Hello World')});
            thenObj = server.tasks.pop();
            assert.propertyVal(thenObj, "moduleName", "Sample Test");
            assert.propertyVal(thenObj, "type", "then");
//            assert.propertyVal(thenObj, "then", function(){console.log('Hello World')});
        });
    });

    describe(".waitFor(params)", function() {
        it('should add a waitFor object to the tasks queue', function() {
            server.waitFor(500);
            waitForObj = server.tasks.pop();
            assert.propertyVal(waitForObj, "moduleName", "Sample Test");
            assert.propertyVal(waitForObj, "name", "timeout 500");
            assert.propertyVal(waitForObj, "type", "waitFor");
            assert.propertyVal(waitForObj, "waitFor", 500);
        });
    });
})
