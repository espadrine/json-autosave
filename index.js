var fsos = require('fsos');

// Abstraction over a JS object that can be serialized to JSON.
// Use .data to modify it, or .set() / .get().
// To modify how frequently it saves to disk, use .setInterval(ms).
// You can also use .stop() to end the autosaving, .start() to resume it.
function JsonFile(data, file, options) {
  options = options || {};
  this.data = data;
  this.file = file;
  this.interval = options.interval || 5000;  // 5 seconds.
  this.autosave = function() { this.save(); }.bind(this);
  this.intervalId = setInterval(this.autosave, this.interval);
}

JsonFile.prototype = {
  set(key, value) { this.data[key] = value; },
  get(key) { return this.data[key]; },
  save() { return fsos.set(this.file, JSON.stringify(this.data)); },
  setInterval(ms) {
    clearInterval(this.intervalId);
    this.interval = ms || 5000;  // 5 seconds.
    this.intervalId = setInterval(this.autosave, this.interval);
  },
  stop() { clearInterval(this.intervalId); },
  start() { setInterval(this.interval); },
};

function autosave(file, options) {
  return new Promise(function(resolve, reject) {
    fsos.get(file).then(function(data) {
      try {
        var json = JSON.parse(data);
      } catch(e) { return reject(e); }
      resolve(new JsonFile(json, file, options));
    }).catch(function(e) {
      resolve(new JsonFile(null, file, options));
    });
  });
}

module.exports = autosave;
