var assert = require('assert');
var jsonAutosave = require('.');
var fs = require('fs');
var fsos = require('fsos');

var thrownCount = 0;
var assertPromiseNotThrown = function(e) {
  console.error(e.stack);
  assert(false, 'Error thrown:\n' + e.stack);
};

// Test with new file.
var testFile = 'test-1';
try { fs.unlinkSync(testFile); } catch(_) {}

var autosaved, interval = 50;
jsonAutosave(testFile, {interval: interval})
.then(function(f) {
  autosaved = f;
  return fsos.get(testFile);
}).then(function(val) {
  assert.equal(''+val, 'null');
}).catch(assertPromiseNotThrown)

// Test setting data.
.then(function() {
  autosaved.data = {hi: 5};
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, interval * 2);
  });
}).then(function() {
  return fsos.get(testFile);
}).then(function(val) {
  assert.equal(''+val, '{"hi":5}');
})

// Test stopping.
.then(function() {
  autosaved.stop();
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, interval * 2);
  });
}).then(function() {
  return fsos.delete(testFile);
}).then(function() {
  return fsos.get(testFile);
}).catch(function(e) {
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
