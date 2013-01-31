"use strict";
var async = require("async");
var Roomba = module.exports = function(serverUrl, name) {
    this.tasks = []
    this.serverUrl = serverUrl
    this.name = name
};

Roomba.prototype.fill = function(el, val) {
    $(el).val(val);
};

Roomba.prototype.select = function(el, val) {
    $(el).val(val).change();
};

Roomba.prototype.tap = function(selector) {
    this.tasks.push({
        name: selector,
        type: "tap",
        tap: selector
    });
};

Roomba.prototype.start = Roomba.prototype.then = function(task) {
    this.tasks.push({
        name: task.name,
        type: "then",
        then: task
    });
};

Roomba.prototype.waitFor = function(params) {
    this.tasks.push({
        name: "timeout " + params,
        type: "waitFor",
        waitFor: params
    });
};

Roomba.prototype.runAll = function() {
    var i = 0,
        that = this,
        currTaskName, currentRunId;
    getNewTestRunId(function(newRunId) {
        currentRunId = newRunId;
        that.currentRunId = newRunId;
        next();
    }, this.serverUrl, this.name);
    function next() {
        if (currTaskName) {
            that._save(currTaskName, true, {
                message: currTaskName + " completed successfully"
            });
        }
        if (i === that.tasks.length) {
            that._end();
            return; //end tasks
        }
        var task = that.tasks[i++];
        console.warn(task.type + ": " + task.name);
        currTaskName = task.type + ": " + task.name;
        try {
            if (task.then) {
                task.then();
                next();
            } else if (task.tap) {
                tap($(task.tap));
                next();
            } else if (task.waitFor) {
                setTimeout(next, task.waitFor);
            }
        } catch(e) {
            console.error(task.type + ": " + task.name + " failed: " + e);
            that._save(currTaskName, false, {
                error: e
            });
            that._end()
        }
    }
};

Roomba.prototype._end = function() {
    $.get(this.serverUrl + "/end/" + this.currentRunId)
}

Roomba.prototype._save = function(taskname, result, options) {
    var json = {
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
    } //else{
    setTimeout(function() {
        $element.trigger($.Event("click"));
    }, 200);
}


function getNewTestRunId (cb, serverUrl, name) {
    $
        .get(serverUrl + "/getRunId?name=" + name, cb)
        .fail(function(e) {
            window.alert("Error connecting to roomba server. " + e.responseText);
        })
}