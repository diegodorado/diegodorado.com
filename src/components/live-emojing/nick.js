/* eslint-disable jsx-a11y/control-has-associated-label */
import React, {useState, useEffect, useContext} from "react"
import {get, set} from './storage'
import LiveEmojingContext from './context'
import randomNick from './random-nicks'
import {useTranslation } from 'react-i18next'

const Nick = () =>{
  const [t, ] = useTranslation();

  const context = useContext(LiveEmojingContext)
  const [valid, setValid] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [understandsNameClick, setUnderstandsNameClick] = useState(false)

  useEffect(()=>{
    const nick = get('nick', randomNick())
    if(nick!==''){
      context.setNick(nick)
      setValid(true)
      setConfirmed(true)
    }

    const understands = (get('understandsNameClick', 'false')==='true')
    setUnderstandsNameClick(understands)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const onChange = (e) => {
    context.setNick(e.target.value)
    setValid(e.target.validity.valid)
  }

  const handleFocus = (event) => event.target.select()

  const onChangeClick = (e) => {
    e.preventDefault()
    setConfirmed(false)
    //hides help and save setting
    set('understandsNameClick', true)
    setUnderstandsNameClick(true)
  }

  const confirm = () => {
    if(valid){
      set('nick', context.nick)
      setConfirmed(true)
    }
  }

  const onKeyPress = (event) => {
    if(event.key === 'Enter'){
      confirm()
    }
  }

  return (
    <p>
      {confirmed?
        (<><em>{t('Hey')}</em> <a href="/" className={(!understandsNameClick)?'pulse':''} onClick={onChangeClick}>{context.nick}</a></>):
        // eslint-disable-next-line jsx-a11y/no-autofocus
        (<input type="text" value={context.nick} onChange={onChange} onBlur={confirm} autoFocus required pattern="^[A-Za-z0-9_-]{3,15}$" onKeyPress={onKeyPress} onFocus={handleFocus} size={15} maxLength={15}/>)
      }
    </p>
  )

}

export default Nick
