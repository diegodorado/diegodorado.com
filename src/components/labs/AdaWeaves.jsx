import { useState, useEffect, useRef } from 'react'

const cardWidth = 24

const validateState = (cells) => {
  const l = cells.slice(7, 12).reduce((a, b) => a + b, 0)
  const r = cells.slice(12, 17).reduce((a, b) => a + b, 0)
  if (l === 0 || l === 5) {
    cells[9] = cells[9] > 0 ? 0 : 1
  }
  if (r === 0 || r === 5) {
    cells[14] = cells[14] > 0 ? 0 : 1
  }
}

const randomize = (cells) => {
  const length = cells.length
  for (var i = 0; i < length; i++) cells[i] = Math.random() > 0.5 ? 1 : 0
}

const applyRule = (cells, rule) => {
  const length = cells.length
  const nextState = new Array(length)
  for (var i = 0; i < length; i++) {
    const l = cells[(i + length - 1) % length]
    const c = cells[i]
    const r = cells[(i + 1) % length]
    const n = (l << 2) | (c << 1) | r
    nextState[i] = (rule & Math.pow(2, n)) > 0 ? 1 : 0
  }
  validateState(nextState)
  return nextState
}

const bin2hex = (b) => {
  return b.match(/.{4}/g).reduce(function (acc, i) {
    return acc + parseInt(i, 2).toString(16)
  }, '')
}

const encodeRows = (rows) => {
  return rows.map((r) => bin2hex(r.join(''))).join('|')
}

const generateSVG = (rows, color) => {
  const r = 1.6
  const rl = 1.4
  const sw = 0.3
  const l = rows.length
  const dy = 5.02
  const dx = 4.5
  const oy = 4 + r
  const ox = 30.5 + r

  const h = dy * l + oy * 2
  const w = dx * cardWidth + ox * 2

  let svg = `<svg xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 ${w} ${h}"
    height="${h}mm"
    width="${w}mm"
    units="mm"
    data-rows="${encodeRows(rows)}"
  >\n`

  for (let y = 0; y < l; y++) {
    const cy = oy + y * dy
    svg += `<circle cx="${24.95 + r}" cy="${cy}" r="${rl}" stroke="black" stroke-width="${sw}" style="fill:none" fill="transparent" />`
    for (let x = 0; x < cardWidth; x++) {
      const cx = ox + x * dx
      const c = color ? (rows[y][x] ? 'white' : 'black') : 'none'
      if (color || rows[y][x]) {
        svg += `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="black" stroke-width="${sw}" style="fill:${c}" fill="${c}" />`
      }
    }
    svg += `<circle cx="${139.31 + r}" cy="${cy}" r="${rl}" stroke="black" stroke-width="${sw}" style="fill:none" fill="transparent" />`
  }

  svg += `<rect x="13" y="3" width="141" height="${dy * l + oy}" fill="transparent" style="fill:none" stroke="black" stroke-width="${sw}" />\n</svg>`
  return svg
}

const downloadSVG = (svg) => {
  const filename = 'punch-card.svg'
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

const rules = [
  18, 22, 26, 30, 45, 54, 60, 73, 82, 90, 106, 106, 109, 110, 122, 126, 129,
  146, 150, 154, 195,
]

const AdaWeaves = () => {
  const width = 48
  const height = 48
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const offsetY = 4
  const state = useRef({
    tick: 0,
    row: 0,
    ruleIndex: 0,
    rule: rules[0],
    cells: new Array(width),
  })
  const [rule, setRule] = useState(state.current.rule)

  const draw_rule = (context) => {
    context.fillStyle = '#646464'
    context.fillRect(0, 0, width, 4)
    for (let i = 0; i < 8; i++) {
      const v = (state.current.rule >> i) & 0x01
      context.fillStyle = v ? '#ddd' : '#222'
      context.fillRect((7 - i) * 6 + 2, 1, 1, 1)
      for (let j = 0; j < 3; j++) {
        const v = (i >> j) & 0x01
        context.fillStyle = v ? '#ddd' : '#222'
        context.fillRect((7 - i) * 6 + 1 + j, 2, 1, 1)
      }
    }
  }

  const draw_line = (context) => {
    const data = context.getImageData(0, offsetY, width, height - offsetY - 1)
    context.putImageData(data, 0, offsetY + 1)
    for (var i = 0; i < width; i++) {
      context.fillStyle = state.current.cells[i] ? '#ddd' : '#222'
      context.fillRect(i, offsetY, 1, 1)
    }
  }

  const downloadPunchcard = (ev) => {
    ev.preventDefault()
    const rows = Array.from({ length: 500 }, (_, r) => {
      const cells = new Array(cardWidth)
      for (let i = 0; i < cardWidth; i++) cells[i] = Math.random() > 0.5 ? 1 : 0
      validateState(cells)
      return cells
    })
    const svg = generateSVG(rows, false)
    downloadSVG(svg)
  }

  const downloadColorSvg = (ev) => {
    ev.preventDefault()
    const rows = Array.from({ length: 500 }, (_, r) => {
      const cells = new Array(cardWidth)
      for (let i = 0; i < cardWidth; i++) cells[i] = Math.random() > 0.5 ? 1 : 0
      validateState(cells)
      return cells
    })
    const svg = generateSVG(rows, true)
    downloadSVG(svg)
  }

  useEffect(() => {
    const draw = () => {
      state.current.tick++
      if (canvasRef.current) {
        const context = canvasRef.current.getContext('2d')
        if (state.current.tick % 60 === 0) {
          draw_rule(context)
          draw_line(context)
          state.current.cells = applyRule(state.current.cells, state.current.rule)
          state.current.row++
          if (state.current.row % 24 === 0) {
            state.current.ruleIndex++
            state.current.ruleIndex %= rules.length
            state.current.rule = rules[state.current.ruleIndex]
            setRule(state.current.rule)
          }
        }
      }
      rafRef.current = requestAnimationFrame(draw)
    }

    randomize(state.current.cells)
    rafRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className="ada-algorithm">
      <p>Transformations of rule #{rule} is being applied.</p>
      <canvas className="ada-canvas" width={width} height={width} ref={canvasRef}></canvas>
      <button onClick={downloadPunchcard}>Download Punchcard</button>
      <button onClick={downloadColorSvg}>Download Preview</button>
    </div>
  )
}

export default AdaWeaves
