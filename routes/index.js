"use strict";

var fs = require("fs")
, exec = require("child_process").exec
, async = require("async")
, mkdirp = require("mkdirp")
, path = require("path")
, RUNS_DIR = __dirname + "/../runs/"
, request = require("request")
, qs = require("querystring")

mkdirp(RUNS_DIR)
exports.index = function(req, res){
  var runs

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
  ,  moduleName = test.moduleName || "default"
  
  runIdJsonPath = path.join(RUNS_DIR, runId + ".json")
  ;delete test.currentRunId;
  var runJson = fs.readFileSync(runIdJsonPath, "utf8")
  var suite = JSON.parse(runJson);
  test.result = (test.result === "true");
  if (suite.result) { //if suite hasn't failed yet
    suite.result = test.result
  }
  suite.tests[moduleName] = suite.tests[moduleName] || [];
  suite.tests[moduleName].push(test);
  fs.writeFileSync(path.join(RUNS_DIR, runId + ".json"), JSON.stringify(suite));

  res.end();
};

exports.getRunId = function(req, res) {
  var name = req.query.name;
  var newRunId = (new Date().getTime()) + "-" + name;
  var userAgent = req.query.ua;

  var queryString = qs.stringify({
    uas: userAgent,
    getJSON: "all"
  });

  console.log("http://www.useragentstring.com/" + queryString);

  request("http://www.useragentstring.com/?" + queryString, function(err, reqResp, body) {
    var basicRunJSON = {
      id: newRunId,
      end: false,
      result: true,
      tests: {},
      browser: (err? "" : JSON.parse(body).agent_name)
    };
    fs.writeFileSync(path.join(RUNS_DIR, newRunId + ".json"), JSON.stringify(basicRunJSON));
    res.send(200, "" + newRunId);
  })
};

exports.run = function(req, res) {
  var runId = req.params.id;
  var runJson = JSON.parse(fs.readFileSync(path.join(RUNS_DIR, runId + ".json")));
  var index = 1;
  var moduleName
  ,  moduleResult = true
  for (moduleName in runJson.tests) {
    runJson.tests[moduleName].forEach(function(test) {
      test.index = index++;
      if (test.options && test.options.error) {
        test.options.message = JSON.stringify(test.options.error, null, 4);
      }
    });
  }
  runJson.runId = runId;
  res.render("run", runJson);
};

exports.clear = function(req, res) {
  var execOptions = {
    cwd: RUNS_DIR
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
  
  var suite = JSON.parse(fs.readFileSync(path.join(RUNS_DIR, runId + ".json")));
  
  suite.end = true;
  fs.writeFile(path.join(RUNS_DIR, runId + ".json"), JSON.stringify(suite));
  res.end();
}

exports.getRunJson = function(req, res) {
  var runId = req.params.id
  , found = false
  , runs
  
  runs = fs.readdirSync(RUNS_DIR);
  runs.forEach(function(run) {
    if (run.indexOf(runId) > 0) {
      res.sendfile(path.join(RUNS_DIR, run))
      found = true
    }
  })

  if (!found) {
    res.send(400)
  }

}