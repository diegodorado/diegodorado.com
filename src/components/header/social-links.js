import React from "react"
import { FaYoutube, FaSpotify, FaGithub, FaInstagram } from 'react-icons/fa'

const SocialLinks = () => (
  <>
    <a target="_blank" rel="noopener noreferrer" href={`https://youtube.com/diegodorado`}><FaYoutube /></a>
    <a target="_blank" rel="noopener noreferrer" href={`https://open.spotify.com/artist/6TiMRef3nqRA74LKQ810t8`}><FaSpotify /></a>
    <a target="_blank" rel="noopener noreferrer" href={`https://instagram.com/diegdorado/`}><FaInstagram /></a>
    <a target="_blank" rel="noopener noreferrer" href={`https://github.com/diegodorado`}><FaGithub /></a>
  </>
)

export default SocialLinks
