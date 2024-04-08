import React, { useState, useEffect } from 'react'

const matchRank = (players, balls) => {
  // get players and cards ranking
  return players
    .map((p) => {
      const countHits = (a, x) => (balls.includes(x) ? 1 : 0) + a
      const rowsFinished = (a, x) => (x === 5 ? 1 : 0) + a
      const sumAll = (a, x) => x + a
      const cards = p.cards
        .map((c, j) => {
          const rowHits = c.map((r) => r.reduce(countHits, 0))
          const hits = rowHits.reduce(sumAll, 0)
          const rows = rowHits.reduce(rowsFinished, 0)
          return {
            card: j + 1,
            hits,
            rows,
          }
        })
        .sort((a, b) => b.hits - a.hits)
      const best = cards[0].hits
      return {
        name: p.name,
        connected: p.connected,
        best,
        cards,
      }
    })
    .sort((a, b) => b.best - a.best)
}

const Ranking = ({ players, balls }) => {
  const [rank, setRank] = useState([])
  useEffect(() => {
    setRank(matchRank(players, balls))
    return () => {}
  }, [players, balls])

  return (
    <table>
      <thead>
        <tr>
          <th colSpan="2">Participante</th>
          <th>Aciertos</th>
          <th>Líneas</th>
        </tr>
      </thead>
      <tbody>
        {rank.map((p, i) => (
          <React.Fragment key={i}>
            {p.cards.map((c, j) => (
              <tr key={`${i}-${j}`}>
                {j === 0 ? (
                  <td className={`player ${p.connected ? 'connected' : ''}`}>
                    {p.name}
                  </td>
                ) : (
                  <td></td>
                )}
                <td>#{c.card}</td>
                <td>{c.hits}</td>
                <td>{c.rows}</td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  )
}

export default Ranking
