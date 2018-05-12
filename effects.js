// @flow

import { put, select, call } from 'redux-saga/effects'
import { ActionTypes } from './'

// reduceState effect reduces state using given reducer
export const reduceState = (reducer: (Object)=>Object) => put({type: ActionTypes.REDUCE, reduce: reducer})

// setState behaves like react's component setState.
// root is an optional argument that allows to update particular state branch.
export const setState = (update: Object|(state: Object, globalState?: Object)=>Object, root: string) => {
  return call(function*(){
    let globalState = yield select()
    let state = globalState
    if (root) {
      state = state[root]
    }
    let patch
    if (update.constructor.name !== 'Function') {
      patch = update
    } else {
      // $FlowFixMe
      patch = update(state, globalState)
    }
    if (patch) yield put({type: ActionTypes.SET_STATE, root, patch})
  })
}

// resetState replaces state at given root node
export const resetState = (newState: Object, root: string) => {
  return put({type: ActionTypes.RESET_STATE, newState, root})
}
