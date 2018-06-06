# Saga Mega Drive

Experimental 100% redux-saga driven reactjs experience.

### Install

```
npm install --save sagamegadrive
```

### Examples

- [Counter](https://github.com/josephbuchma/sagamegadrive/blob/master/examples/counter/index.js):
  - Clone this repo
  - `cd` examples/counter
  - `npm install && npm run build && npm run serve`
  - Open browser at `localhost:5000`

### TODO

- Wrap each generator action and check if there was nothing but `SET_STATE`,
  and if so, then don't push 'completed' action.
- Make put & receive 'completed' to make replacement for 'call' that will be
  traceable in log.
