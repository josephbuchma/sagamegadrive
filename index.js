// @flow

import { call, fork, put, take, select, takeEvery } from 'redux-saga/effects'
import changeCase from 'change-case'

type Action = {
  type: string,
  isSagaMegaDriveAction: true,
  // $FlowFixMe
  func: GeneratorFunction,
  // $FlowFixMe
  args: Arguments
}

// completed generates name of action that will be dispatched when
// given action is completed.
// $FlowFixMe
export const completed = (action: {type: string}|string) => action.type ? `${action.type}@SMD/COMPLETED` : `${action}@SMD/COMPLETED`

// error generates name of action that will be dispatched when
// given action is finished with error.
// $FlowFixMe
export const error = (action: {type: string}|string) => action.type ? `${action.type}@SMD/ERROR` : `${action}@SMD/ERROR`

function * handleAction (action: Action) {
  try {
    yield call(action.func, ...action.args)
    yield put({type: completed(action)})
  } catch (err) {
    yield put({type: error(action), error: err})
  }
}

type ActionsAndTypes = {
  Actions: {[string]: ()=>Action},
  Types: {[string]: string}
}

// makeActionCreators is a shortcut for makeActionCreator.
export const makeActionCreators = (actionsPrefix: string, actionCreators: {[string]: GeneratorFunction}): ActionsAndTypes => {
  if (!!actionsPrefix && !actionsPrefix.endsWith('_')) {
    actionsPrefix += '_'
  }
  let Actions = {...actionCreators}
  let Types = {}
  for (let a in actionCreators) {
    let ac = actionCreators[a]
    let t = changeCase.snake(a).toUpperCase()
    let tp = actionsPrefix+t
    if (ac.constructor.name === 'Function') {
      Actions[a] = actionCreators[a]
    } else if (ac.constructor.name === 'GeneratorFunction') {
      Actions[a] = makeActionCreator(tp, ac)
    } else {
      throw new Error("Unsupported action creator type: "+ac.constructor.name)
    }
    Types[a] = tp
    Types[t] = tp
  }
  return {Actions, Types}
}

export const makeActionCreator = (type: string, actionCreator: Function) => function(): Action {
  return {
    type,
    isSagaMegaDriveAction: true,
    func: actionCreator,
    args: arguments
  }
}

// saga is a root saga of sagamegadrive.
// fork it in the root saga of your application.
export function * saga (): any {
  yield takeEvery(a=>a.isSagaMegaDriveAction, handleAction)
}

export const ActionTypes = {
  REDUCE: 'SAGAMEGADRIVE/REDUCE',
  SET_STATE: 'SAGAMEGADRIVE/SET_STATE',
  RESET_STATE: 'SAGAMEGADRIVE/RESET_STATE',
}

// wrapReducer ...
export const wrapReducer = (reducer: Function) => (state: Object, action: Object) => {
  switch (action.type) {
  case ActionTypes.REDUCE:
    return action.reduce(state)
  case ActionTypes.SET_STATE:
    if (action.root) {
      return {...state, [action.root]: {...state[action.root], ...action.patch}}
    }
    return {...state, ...action.patch}
  case ActionTypes.RESET_STATE:
    if (action.root) {
      return {...state, [action.root]: {...action.newState}}
    }
    return {...action.newState}
  }
  return reducer(state, action)
}
