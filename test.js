var assert = require('assert');
var jsonAutosave = require('.');
var fs = require('fs');
var fsos = require('fsos');

var thrownCount = 0;
var assertPromiseNotThrown = function(e) {
  console.error(e.stack || e);
  assert(false, 'Error thrown:\n' + (e.stack || e));
};

var testTimeout = 4000;  // 4s.
function awaitSaving() {
  return new Promise(function(resolve, reject) {
    var to = setTimeout(function() { reject("Timeout"); }, testTimeout);
    autosaved.commitListener = function() {
      clearTimeout(to);
      resolve();
    };
  });
}

// Test with new file.
var testFile = 'test-1';
try { fs.unlinkSync(testFile); } catch(_) {}

var autosaved, interval = 0;
jsonAutosave(testFile, {interval: interval, data: 'data'})
.then(function(f) {
  autosaved = f;
  assert.equal(f.interval, interval);
  assert.equal(f.data, 'data');
  return fsos.get(testFile);
}).then(function(val) {
  assert.equal(''+val, '"data"');
}).catch(assertPromiseNotThrown)

// Test setting data.
.then(function() {
  autosaved.data = {hi: 5};
  return awaitSaving();
}).then(function() {
  return fsos.get(testFile);
}).then(function(val) {
  assert.equal(''+val, '{"hi":5}');
}).catch(assertPromiseNotThrown)

// Test setting data object with JSON size change.
.then(function() {
  autosaved.data.hi = 10;
  return awaitSaving();
}).then(function() {
  return fsos.get(testFile);
}).then(function(val) {
  assert.equal(''+val, '{"hi":10}');
}).catch(assertPromiseNotThrown)

// Test setting data object without JSON size change.
.then(function() {
  autosaved.data.hi = 20;
  return awaitSaving();
}).then(function() {
  return fsos.get(testFile);
}).then(function(val) {
  assert.equal(''+val, '{"hi":20}');
}).catch(assertPromiseNotThrown)

// Test accessing data object without changing anything.
.then(function() {
  var json = JSON.stringify(autosaved.data);
  assert.equal(autosaved.hasChanged(json), false);
}).catch(assertPromiseNotThrown)

// Test hasChanged without accessing data.
.then(function() {
  assert.equal(autosaved.hasChanged(), false);
}).catch(assertPromiseNotThrown)

// Test setInterval.
.then(function() {
  autosaved.setInterval(interval + 1);
  assert.equal(autosaved.interval, interval + 1);
  autosaved.setInterval(interval);
}).catch(assertPromiseNotThrown)

// Test stopping.
.then(function() {
  autosaved.stop();
  return fsos.delete(testFile);
}).then(function() {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, interval * 2);
  });
}).then(function() {
  return fsos.get(testFile);
}).catch(function(e) {
  if (e.code !== 'ENOENT') { console.error(e); }
  assert.equal(e.code, 'ENOENT');
  thrownCount++;
}).then(function() {
  assert.equal(thrownCount, 1);
}).catch(assertPromiseNotThrown)

.then(function() {
  console.log('done');
}).catch(function(e) {
  console.error(e);
  assert(false);
});
