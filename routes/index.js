"use strict";

var fs = require("fs")
, exec = require("child_process").exec
, async = require("async")
, mkdirp = require("mkdirp")
, path = require("path")
, RUNS_DIR = __dirname + "/../runs/"

exports.index = function(req, res){
  var runs

  if (!fs.existsSync(RUNS_DIR)) {
    runs = []
    mkdirp(RUNS_DIR)
  } else {
    runs = fs.readdirSync(RUNS_DIR);
    runs = runs.map(function(run) {
      var parts = run.replace(".json", "").split("-");
      var runDate = new Date(parseInt(parts[0], 10))
      var formattedDate = runDate.toLocaleTimeString() + " " +
        (runDate.getMonth() + 1) + "/" + runDate.getDate()
      return {
        date: runDate,
        formattedDate: formattedDate,
        name: parts[1],
        filename: run,
        runInfo: JSON.parse(fs.readFileSync(path.join(RUNS_DIR, run)))
      }
    });
  }

  runs.sort(function(run1, run2) {
    return run1.date < run2.date
  })
  res.render('index', {
    runs: runs
  });
};

exports.save = function(req, res) {
  var runIdJsonPath
  ,  test = req.body
  ,  runId = test.currentRunId
  
  runIdJsonPath = path.join(RUNS_DIR, runId + ".json")
  ;delete test.currentRunId;
  var runJson = fs.readFileSync(runIdJsonPath, "utf8")
  var suite = JSON.parse(runJson);
  test.result = (test.result === "true");
  if (suite.result) { //if suite hasn't failed yet
    suite.result = test.result
  }
  suite.tests.push(test);
  fs.writeFileSync(__dirname + "/../runs/" + runId + ".json", JSON.stringify(suite));

  res.end();
};

exports.getRunId = function(req, res) {
  var name = req.query.name;
  var newRunId = (new Date().getTime()) + "-" + name;
  var basicRunJSON = {
    id: newRunId,
    end: false,
    result: true,
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
      res.send(500, err)
    } else {
      res.send(200)
    }
  }
}

exports.end = function(req, res) {
  var runId = req.params.id;
  
  var suite = JSON.parse(fs.readFileSync(__dirname + "/../runs/" + runId + ".json"));
  
  suite.end = true;
  fs.writeFile(__dirname + "/../runs/" + runId + ".json", JSON.stringify(suite), function(err) {
    if (err) {
      res.send(500, err);
      throw err;
    }
    res.end();
  });
}

exports.getRunJson = function(req, res) {
  var runId = req.params.id
  , found = false
  , runs
  
  runs = fs.readdirSync(RUNS_DIR);
  runs.forEach(function(run) {
    if (run.indexOf(runId) > 0) {
      console.log("RUNS_DIR:" + RUNS_DIR);
      res.sendfile(path.join(RUNS_DIR, run))
      found = true
    }
  })

  if (!found) {
    res.send(400)
  }

}