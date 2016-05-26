var fsos = require('fsos');

// Abstraction over a JS object that can be serialized to JSON.
// Use .data to modify it.
// To modify how frequently it saves to disk, use .setInterval(ms).
// You can also use .stop() to end the autosaving, .start() to resume it.
//
// options:
// - interval: minimum time in milliseconds between saves.
function JsonSave(data, file, options) {
  options = options || {};
  this.interval = +options.interval;
  // 5 seconds is the default interval.
  if (Number.isNaN(this.interval)) { this.interval = 5000; }

  this._data = data;
  this.file = file;
  var self = this;
  // Called upon attempting to save data. Used for debugging purposes.
  this.commitListener = options.commitListener || function(){};
  this.autosave = function() { self.save(); };
  this.intervalId = setInterval(this.autosave, this.interval);

  // Was ._data accessed since the beginning of the interval?
  this.wasAccessed = false;
  this.wasReset = false;
  this.lastJson = JSON.stringify(this._data);
}

JsonSave.prototype = {
  // Detect data changes to avoid oversaving.
  hasChanged(json) {
    var changed = true;
    if (this.wasReset) { changed = true;
    } else if (!this.wasAccessed) { changed = false;
    // At this point, we have detected all changes for non-objects.
    // What follows takes care of objects.
    } else if (this.lastJson.length !== json.length) { changed = true;
    } else { changed = (this.lastJson !== json); }
    this.wasReset = false;
    this.wasAccessed = false;
    this.lastJson = json;
    return changed;
  },
  get data() {
    this.wasAccessed = true;
    return this._data;
  },
  set data(value) {
    this.wasReset = true;
    return this._data = value;
  },
  // Save unless data was unchanged.
  // Return a Promise.
  save() {
    var json = JSON.stringify(this._data);
    if (this.hasChanged(json)) {
      return fsos.set(this.file, json)
        .then(this.commitListener).catch(this.commitListener);
    } else { return Promise.resolve(); }
  },
  setInterval(ms) {
    this.stop();
    this.interval = ms || 5000;  // 5 seconds.
    this.start();
  },
  stop() { clearInterval(this.intervalId); },
  start() { this.intervalId = setInterval(this.autosave, this.interval); },
};

// options:
// - interval: minimum time in milliseconds between saves.
// - data: default data if there is none saved in the past.
function autosave(file, options) {
  return new Promise(function(resolve, reject) {
    fsos.get(file).then(function(data) {
      try {
        var json = JSON.parse(data);
      } catch(e) { return reject(e); }
      resolve(new JsonSave(json, file, options));
    }).catch(function(e) {
      var data = options.data || null;
      fsos.set(file, JSON.stringify(data)).then(function() {
        resolve(new JsonSave(data, file, options));
      });
    });
  });
}

module.exports = autosave;
