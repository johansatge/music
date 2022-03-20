import { h, render } from 'preact'
import { useState, useCallback, useEffect } from 'preact/hooks'
import htm from 'htm'
import {
  isConnectedToSpotify,
  fetchSpotifyProfile,
  fetchSpotifyPlaylists,
  handleSpotifyAuth,
  getSpotifyAuthUrlAndStoreVerifier,
  logoutFromSpotify,
} from './spotify.js'

const html = htm.bind(h)

handleSpotifyAuth()
  .then(() => {
    render(html`<${App} />`, document.querySelector('[js-root]'))
  })
  .catch((error) => {
    console.warn(`Could not setup auth (${error.message})`)
  })

function App() {
  return html`
    ${isConnectedToSpotify() && html`<${Main} />`}
    ${!isConnectedToSpotify() && html`<${Login} />`}
    <${Footer} />
  `
}

function Login() {
  const [authUrl, setAuthUrl] = useState(null)
  useEffect(() => {
    getSpotifyAuthUrlAndStoreVerifier()
      .then(setAuthUrl)
      .catch((error) => {
        console.warn(`Could not setup login (${error.message})`)
      })
  }, [])
  return html`
    <div class="login">
      <h1 class="login-title">Music</h1>
      ${authUrl && html`<a class="login-button" href="${authUrl}">Login on Spotify</a>`}
    </div>
  `
}

function Main() {
  const [profile, setProfile] = useState(null)
  useEffect(() => {
    fetchSpotifyProfile().then(setProfile).catch((error) => {
      // Do nothing on error for now
    })
  }, [])
  return html `
    <${Topbar} profile=${profile} />
    <div class="main">
      <${Playlists} />
    </div>
  `
}

function Footer() {
  return html`
    <div class="footer">
      <a href="https://github.com/johansatge/music">Made in Antibes with ♥ View source on GitHub</a>
    </div>
  `
}

function Topbar(props) {
  return html`
    <div class="topbar">
      <h1 class="topbar-title">
        Music
      </h1>
      <div class="topbar-user">
        ${props.profile && `Connected as ${props.profile.display_name}`}
        <button class="topbar-button" onClick=${logoutFromSpotify}>Logout</button>
      </div>
    </div>
  `
}

function Playlists() {
  const [playlists, setPlaylists] = useState({
    list: [],
    isLoading: true,
    error: null,
  })
  useEffect(() => {
    fetchSpotifyPlaylists()
      .then((playlists) => {
        setPlaylists({
          list: playlists,
          isLoading: false,
          error: null,
        })
      }).catch((error) => {
        setPlaylists({
          list: [],
          isLoading: false,
          error,
        })
      })
  }, [])
  return html`
    <h2 class="main-title">Playlists</h1>
    ${playlists.isLoading && html`
      <div class="main-loader">
        Loading playlists...
      </div>
    `}
    ${playlists.error && html`
      <div class="main-error">
        An error occurred: ${playlists.error.message}
      </div>
    `}
    ${!playlists.isLoading && !playlists.error && html`
      <table class="main-table" cellpadding="0" cellspacing="0">
        <tr>
          <th></th>
          <th>Name</th>
          <th>Owner</th>
          <th>Tracks</th>
        </tr>
        ${playlists.list.map((playlist) => html`<${Playlist} playlist=${playlist} />`)}
      </table>
    `}
  `
}

function Playlist(props) {
  const image = props.playlist.images.length > 0 ? props.playlist.images[props.playlist.images.length - 1] : null
  const imageUrl = image ? image.url : null
  return html`
    <tr>
      <td>
        ${imageUrl && html`<img class="main-table-img" src="${imageUrl}" />`}
      </td>
      <td>
        ${props.playlist.name}
        <span class="main-table-desc">${props.playlist.description}</span>
      </td>
      <td>${props.playlist.owner.display_name}</td>
      <td>${props.playlist.tracks.total}</td>
    </tr>
  `
}
