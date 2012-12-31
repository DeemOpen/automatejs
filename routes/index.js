var fs = require("fs");
exports.index = function(req, res){
  var runs = fs.readdirSync(__dirname + "/../runs");
  runs = runs.map(function(run) {
    return run.replace(".json", "");
  });

  console.log("runs:" + runs);
  
  res.render('index', {
    runs: runs
  });
};

exports.save = function(req, res) {
  console.log("req.body:" + JSON.stringify(req.body));
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
  var newRunId = platform  + "-" + (new Date().getTime());
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