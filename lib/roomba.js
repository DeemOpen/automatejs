var async = require("async");
var Roomba = module.exports = function() {
    this.tasks = [];
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
    });
    function next() {
        if (currTaskName) {
            save(currentRunId, currTaskName, true, {
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
                            I.event.subscribe(task.waitFor.implicitEvent, next);
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
                                I.event.subscribe(viewEvent, checkDialogAndDoNext);
                            }
                        }
                    }
                } catch(e) {
                    console.error(task.type + ": " + task.name + " failed: " + e);
                    save(currentRunId, currTaskName, false, {
                        error: e
                    });
                }
            }
        ]);
        
    }
};


function checkDialogAndDo (doWhat) {
    if (I.view.dialog.getIsShowing()) {
        I.event.subscribe("dialog:hide", function() {
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
        console.log("before event");
        var touchStartEvent = $.Event("touchstart");
        console.log("after event");
        $element.trigger(touchStartEvent);
        console.log("touchstart");
        setTimeout(function() {
            $element.trigger($.Event("touchend"));
                    console.log("touchend");

        }, 10);
    } //else{
    setTimeout(function() {
        $element.trigger($.Event("click"));
                console.log("click");

    }, 200);
    //}
}

function save (currentRunId, taskname, result, options) {
    var json = {
        "currentRunId": currentRunId,
        "name": taskname,
        "result": result,
        "options": options
    };

    $.post("http://localhost:3002/save", json);
}

function getNewTestRunId (cb) {
    $.get("http://192.168.1.133:3002/getRunId?platform=" + I.getPlatform(), cb);   
}