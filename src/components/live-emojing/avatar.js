import React, {useState, useEffect, useContext} from "react"
import {get, set} from './storage'
import LiveEmojingContext from './context.js'

const Avatar = () =>{
  const context = useContext(LiveEmojingContext)
  const [loadingAvatar, setLoadingAvatar] = useState(false)
  const [understandsAvatarClick, setUnderstandsAvatarClick] = useState(false)

  useEffect(()=>{
    const url = get('avatarUrl', '')
    changeAvatarUrl(url)
    const understands = (get('understandsAvatarClick', 'false')==='true')
    setUnderstandsAvatarClick(understands)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const changeAvatarUrl = (url) => {
    // get a random url if none provided
    if(!url){
      const randomId = Math.floor(Math.random()*10000)
      url =`https://api.adorable.io/avatars/200/${randomId}`
    }

    setLoadingAvatar(true)
    const img = new Image()
    img.onload = () => {
      set('avatarUrl', url)
      context.setAvatarUrl(url)
      setLoadingAvatar(false)
    }
    img.src = url
  }

  const onChangeAvatar = (e) => {
    if(loadingAvatar)
      return

    changeAvatarUrl()
    //hides help and save setting
    set('understandsAvatarClick', true)
    setUnderstandsAvatarClick(true)
  }

  return (
    <p><img alt="" width={150} height={150} src={context.avatarUrl} onClick={onChangeAvatar} className={`${ loadingAvatar ? 'loading' : '' } ${(!understandsAvatarClick)?'pulse':''}  avatar`} aria-hidden="true" /></p>
  )

}


export default Avatar
