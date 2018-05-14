
import 'babel-polyfill'

import { createStore, applyMiddleware, compose, combineReducers, bindActionCreators } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { fork, call } from 'redux-saga/effects'

import sagamegadrive, { saga as sagamegadriveSaga } from 'sagamegadrive'

import React, { Component } from 'react'
import ReactDOM from 'react-dom'

import { connect, Provider } from 'react-redux'

const sagaMiddleware = createSagaMiddleware()
let middleware = applyMiddleware(sagaMiddleware)

// add the redux dev tools
if (process.env.NODE_ENV !== 'production' && window.devToolsExtension) {
  middleware = compose(middleware, window.devToolsExtension())
}

const INITIAL_STATE = {
  value: 0,
  loading: false
}

const { reducer, setState, resetState, makeActionCreators } = sagamegadrive('counter', INITIAL_STATE)

// create the store
const store = createStore(combineReducers({counter: reducer}), middleware)

sagaMiddleware.run(rootSaga)

function * rootSaga () {
  yield fork(sagamegadriveSaga)
}

const { Actions, Types } = makeActionCreators({
  reset: function * () { yield resetState(INITIAL_STATE) },
  increment: function * () { yield setState((s) => ({ value: s.value + 1 })) },
  decrement: function * () { yield setState((s) => ({ value: s.value - 1 })) },
  incrementAsync: function * (delay) {
    yield setState({loading: true})
    yield call(() => new Promise(resolve => setTimeout(resolve, delay)))
    yield setState((s) => ({ value: s.value + 1, loading: false }))
  },
  decrementAsync: function * (delay) {
    yield setState({loading: true})
    yield call(() => new Promise(resolve => setTimeout(resolve, delay)))
    yield setState((s) => ({ value: s.value - 1, loading: false }))
  }
})

class CounterApp extends Component {
  render () {
    return (
      <div style={{display: 'flex', flexDirection: 'column', maxWidth: '100%', alignItems: 'center', justifyContent: 'center'}}>
        <span>Value: {this.props.value}</span>
        <button onClick={this.props.increment}>Increment</button>
        <button onClick={this.props.decrement}>Decrement</button>
        <button onClick={() => this.props.incrementAsync(1000)}>Increment Async</button>
        <button onClick={() => this.props.decrementAsync(1000)}>Decrement Async</button>
        { this.props.loading ? <span>Loading...</span> : null }
      </div>
    )
  }
}

const mapStateToProps = (state) => ({ value: state.counter.value, loading: state.counter.loading })
const mapDispatchToProps = (dispatch) => bindActionCreators(Actions, dispatch)

const Root = connect(mapStateToProps, mapDispatchToProps)(CounterApp)

ReactDOM.render(<Provider store={store}><Root /></Provider>, document.getElementById('root'))
