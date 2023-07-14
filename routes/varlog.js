const express = require('express');
const fs = require('fs/promises');
const path = require('path');

const router = express.Router();


class CircularQueueNonBlocking {
  constructor(capacity) {
    this.capacity = capacity;
    this.storage = Array(capacity);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  enqueue(elem) {
    this.storage[this.tail] = elem;
    this.tail = (this.tail + 1) % this.capacity;

    if (this.capacity == this.size) {
      this.head = (this.head + 1) % this.capacity;
    } else {
      this.size++;
    }
  }

  dequeue() {
    if (this.size == 0) {
        throw new Error("circular queue is empty");
    }

    let elem = this.storage[this.head];
    this.head = (this.head + 1) % this.capacity;
    this.size--;

    return elem;
  }

}


/* GET /var/log directory and log file info. */
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
