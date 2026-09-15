import Fraction from 'fraction.js'
import { sanitizeEmojiId } from './utils'
import * as Tone from 'tone'
import StartAudioContext from 'startaudiocontext'

// FIXME
const emojiIndex = { emojis: {} }
//todo: split this file in smaller modules! please!!
const emojis = Object.values(emojiIndex.emojis).map((e) => e.native)
const emoji_ids = Object.values(emojiIndex.emojis).reduce(
  (o, e) => Object.assign(o, { [e.native]: sanitizeEmojiId(e.id) }),
  {}
)

//todo: move to env file?
const git_raw =
  'https://raw.githubusercontent.com/diegodorado/emoji-samples/master/'
const samples = '0123456789abcdefghijklmnopqrstuvwxyz'.split('')

let players = []
let schedules = []
let glyphs = []
let listingData = null
let samplesLoaded = false

const init = async () => {
  try {
    await StartAudioContext(Tone.context)
    //chain a compressor
    const comp = new Tone.Compressor(-30, 3).toDestination()
    const urls = samples.reduce(
      (o, n) => Object.assign(o, { [n]: `/live-emojing/samples/${n}.wav` }),
      {}
    )
    players = new Tone.Players(urls, () => {
      samplesLoaded = true
    }).connect(comp)
    //Tone.context.latencyHint = 'playback'
    Tone.Transport.start()

    const r = await fetch(`${git_raw}listing.json`)
    listingData = await r.json()
  } catch (e) {
    console.log(e)
  }
}

const kill = () => {
  Tone.context.suspend()
}

const stop = () => {
  Tone.Transport.cancel()
  // this is not working properoly
  for (let eventId of schedules) Tone.Transport.clear(eventId)
  schedules = []
}

const ensureSamples = (arr) => {
  const emojis = Object.values(emojiIndex.emojis)

  for (let c of arr) {
    const e = emojis.filter((e) => e.native === c)
    if (e.length > 0) ensureSample(e[0])
  }
}

// this function ensures each emoji has a unique sound
// it tries to get a short asset for listing.json
const ensureSample = (e) => {
  const id = sanitizeEmojiId(e.id)
  if (listingData !== null) {
    const path = listingData[id]
    if (path && !players.has(id))
      players.add(id, encodeURI(`${git_raw}${path}`))
  }
}

const process_emoji = (params) => {
  const eid = emoji_ids[params.node.value]
  const index = emojis.indexOf(params.node.value) % samples.length
  //choose a remote or local sample
  const sample = players.has(eid) ? eid : samples[index]

  const id = Tone.Transport.scheduleRepeat(
    (time) => {
      if (sample === undefined || Math.random() > params.chance) return
      const p = players.get(sample)
      if (!p.loaded) return
      p.start(time)
      Tone.Draw.schedule(() => {
        glyphs.push({
          life: 1,
          offset: params.offset.valueOf() % 1,
          emoji: params.node.value,
        })
      }, time)
    },
    params.cycle.valueOf(),
    params.offset.valueOf()
  )
  schedules.push(id)
}

const process_group = (params) => {
  const steps = Object.keys(params.node).filter((k) => k !== 'type')
  const stepDur = params.duration.div(steps.length)
  let ss = params.offset
  for (let s of steps) {
    transverse({
      node: params.node[s],
      offset: ss.clone(),
      duration: stepDur.clone(),
      cycle: params.cycle.clone(),
      chance: params.chance,
    })
    ss = ss.add(stepDur)
  }
}

const process_onestep = (params) => {
  const steps = Object.keys(params.node).filter((k) => k !== 'type')
  const stepDur = new Fraction(1, 1)
  let ss = params.offset
  for (let s of steps) {
    transverse({
      node: params.node[s],
      offset: ss.clone(),
      duration: params.duration.clone(),
      cycle: params.cycle.mul(steps.length),
      chance: params.chance,
    })
    ss = ss.add(stepDur)
  }
}

const process_repeat = (params) => {
  let ss = params.offset

  if (params.node.operator === '*') {
    const dur = params.duration.div(params.node.repeatValue.value)
    for (let i = 0; i < params.node.repeatValue.value; i++) {
      transverse({
        node: params.node.value,
        offset: ss.clone(),
        duration: dur,
        cycle: params.cycle.clone(),
        chance: params.chance,
      })
      ss = ss.add(dur)
    }
  } else if (params.node.operator === '/') {
    for (let i = 0; i < params.node.repeatValue.value; i++) {
      transverse({
        node: params.node.value,
        offset: ss.clone(),
        duration: params.duration.clone(),
        cycle: params.cycle.mul(params.node.repeatValue.value),
        chance: params.chance,
      })
    }
  }
}

const process_degrade = (params) => {
  transverse({
    node: params.node.value,
    offset: params.offset,
    duration: params.duration,
    cycle: params.cycle,
    chance: params.chance * 0.5,
  })
}

const transverse = (params) => {
  if (params.node.type === 'group') process_group(params)
  else if (params.node.type === 'onestep') process_onestep(params)
  else if (params.node.type === 'repeat') process_repeat(params)
  else if (params.node.type === 'degrade') process_degrade(params)
  else if (params.node.type === 'emoji') process_emoji(params)
}

const play = (root) => {
  if (!samplesLoaded) return

  stop()
  transverse({
    node: root,
    offset: new Fraction(0),
    duration: new Fraction(1),
    cycle: new Fraction(1),
    chance: 1,
  })
}

export default { init, kill, stop, play, ensureSamples, glyphs }
