const express = require('express');
const fs = require('fs/promises');
const path = require('path');

const CircularQueueNonBlocking = require('../helper/circular_queue_non_blocking');


const router = express.Router();

/* GET /var/log file and directory info. */
router.get('/*', async (req, res, next) => {

  const reqpathfull = path.join('/varlog', req.path);
  const fsPath = path.join('/var/log', req.path);

  try {

    const stats = await fs.lstat(fsPath);

    if (stats.isDirectory()) {
      const files = await fs.readdir(fsPath, { withFileTypes: true });
    
      const logfiles = files.filter(file => file.isFile());
      const subdirs = files.filter(file => file.isDirectory());
    
      res.json({
        logfiles: logfiles.map(logfile => ({ resource: path.join(reqpathfull, logfile.name) })),
        subdirs: subdirs.map(subdir => ({ resource: path.join(reqpathfull, subdir.name) }))
      });

      return;
    }

    if (stats.isFile()) {

      const filehandle = await fs.open(fsPath);

      const circularqueue = new CircularQueueNonBlocking(req.query.max_line_count ?? 10);
      const filterregex = new RegExp(req.query.filter_regex ?? ".*")
      for await (const line of filehandle.readLines()) {
        if (filterregex.test(line)) {
          circularqueue.enqueue(line);
        }
      }

      let lines = Array(circularqueue.size);
      for (let i = 0; i < lines.length; i++) {
        lines[i] = circularqueue.dequeue();
      }

      res.json({
        lines: lines
      });
      
      return;
    }

    res.status(404);
    res.json({});
  
  } catch (err) {
    next(err);
  };

});

module.exports = router;
