import { h, render } from 'preact'
import { useState, useCallback, useEffect } from 'preact/hooks'
import htm from 'htm'
import {
  isConnectedToSpotify,
  fetchSpotifyProfile,
  fetchSpotifyPlaylists,
  handleSpotifyAuth,
  getSpotifyAuthUrlAndStoreVerifier,
} from './spotify.js'

const html = htm.bind(h)

handleSpotifyAuth()
  .then(() => {
    render(html`<${App} />`, document.querySelector('[js-root]'))
  })
  .catch((error) => {
    // @todo handle auth error
  })

function App() {
  return isConnectedToSpotify() ? html`<${Main} />` : html`<${Login} />`
}

function Login() {
  const [authUrl, setAuthUrl] = useState(null)
  useEffect(() => {
    getSpotifyAuthUrlAndStoreVerifier()
      .then((url) => {
        setAuthUrl(url)
      })
      .catch((error) => {
        // @todo handle auth URL error
      })
  }, [])
  return html`
    <div>
      ${authUrl && html`<a href="${authUrl}">Login on Spotify</a>`}
    </div>
  `
}

function Main() {
  const [profile, setProfile] = useState(null)
  const [playlists, setPlaylists] = useState(null)
  useEffect(() => {
    fetchSpotifyProfile()
      .then((profile) => {
        setProfile(profile)
      })
      .catch((error) => {
        // @todo handle profile error
      })
  }, [])
  useEffect(() => {
    fetchSpotifyPlaylists()
      .then((playlists) => {
        setPlaylists(playlists)
      })
      .catch((error) => {
        // @todo handle playlist error
      })
  }, [])
  return html `
    <div>
      <h1>Main UI</h1>
      ${profile && html`<${Profile} profile=${profile} />`}
      ${playlists && html`<${Playlists} playlists=${playlists} />`}
    </div>
  `
}

function Profile(props) {
  return html`
    <h2>Profile</h2>
    <pre>${JSON.stringify(props.profile, null, 2)}</pre>
  `
}

function Playlists(props) {
  return html`
    <h2>Playlists</h2>
    <ul>
      ${props.playlists.map((playlist) => html`
        <li>
          ${playlist.name} (${playlist.tracks.total} tracks) (${playlist.owner.display_name})
        </li>
      `)}
    </ul>
  `
}
