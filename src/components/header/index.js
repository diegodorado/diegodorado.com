import React from 'react'
import Link from '../link'
import Brand from './brand'
import LanguagesLinks from './languages-links'
import SocialLinks from './social-links'
import { useTranslation } from 'react-i18next'
import { useLocation } from "@reach/router"

const PLink = ({ to, className, ...rest }) => {
  const location = useLocation()
  const isPartiallyActive = location.pathname.includes(to)
  return (
    <Link to={to} className={`${className} ${isPartiallyActive ? "active" : ""}`} {...rest} />
  )
}

const Header = ({ location }) => {
  const [t] = useTranslation()

  return (
    <header>
      <Brand title="diego dorado" />
      <div className="nav">
        <nav>
          <SocialLinks />
          <LanguagesLinks location={location} />
        </nav>
        <nav className="main">
          <PLink to={`/work`}>{t('Work')}</PLink>|
          <PLink to={`/music`}>{t('Music')}</PLink>|
          <PLink className="labs" to={`/labs`}>
            <i>L</i>
            <i>a</i>
            <i>b</i>
            <i>s</i>
          </PLink>
          |<PLink to={`/bio`}>{t('Bio')}</PLink>
        </nav>
      </div>
    </header>
  )
}

export default Header
