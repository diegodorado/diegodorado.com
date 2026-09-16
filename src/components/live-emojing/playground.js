/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useState, useEffect, useContext } from 'react'
import { get, set } from './storage'

import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

import {
  FaBackspace,
  FaCaretLeft,
  FaCaretRight,
  FaPlay,
  FaStop,
  FaDice,
  FaExpand,
  FaCompress,
  FaQuestionCircle,
} from 'react-icons/fa'

import scheduler from './scheduler'
import Canvas from './canvas'
import {
  alphaEmoji,
  randomPattern,
  emojiArray,
  customEmojis,
  recentEmojis,
  includeEmojis,
  sanitizeEmojiId,
  i18nEmojis,
} from './utils'

import parser from './tidal'
import Pattern from './pattern'
import LiveEmojingContext from './context'
import { useTranslation } from 'react-i18next'

//todo: split this file in smaller modules! please!!
const emojiIndex = { emojis: {} }
const emoji_ids = Object.values(emojiIndex.emojis).reduce(
  (o, e) => Object.assign(o, { [e.native]: sanitizeEmojiId(e.id) }),
  {}
)

let backspaceOn = null
let parsedGrammar = null

const Playground = ({ pattern }) => {
  const [t] = useTranslation()

  const context = useContext(LiveEmojingContext)
  const [expanded, setExpanded] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [isDesktop, setIsDesktop] = useState(false)
  const [highlighted, setHighlighted] = useState(false)
  const [error, setError] = useState(false)
  const [left, setLeft] = useState('')
  const [prevPattern, setPrevPattern] = useState('a b c d')
  const [right, setRight] = useState('')

  useEffect(() => {
    if (context.playingAlone) scheduler.init()

    setIsDesktop(typeof window.orientation === 'undefined')

    //todo: open play alone when pattern is on url
    //got pattern from url?
    //setLeft( pattern ? pattern : get('pattern', randomPattern()))
    setLeft((left) =>
      pattern ? pattern : get('pattern', randomPattern())
    )

    setShowInstructions(
      get('showInstructions', 'true') === 'true'
    )

    document.addEventListener('fullscreenchange', onFullScreenChange)

    // Specify how to clean up after this effect:
    return () => {
      document.removeEventListener('fullscreenchange', onFullScreenChange)
      if (context.playingAlone) scheduler.kill()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    //re-attach listener if left, right or error have changed
    window.addEventListener('keydown', onKeyPress)
    // Specify how to clean up after this effect:
    return () => {
      window.removeEventListener('keydown', onKeyPress)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, right, error])

  useEffect(() => {
    if (context.playingAlone) scheduler.ensureSamples(emojiArray(left + right))

    try {
      if (context.playingAlone) {
        //todo: use s single parser
        parsedGrammar = parser.parse(left + right)
      } else {
        //use charlie's parser
        const sounds = emojiArray(left + right)
          .map((c) => (c.codePointAt(0) < 128 ? c : `[${emoji_ids[c]}]`))
          .join('')

        Pattern(sounds)
      }

      setError(false)
    } catch (error) {
      setError(true)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, right])

  const onFullScreenChange = () => {
    setExpanded(isFullScreen())
  }

  const isFullScreen = () => {
    const fse =
      document.fullscreenElement ||
      document.mozFullScreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    return fse !== undefined
  }

  const onExpandClick = (e) => {
    const el = document.documentElement
    const rfs =
      el.requestFullscreen ||
      el.webkitRequestFullScreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen
    const cfs =
      document.exitFullscreen ||
      document.mozCancelFullScreen ||
      document.webkitExitFullscreen ||
      document.msExitFullscreen

    e.preventDefault()
    e.stopPropagation()
    if (isFullScreen()) cfs.call(document)
    else rfs.call(el)
  }

  const addEmoji = (e) => {
    setLeft((l) => l + (!e.custom ? e.native : e.name))
  }

  const onCommitClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    commit()
  }

  const onKeyPress = (e) => {
    //todo: implement copy/paste
    if (e.ctrlKey /* || e.altKey || e.metaKey || e.shiftKey   || e.repeat*/)
      return

    const c = e.key.toLowerCase()

    if (c.length === 1 && c >= 'a' && c <= 'z') {
      const i = c.charCodeAt(0) - 'a'.charCodeAt(0)
      setLeft((l) => l + alphaEmoji[i])
    } else if (customEmojis.map((e) => e.name).includes(e.key)) {
      e.preventDefault()
      setLeft((l) => l + e.key)
    } else if (c === 'arrowleft') {
      onLeftClick(e)
    } else if (c === 'arrowright') {
      onRightClick(e)
    } else if (c === 'backspace') {
      onBackspaceClick(e)
    } else if (c === 'delete') {
      e.preventDefault()
      if (right.length > 0) {
        const r = emojiArray(right)
        r.shift()
        setRight(r.join(''))
      }
    } else if (c === 'enter') {
      onCommitClick(e)
    } else if (c === 'home') {
      e.preventDefault()
      setLeft('')
      setRight(left + right)
    } else if (c === 'end') {
      e.preventDefault()
      setLeft(left + right)
      setRight('')
    } else if (c === 'tab') {
      onRandomClick(e)
    }
  }

  const onRandomClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setLeft(randomPattern())
    setRight('')
  }

  const onBackspaceClick = (e) => {
    e.preventDefault()
    if (left.length > 0) {
      let l = emojiArray(left)
      l.pop()
      setLeft(l.join(''))
    }
  }

  //todo: make this work on mobile
  const onBackspaceDown = (e) => {
    backspaceOn = Date.now()
  }

  const onBackspaceUp = (e) => {
    const delta = Date.now() - backspaceOn
    if (delta > 700) {
      setLeft('')
      setRight('')
    }
  }

  const onLeftClick = (e) => {
    e.preventDefault()
    if (left.length > 0) {
      let l = emojiArray(left)
      const c = l.pop()
      setLeft(l.join(''))
      setRight(c + right)
    }
  }

  const onRightClick = (e) => {
    e.preventDefault()
    if (right.length > 0) {
      let r = emojiArray(right)
      const c = r.shift()
      setLeft(left + c)
      setRight(r.join(''))
    }
  }

  const moveCarret = (isLeft, index) => {
    const l = emojiArray(left)
    const r = emojiArray(right)
    const all = l.concat(r)

    if (!isLeft) index += l.length

    setLeft(all.slice(0, index).join(''))
    setRight(all.slice(index).join(''))
  }

  const onHideInstructionsClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    set('showInstructions', false)
    setShowInstructions(false)
  }

  const onToggleHelpClick = (e) => {
    e.preventDefault()
    set('showInstructions', !showInstructions)
    setShowInstructions(!showInstructions)
  }

  const commit = () => {
    if (error) return

    const p = left + right
    set('pattern', p)
    //fixme: what is this for???
    setPrevPattern(p)

    setHighlighted(true)
    setTimeout(() => setHighlighted(false), 300)

    if (context.playingAlone) {
      scheduler.play(parsedGrammar)
    } else {
      context.sendPattern(p)
    }
  }

  const onStopClick = (e) => {
    e.preventDefault()
    setPrevPattern('')
    scheduler.stop()
  }

  const canStop = () => context.playingAlone && prevPattern === left + right

  //todo: decide which emojis to show
  const emojisToShowFilter = (e) => {
    const emoji = emojiIndex.emojis[e.short_names[0]]
    return emoji && alphaEmoji.includes(emoji.native)
  }

  // <Helmet htmlAttributes={{class:(expanded ? 'full-screen':'normal') }} />
  return (
    <div className="play">
      {context.playingAlone && <Canvas />}
      {showInstructions && (
        <div className="instructions" aria-hidden="true">
          {context.playingAlone ? null : (
            <div className="welcome">
              <img alt="" src={context.avatarUrl} width={90} />
              <p>
                {t('Hi')} {context.nick}.<br />
                {t('You joined')} {context.channel}.<br />
                <em>
                  (
                  <a href="/" onClick={context.toggleConfiguring}>
                    {t('change')}
                  </a>
                  )
                </em>
              </p>
            </div>
          )}
          <h4>{t('Instructions')}:</h4>
          <ul>
            <li>
              {t('Role a')}{' '}
              <a className="dice-btn" href="/" onClick={onRandomClick}>
                <span role="img" aria-label="dice">
                  🎲
                </span>
              </a>{' '}
              {isDesktop && <>[TAB] </>}.
            </li>
            <li>
              {t('Play')}{' '}
              <a className="play-btn" href="/" onClick={onCommitClick}>
                <FaPlay />
              </a>{' '}
              {isDesktop && <>[ENTER] </>}.
            </li>
            <li>
              {t('Go full screen')}{' '}
              <FaExpand className="fullscreen-btn" onClick={onExpandClick} />
            </li>
            {false && context.playingAlone ? (
              <li>Tap screen to set tempo</li>
            ) : null}
            {isDesktop && (
              <li>
                {t('Magical keyboard!')} ( A={alphaEmoji[0]}, B={alphaEmoji[1]},{' '}
                {t('so on')})
              </li>
            )}
            <li>
              {t('Got it? Then')}{' '}
              <a href="/" onClick={onHideInstructionsClick}>
                {t('hide this')}
              </a>
            </li>
          </ul>
        </div>
      )}
      <a className="expand" href="/" onClick={onExpandClick}>
        <FaExpand />
        <FaCompress />
      </a>
      <FaQuestionCircle className="help" onClick={onToggleHelpClick} />
      <div className={`${error ? 'error' : ''} input`}>
        <span className="clipper" role="img" aria-label="doubt">
          🤔
        </span>
        <pre
          className={`${highlighted ? 'highlight' : ''} preview`}
          aria-hidden="true"
        >
          {emojiArray(left).map((e, i) => (
            <span
              key={i}
              onClick={() => moveCarret(true, i)}
              aria-hidden="true"
            >
              {e}
            </span>
          ))}
          <span className="carret"></span>
          {emojiArray(right).map((e, i) => (
            <span
              key={i}
              onClick={() => moveCarret(false, i)}
              aria-hidden="true"
            >
              {e}
            </span>
          ))}
        </pre>
        <nav>
          <FaCaretLeft onClick={onLeftClick} />
          <FaCaretRight onClick={onRightClick} />
          <FaBackspace
            onClick={onBackspaceClick}
            onTouchStart={onBackspaceDown}
            onTouchEnd={onBackspaceUp}
            onMouseDown={onBackspaceDown}
            onMouseUp={onBackspaceUp}
          />
          <FaDice onClick={onRandomClick} />
          {canStop() ? (
            <FaStop onClick={onStopClick} />
          ) : (
            <FaPlay className="commit-btn" onClick={onCommitClick} />
          )}
        </nav>
      </div>
      <Picker data={data} onEmojiSelect={addEmoji} />
    </div>
  )
}

export default Playground
