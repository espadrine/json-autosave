*I have mutable state that must be kept after restarts.*

*I use…*

# json-autosave

- Automatically save a JSON-serializable state on disk in the background.
- Minimizes disk IO operations.
- Resilient to process and system crashes (on journaling and COW file systems).

```js
var autosave = require('json-autosave');
var stats = autosave('stats.json');

stats.data = { pageViews: 0 };
```

# Interface

**`autosave(filename, options)`** returns a JsonSave object.

Options:

- `interval`: how frequently (in milliseconds) we should ensure that the data is
  saved.
- `data`: default data if it does not already exist.

**`save.data`**: mutable JS object that will be saved to JSON on disk
automatically. You can set it to whatever you like or change any property it
has. The only restriction is that it must be JSON-serializable.

**`save.setInterval(ms)`** changes the frequency with which we save the
data.

**`save.stop()`** prevents saving data updates to disk.

**`save.start()`** resumes saving data to disk.
