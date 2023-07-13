var express = require('express');
var fs = require('fs')

var router = express.Router();

/* GET home page. */
router.get('/*', (req, res, next) => {

  const resourcePrefix = '/varlog'
  var reqpath = resourcePrefix + req.path;
  var fsPath = '/var/log' + req.path;

  try {
    var stats = fs.lstatSync(fsPath);
    
    if (stats.isDirectory()) {
        var files = fs.readdirSync(fsPath, { withFileTypes: true });

        var logfiles = files.filter(file => file.isFile() && file.name.endsWith('log'));
        var subdirs = files.filter(file => file.isDirectory());

        res.json({
          logfiles: logfiles.map(logfile => ({ resource: reqpath + logfile.name })),
          subdirs: subdirs.map(subdir => ({ resource: reqpath + subdir.name }))
        });
        return;
    }

    if (stats.isFile()) {
        res.json(stats);
        return;
    }

    res.status('404');
    res.json({});

  } catch (err) {

    if (err.code == 'ENOENT') {
      res.status('404');
    } else {
      res.status('500');
    }
    
    res.json(err);
  }

});

module.exports = router;
