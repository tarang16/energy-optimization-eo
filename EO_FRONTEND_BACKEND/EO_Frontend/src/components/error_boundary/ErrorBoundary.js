import React from 'react'
import classes from './ErrorBoundary.module.scss'
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
    }
  }
  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return {
      hasError: true,
    }
  }
  componentDidCatch() {
    // You can also log the error to an error reporting service
  }
  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div
          className={`${classes.content} h-100 align-items-center justify-content-center d-flex flex-column primary_bgbg_primary_blue_bg`}
          style={{
            paddingLeft: '4%',
            paddingRight: '4%',
          }}
          data-static-id='ErrorBoundary.js_div_85482a'
        >
          <h1
            className=' text-18 text-center primary_gray'
            data-static-id='ErrorBoundary.js_h1_4796db'
          >
            SOMETHING WENT WRONG
          </h1>
          <p
            className=' text-18 primary_gray_2 text-center'
            data-static-id='ErrorBoundary.js_p_872fc3'
          >
            {this.props.message || 'Please try again later.'}
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
export default ErrorBoundary
