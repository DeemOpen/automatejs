"use strict";
var async = require("async");
var Automate = module.exports = function(serverUrl, name, options) {
    options = options || {};
    this.tasks = []
    this.thenIndex = -1
    this.serverUrl = serverUrl
    this.name = name
    this.taskTimeoutInterval = options.taskTimeout || 25000
};

Automate.prototype.module = function(moduleName) {
    this.moduleName = moduleName;
}

Automate.prototype.fill = function(el, val) {
    this._push({
        moduleName: this.moduleName,
        el: el,
        val: val,
        type: "fill",
        name: el
    });
};

Automate.prototype.select = function(el, val) {
    this._push({
        moduleName: this.moduleName,
        el: el,
        val: val,
        type: "select",
        name: el
    });
};

Automate.prototype.tap = function(selector) {
    this._push({
        moduleName: this.moduleName,
        name: selector,
        type: "tap",
        tap: selector
    });
};

Automate.prototype.start = Automate.prototype.then = function(task) {
    this._push({
        moduleName: this.moduleName,
        name: task.name,
        type: "then",
        then: task
    });
};

Automate.prototype.waitFor = function(params) {
    this._push({
        moduleName: this.moduleName,
        name: "timeout " + params,
        type: "waitFor",
        waitFor: params
    });
};

Automate.prototype.runAll = function() {
    var i = 0,
        that = this,
        globalTaskTimeout,
        globalTaskTimeoutFired = false,
        currTaskName, currentRunId;
    getNewTestRunId(function(newRunId) {
        currentRunId = newRunId;
        that.currentRunId = newRunId;
        next();
    }, this.serverUrl, this.name);
    function next() {
        var interval, intervalCounter;
        clearTimeout(globalTaskTimeout);
        globalTaskTimeout = setTimeout(function() {
            that._save(currTaskName, false, {
                error: "Timed out"
            });
            that._end()
            console.error("Task timed out: " + currTaskName)
            globalTaskTimeoutFired = true
        }, that.taskTimeoutInterval);
        if (currTaskName) {
            that._save(currTaskName, true, {
                message: currTaskName + " completed successfully"
            });
        }
        if (globalTaskTimeoutFired || i === that.tasks.length) {
            clearTimeout(globalTaskTimeout)
            that._end();
            return; //end tasks
        }
        var task = that.tasks[i++];
        that.moduleName = task.moduleName; //set module name again during run all
        currTaskName = task.type + (task.name ? ": " + task.name : "");
        console.log("Executed task: " + currTaskName);
        try {
            switch(task.type){
                case "then":
                    that.thenIndex = i;
                    task.then();
                    that.thenIndex = -1;
                    next();
                    break;
                case "tap":
                    tap($(task.tap));
                    next();
                    break;
                case "waitFor":
                    if (typeof task.waitFor === "number") {
                        setTimeout(next, task.waitFor);
                    } else if (typeof task.waitFor === "function"){
                        intervalCounter = 1;
                        interval = setInterval(function() {
                            if(task.waitFor() || intervalCounter++ > that.taskTimeoutInterval/200){ //max wait
                                clearInterval(interval);
                                next();
                            }
                        }, 200);
                    }
                    break;
                case "fill":
                    $(task.el).val(task.val);
                    next();
                    break;
                case "select":
                    $(task.el).val(task.val).change();
                    next();
                    break;

            }
        } catch(e) {
            console.error(task.type + ": " + task.name + " failed: " + e);
            that._save(currTaskName, false, {
                error: e
            });
            clearTimeout(globalTaskTimeout)
            that._end()
        }
    }
};

Automate.prototype._push = function(obj) {
    if (this.thenIndex > -1) {
        this.tasks.splice(this.thenIndex, 0, obj);
        this.thenIndex++;
    } else {
        this.tasks.push(obj);
    }
}

Automate.prototype._end = function() {
    $.get(this.serverUrl + "/end/" + this.currentRunId)
}

Automate.prototype._save = function(taskname, result, options) {
    var json = {
        "moduleName": this.moduleName,
        "currentRunId": this.currentRunId,
        "name": taskname,
        "result": result,
        "options": options
    };

    $.post(this.serverUrl + "/save", json);
}

function tap($element) {
    var isTouchDevice =  !!('ontouchstart' in window) || // works on most browsers
      !!('onmsgesturechange' in window); // works on ie10

    if (isTouchDevice) {
        var touchStartEvent = $.Event("touchstart");
        $element.trigger(touchStartEvent);
        setTimeout(function() {
            $element.trigger($.Event("touchend"));
        }, 10);
    }
    setTimeout(function() {
        $element.trigger($.Event("click"));
    }, 0);
}


function getNewTestRunId (cb, serverUrl, name) {
    $
        .get(serverUrl + "/getRunId?name=" + name + "&ua=" + encodeURIComponent(navigator.userAgent), cb)
        .fail(function(e) {
            window.alert("Error connecting to automate server. " + e.responseText);
        })
}
