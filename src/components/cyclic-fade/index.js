import React, { Component } from 'react'
import './index.sass'

class CyclicFade extends Component {

  constructor(props) {
    super(props);
    this.state = {
      index: 0,
      paused: false
    };
  }

  onMouseEnter = (e) => {
    this.setState({paused: true})
  }

  onMouseLeave = (e) => {
    this.setState({paused: false})
  }

  onMouseClick = (e) => {
    e.preventDefault()
    let { index } = this.state
    const { children } = this.props
    index++
    index %= children.length
    this.setState({index: index})
  }


  componentWillMount() {
    let last = null
    const { children, speed } = this.props

    let animate = (timestamp) => {
      if (this.willUnmount) return
      if (!last || (timestamp - last) > speed) {
        let { index, paused } = this.state;
        if(!paused){
          index++
          index %= children.length
          this.setState({index: index})
          last = timestamp
        }
      }
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(animate)
      }
    }
    animate()
  }

  componentDidMount() {
  }

  componentWillUnmount() {
    this.willUnmount = true;
  }

  render() {
    const { children } = this.props;
    const { index } = this.state;
    return (
        <div className="cyclic-fade-container" onClick={this.onMouseClick} onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave} aria-hidden="true">
            {children.map((each, key) => (
              <div key={key} className={`cyclic-fade-child ${key === index ? 'active' : ''}`} aria-hidden="true">
                {each}
              </div>
            ))}
          </div>
    )
  }

}

export default CyclicFade;
