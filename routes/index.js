"use strict";
/*
*
*   Copyright (c) 2013, Rearden Commerce Inc. All Rights Reserved.
*
*   Licensed under the Apache License, Version 2.0 (the "License");
*   you may not use this file except in compliance with the License.
*   You may obtain a copy of the License at
*
*       http://www.apache.org/licenses/LICENSE-2.0
*
*   Unless required by applicable law or agreed to in writing, software
*   distributed under the License is distributed on an "AS IS" BASIS,
*   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*   See the License for the specific language governing permissions and
*   limitations under the License.
*
*/

var fs = require("fs")
, exec = require("child_process").exec
, async = require("async")
, mkdirp = require("mkdirp")
, path = require("path")
, RUNS_DIR = __dirname + "/../runs/"

mkdirp(RUNS_DIR)
exports.index = function(req, res){
  var runs

  runs = fs.readdirSync(RUNS_DIR);
  runs =
    runs
    .filter(function removeDSSTore(fileName){
      return fileName.indexOf("DS_Store") === -1
    })
    .map(function(run) {
    var parts = run.replace(".json", "").split("-");
    var runDate = new Date(parseInt(parts[0], 10))
    var formattedDate = runDate.toLocaleTimeString() + " " +
      (runDate.getMonth() + 1) + "/" + runDate.getDate()
    return {
      date: runDate,
      formattedDate: formattedDate,
      name: parts[1],
      filename: run,
      runInfo: JSON.parse(fs.readFileSync(path.join(RUNS_DIR, run), "utf8"))
    }
  });

  runs.sort(function(run1, run2) {
    return run2.date - run1.date
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
  var name = req.query.name
  , newRunId = (new Date().getTime()) + "-" + name
  , userAgent = req.query.ua.toLowerCase()
  , browser;

  if (userAgent.indexOf("android") > -1) {
    browser = "android"
  } else if (userAgent.indexOf("ipad") > -1 || userAgent.indexOf("iphone") > -1) {
    browser = "apple"
  } else {
    browser = "chrome"
  }

  var basicRunJSON = {
    id: newRunId,
    end: false,
    result: true,
    tests: {},
    browser: browser
  };
  fs.writeFileSync(path.join(RUNS_DIR, newRunId + ".json"), JSON.stringify(basicRunJSON));
  res.send(200, "" + newRunId);
};

exports.run = function(req, res) {
  var runId = req.params.id;
  var runJson = JSON.parse(fs.readFileSync(path.join(RUNS_DIR, runId + ".json"), "utf8"));
  var index = 1;
  var moduleName
  ,  moduleResult = true
  for (moduleName in runJson.tests) {
    runJson.tests[moduleName].forEach(function(test) {
      test.index = index++;
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
  var suite = JSON.parse(fs.readFileSync(path.join(RUNS_DIR, runId + ".json"), "utf8"));
  suite.end = true;
  fs.writeFileSync(path.join(RUNS_DIR, runId + ".json"), JSON.stringify(suite));
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
