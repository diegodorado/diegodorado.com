import React from "react"
import { Link } from "gatsby"

const swaps = [['i', '1'], ['e', '3'], ['o', '0'], ['g', '6'], ['a', '4']]
//todo: improve performance
class Brand extends React.Component {

  constructor(props) {
    super(props)
    this.state = { title: props.title, swaps: props.swaps || swaps }
  }

  getDiff() {
    let diff = 0
    for (let i = 0; i < this.props.title.length; i++) {
      diff += (this.state.title[i] === this.props.title[i]) ? 0 : 1
    }
    return diff
  }

  timer() {
    const swaps = this.state.swaps
    let i = Math.floor(Math.random() * swaps.length)
    let from = Math.round(Math.random())
    if (this.getDiff() > 3) from = 1
    let to = from ? 0 : 1
    if (Math.random() < 0.5) {
      this.setState({
        title: this.state.title.replace(swaps[i][from], swaps[i][to])
      })
    }
  }

  componentDidMount() {
    this.intervalId = setInterval(this.timer.bind(this), 100);
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }

  render() {
    return (
      <h1>
        <Link to={`/`}>{this.state.title}</Link>
      </h1>
    )
  }

}

export default Brand
