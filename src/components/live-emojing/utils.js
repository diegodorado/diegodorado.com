import Graphemer from 'graphemer'

export const splitter = new Graphemer()

const operators = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '/', '', '[', ']', '(', ')', '<', '>', '{' ,'}' ,'?' ,'@', '~', '!' , '%',' ', ',' ]

//filtering operators that arent supported yet.
export const recentEmojis = operators
  .map( (o,i) => ['','{','}','@','!','%','(', ')', ','].includes(o) ? '':i.toString().padStart(3,'0'))
  .filter( (o) => o !=='' )

export const customEmojis = operators
  .map( (o,i) => {return { name: o, short_names: [i.toString().padStart(3,'0')], imageUrl: `/images/icons/${i.toString().padStart(3,'0')}.svg`}} )
  .filter( (o) => recentEmojis.includes(o.short_names[0]))


export const includeEmojis = ['recent','people','nature','foods','activity','places','objects']

export const i18nEmojis = { search: 'Filter', categories: { recent: 'Nums & Operators' } }

export const emojiArray = (str) => {
  return splitter.splitGraphemes(str)
}


const emojis ='😍👽💅🤡🤪😵😡😠🤬😷🤒🤕🤢🤮🤧😇🤠🤥🤫🤭🧐🤓😈👿👹👺👾🤖💩😺😸😹😻😼😽🙀😿😾🙈🙉🙊💪👈👉👆🖕👇🤞🖖🤘🤙🖐️✋👌👍👎✊👊👋🤟👏👐🙌🤲🙏🤝😀😁😂🤣😃😄😅😆😉😊😋😎😘😗😙😚🙂🤗🤩🤔🤨😐😑😶🙄😏😣😥😮🤐😯😪😫😴😌😛😜😝🤤😒😓😔😕🙃🤑😲🙁😖😞😟😤😢😭😦😧😨😩🤯😬😰😱😳✊👍👆💪🖕🙏💓💔💕💖💗💙💚💛🧡💜🖤🤦💣💥💦💨💫👑💄💍💎🐵🐒🦍🐶🐺🦊🐱🐈🦁🐯🐴🦄🦓🦌🐮🔥💧🔔️🖍🐷🐗🦒🐘🦏🐭🐁🐀🐹🐰🐇🐿️🦔🦇🐻🐨🐼🐾🦃🐔🐓🐣🐤🐥🐦🐧🕊️️️🦅🦆🦉🐸🐊🐢🦎🐍🐲🐉🦕🦖🐳🐋🐬🐟🐠🐡🦈🐙🐚🦀🦐🦑🐌🦋🐛🐜🐝🐞🦗🕷️🕸️🦂💐🌸💮🏵️🌹🥀🌺🌻🌼🌷🌱🌲🌳🌴🌵🌾🌿☘️🍀🍁🍂🍃🍇🍈🍉🍍🍎🍏🍐🍑🍒🍓🥝🍅🥥🥑🍆🥔🥕🌽🌶️🥒🥦🍄🥜🌰🍞🥐🥖🥨🥞🧀🍖🍗🥩🥓🍔🍟🍕🌭🥪🌮🌯🥙🥚🍳🥘🍲🥣🥗🍿🥫🍱🍘🍙🍚🍛🍜🍝🍠🍢🍣🍤🍥🍡🥟🥠🥡🍦🍧🍨🍩🍪🎂🍰🥧🍫🍬🍭🍮🍯🍼🥛☕🍵🍶🍾🍷🍸🍹🍺🍻🥂🥃🥤🔪🏺🎃🎄🎆🎇✨🎈🎉🎊🎋🎍🎎🎏🎐🎑️🚀🛸🛎⏰🕘🌑🌒🌓🌔🌕🌖🌗🌘🌙🌚🌛🌜🌝🌈'


export const alphaEmoji = splitter.splitGraphemes(emojis)

//avoiding that arent supported yet.
const patterns = [
  'a b',
  'a b ~ c',
  'a b a c a b a d',
  'a*x? c',
  '[a*2 a*2?] b',
  'a b*2 c d*4',
  '[a b a c/2]',
  '[ a [a b c d] b [c*2 d*4 ] ]',
  '[ a*4 <b/2 c*2>]',
  '<a b*2 c*4>',
  '<a b*x a*4 c*y>',
//  'a(x,8)',
//  'a(<x y>, 8)',
]

const shuffle = (a) => {
  for (var i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = a[i]
    a[i] = a[j]
    a[j] = t
  }
}

const random = (min,max) => {
  return Math.floor(Math.random()*(max-min))+min
}

export const randomPattern = ()=>{
  let p = patterns[random(0,patterns.length)]
  let r = []
  for(let e of emojis){
    if(e.length>1) r.push(e)
  }
  shuffle(r)
  for (const [i, v] of ['a','b','c','d'].entries()) {
    p = p.split(v).join(r[i])
  }
  for (const i of ['x','y']) {
    p = p.split(i).join(random(2,7))
  }
  return p
}

export const sanitizeEmojiId = (name) =>{
  name = name.replace('-','_').replace('+','plus')
  if(parseInt(name).toString()===name)
    name = 'num'+name
  return name
}
