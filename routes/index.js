"use strict";

var fs = require("fs")
, exec = require("child_process").exec
, async = require("async")

exports.index = function(req, res){
  var RUNS_DIR = __dirname + "/../runs"
  ,   runs

  if (!fs.existsSync(RUNS_DIR)) {
    runs = []
  } else {
    runs = fs.readdirSync(RUNS_DIR);
    runs = runs.map(function(run) {
      return run.replace(".json", "");
    });
  }
  console.log("runs:" + runs);
  
  res.render('index', {
    runs: runs
  });
};

exports.save = function(req, res) {
  var test = req.body;
  var runId = test.currentRunId;
  delete test.currentRunId;
  var suite = JSON.parse(fs.readFileSync(__dirname + "/../runs/" + runId + ".json"));
  test.result = (test.result === "true");
  suite.tests.push(test);
  fs.writeFile(__dirname + "/../runs/" + runId + ".json", JSON.stringify(suite), function(err) {
    if (err) {
      throw err;
    }
  });

  res.end();
};

exports.getRunId = function(req, res) {
  var platform = req.query.platform;
  var newRunId = (new Date().getTime()) + "-" + platform;
  console.log("newRunId:" + newRunId);
  var basicRunJSON = {
    id: newRunId,
    tests: []
  };
  fs.writeFile(__dirname + "/../runs/" + newRunId + ".json", JSON.stringify(basicRunJSON), function(err) {
    if (err) {
      throw err;
    }
  });
  res.send(200, "" + newRunId);
};

exports.run = function(req, res) {
  var runId = req.params.id;
  var runJson = JSON.parse(fs.readFileSync(__dirname + "/../runs/" + runId + ".json"));
  var index = 1;
  runJson.tests.forEach(function(test) {
    test.index = index++;
    if (test.options && test.options.error) {
      test.options.message = JSON.stringify(test.options.error, null, 4);
    }
  });
  runJson.runId = runId;
  res.render("run", runJson);
};

exports.clear = function(req, res) {
  var execOptions = {
    cwd: __dirname + "/../runs/"
  }
  exec("rm *.json", execOptions, onDelete)
  function onDelete(err, stdout, stderr) {
    if (err) {
      console.log("stdout:" + stdout);
      console.log("stderr:" + stderr);
      res.send(500, err)
    } else {
      res.send(200)
    }
  }
}