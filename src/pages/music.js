import React from 'react'
import Layout from '../layouts/main'
import { Seo } from '../components/seo'
import { Trans, useTranslation } from 'react-i18next'

const urls = {
  bandcamp: 'https://diegodorado.bandcamp.com/',
  spotify: 'https://open.spotify.com/artist/6TiMRef3nqRA74LKQ810t8',
  apple: 'https://music.apple.com/us/artist/diego-dorado/1495558877',
  amazon:
    'https://www.amazon.com/s?k=Diego+Dorado&i=digital-music&search-type=ss&ref=ntt_srch_drd_B084155L66',
  youtube: 'https://music.youtube.com/channel/UCz6uOhdNUiTAjt1mBzoV-AA',
  deezer: 'https://www.deezer.com/us/artist/83574592',
}
const links = Object.entries(urls).map(([k, v]) => (
  <a href={v} target="_blank" rel="noopener noreferrer">
    {k}
  </a>
))

const colors = 'bgcol=000000/linkcol=ff00ff'

// execute from https://diegodorado.bandcamp.com/
// Array.from(document.getElementsByClassName('music-grid')[0].getElementsByTagName('li')).map(e=>parseInt(e.dataset.itemId.split('-')[1]))
const albums = [
  3457420195, 3644547653, 2587024292, 3583596473, 121085935, 1868484386,
  956909203, 3975334759,
]

const MusicIndex = ({ location }) => {
  const [t] = useTranslation()
  return (
    <Layout location={location}>
      <p className="spacey">
        <Trans i18nKey="MusicIntro" i18nIsDynamicList>
          <span>Listen to the albums produced by Diego Dorado here or on </span>
          <>
            {links.map((l, i) => (
              <span key={i}>
                {l}
                {i < links.length - 2 && ', '}
                {i === links.length - 2 && ` ${t('or')} `}
              </span>
            ))}
          </>
          <span>.</span>
        </Trans>
      </p>
      <MusicPosts />
    </Layout>
  )
}

const MusicPosts = () => {
  return (
    <section className="music posts">
      {albums.map((id) => {
        return (
          <article key={id}>
            <div className="bandcamp">
              <iframe
                title={id}
                src={`https://bandcamp.com/EmbeddedPlayer/album=${id}/size=large/${colors}/transparent=true/`}
                seamless
              ></iframe>
            </div>
          </article>
        )
      })}
      {/*empty articles just to line up the grid*/}
      <article></article>
      <article></article>
      <article></article>
    </section>
  )
}

export default MusicIndex

export const Head = () => <Seo title="music" />
