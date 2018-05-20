// @flow
import { call, fork, put, select, takeEvery } from 'redux-saga/effects'
import changeCase from 'change-case'

type Action = {
  type: string,
  isSagaMegaDriveAction: true,
  // $FlowFixMe
  func: GeneratorFunction,
  // $FlowFixMe
  args: Arguments
}

type ActionsAndTypes = {
  // Actions are action creators.
  Actions: {[string]: ()=>Action},
  // Types are generated from actions names. For example, generated action type for creator myAction
  // will be <PREFIX>_MY_ACTION, and will be available at myAction and MY_ACTION keys.
  Types: {[string]: string}
}

const makeActionCreator = (type, actionCreator) => function(): Action {
  return {
    type,
    args: arguments,
    isSagaMegaDriveAction: true,
    func: actionCreator
  }
}

// completed generates name of action that will be dispatched when
// given action is completed.
// Example usage:
//     yield put(Actions.myAction())
//     yield take(completed(Types.MY_ACTION))
// $FlowFixMe
export const completed = (action: {type: string}|string) => action.type ? `${action.type}_COMPLETED@SAGAMEGADRIVE` : `${action}_COMPLETED@SAGAMEGADRIVE`

// error generates name of action that will be dispatched when
// given action is finished with error.
// Example usage:
//     yield put(Actions.myAction())
//     let status = yield take([completed(Types.MY_ACTION), error(Types.MY_ACTION)])
// $FlowFixMe
export const error = (action: {type: string}|string) => action.type ? `${action.type}_ERROR@SAGAMEGADRIVE` : `${action}_ERROR@SAGAMEGADRIVE`


function * handleAction (action: Action) {
  try {
    let result = yield call(action.func, ...action.args)
    let a = { type: completed(action) }
    if (result) {
      a.result = result
    }
    yield put(a)
  } catch (err) {
    yield put({type: error(action), error: err})
  }
}


// saga is a root saga of sagamegadrive.
// fork it in the root saga of your application.
export function * saga (): any {
  yield takeEvery(a=>a.isSagaMegaDriveAction, handleAction)
}

export type SagaMegaDrive = {
  reducer: (state: Object, action: Object) => Object,
  setState: (update: Object|(state: Object, globalState: Object)=>Object) => void,
  resetState: (newState: Object) => void,
  createActions: (funcs: {[string]: GeneratorFunction}) => ActionsAndTypes,
}

const SagaMegaDrive = (stateKey: string, initialState: Object): SagaMegaDrive => {
  const actionPrefix = changeCase.snake(stateKey).toUpperCase()
  const actionTypes = {
    SET_STATE: `${actionPrefix}_SET_STATE@SAGAMEGADRIVE`,
    RESET_STATE: `${actionPrefix}_RESET_STATE@SAGAMEGADRIVE`
  }

  return {
    // reducer must be mounted in combineReducers at the same key as provided to constructor.
    reducer: (state: Object, action: Object): Object => {
      const { SET_STATE, RESET_STATE } = actionTypes
      if (!state) {
        state = initialState
      }
      switch (action.type) {
      case SET_STATE:
        return {...state, ...action.patch}
      case RESET_STATE:
        return {...action.newState}
      }
      return state
    },

    // setState saga effect
    setState: (update: Object|(state: Object, globalState: Object)=>Object) => {
      const { SET_STATE } = actionTypes
      return call(function*(){
        let globalState = yield select()
        let state = globalState[stateKey]
        let patch
        if (typeof update !== 'function') {
          patch = update
        } else {
          patch = update(state, globalState)
        }
        if (patch) yield put({type: SET_STATE, patch})
      })
    },

    // resetState saga effect
    resetState: (newState: Object) => {
      return put({type: actionTypes.RESET_STATE, newState})
    },

    // createActions translates given map of generator functions into action creators.
    // regular functions are not interpreted.
    // Action type name will be generated from key (converted to SCREAMING_SNAKE_CASE)
    createActions: (funcs: {[string]: GeneratorFunction|Function}): ActionsAndTypes => {
      const actionsPrefix =  actionPrefix+'_'
      let Actions = {...funcs}
      let Types = {}
      for (let a in funcs) {
        let ac = funcs[a]
        let t = changeCase.snake(a).toUpperCase()
        let tp = actionsPrefix+t
        if (ac.constructor.name === 'Function') {
          Actions[a] = () => {
            let v = ac(...arguments)
            if (v['@@redux-saga/IO']) {
              return makeActionCreator(tp, function*(){ yield v })()
            }
            if (!v.type) {
              v.type = tp
            }
            return v
          }
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
  }
}

export default SagaMegaDrive
