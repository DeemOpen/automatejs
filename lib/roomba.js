"use strict";
var async = require("async");
var Roomba = module.exports = function(serverUrl) {
    this.tasks = []
    this.serverUrl = serverUrl
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
        name: params.implicitEvent || params.view,
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
        next();
    }, this.serverUrl);
    function next() {
        if (currTaskName) {
            save(currentRunId, currTaskName, true, that.serverUrl, {
                message: currTaskName + " completed successfully"
            });
        }
        async.series([
            function aTimeout(cb) {
                setTimeout(function() {
                    cb(null);
                }, 500);
            },

            function doTask() {
                if (i === that.tasks.length) {
                    return; //end recursion
                }
                var task = that.tasks[i++];
                console.warn(task.type + ": " + task.name);
                currTaskName = task.type + ": " + task.name;
                
                try {
                    if (task.then) {
                        task.then();
                        next();
                    } else if (task.tap) {
                        checkDialogAndDo(function() {
                            tap($(".uiPageActive " + task.tap));
                            next();
                        });
                        
                    } else if (task.waitFor) {
                        if (task.waitFor.implicitEvent) {
                            window.I.event.subscribe(task.waitFor.implicitEvent, next);
                        } else if (task.waitFor.view) {
                            var checkDialogAndDoNext = function  () {
                                checkDialogAndDo(function() {
                                    next();
                                });
                            };
                            if ($('.uiPageActive').attr("id") === task.waitFor.view) {
                                checkDialogAndDoNext();
                            } else {
                                var viewEvent = "view:complete:" + task.waitFor.view;
                                window.I.event.subscribe(viewEvent, checkDialogAndDoNext);
                            }
                        }
                    }
                } catch(e) {
                    console.error(task.type + ": " + task.name + " failed: " + e);
                    save(currentRunId, currTaskName, false, that.serverUrl, {
                        error: e
                    });
                }
            }
        ]);
        
    }
};

function checkDialogAndDo (doWhat) {
    if (window.I.view.dialog.getIsShowing()) {
        window.I.event.subscribe("dialog:hide", function() {
            doWhat();
        });
    } else {
        doWhat();
    }
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

function save (currentRunId, taskname, result, serverUrl, options) {
    var json = {
        "currentRunId": currentRunId,
        "name": taskname,
        "result": result,
        "options": options
    };

    $.post(serverUrl + "/save", json);
}

function getNewTestRunId (cb, serverUrl) {
    $.get(serverUrl + "/getRunId?platform=" + window.I.getPlatform(), cb);
}