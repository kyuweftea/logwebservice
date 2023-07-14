var express = require('express');
var fs = require('fs/promises');

var router = express.Router();


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


/* GET home page. */
router.get('/*', async (req, res, next) => {

  const resourcePrefix = '/varlog';
  let reqpathfull = resourcePrefix + req.path;
  let fsPath = '/var/log' + req.path;

  try {

    let stats = await fs.lstat(fsPath);

    if (stats.isDirectory()) {
      let files = await fs.readdir(fsPath, { withFileTypes: true });
    
      let logfiles = files.filter(file => file.isFile() && file.name.endsWith('log'));
      let subdirs = files.filter(file => file.isDirectory());
    
      res.json({
        logfiles: logfiles.map(logfile => ({ resource: reqpathfull + logfile.name })),
        subdirs: subdirs.map(subdir => ({ resource: reqpathfull + subdir.name }))
      });
      return;
    }

    if (stats.isFile()) {

      const filehandle = await fs.open(fsPath);

      let circularqueue = new CircularQueueNonBlocking(10);
      for await (const line of filehandle.readLines()) {
        circularqueue.enqueue(line);
      }

      let lines = Array(circularqueue.size);
      for (let i = 0; i < lines.length; i++) {
        lines[i] = circularqueue.dequeue();
      }

      res.json({lines: lines});
      
      return
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
  };

});

module.exports = router;
