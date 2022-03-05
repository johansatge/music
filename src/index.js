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
    console.log('@todo handle auth error', error)
  })

function App() {
  return isConnectedToSpotify() ? html`<${Main} />` : html`<${Login} />`
}

function Login() {
  const [authUrl, setAuthUrl] = useState(null)
  useEffect(() => {
    getSpotifyAuthUrlAndStoreVerifier()
      .then(setAuthUrl)
      .catch((error) => {
        console.log('@todo handle auth URL error', error)
      })
  }, [])
  return html`
    <div class="login">
      <h1 class="login-title">Music</h1>
      ${authUrl && html`<a class="login-button" href="${authUrl}">Login on Spotify</a>`}
      <a class="login-github" href="https://github.com/johansatge/music">Made in Antibes with ♥ View source on GitHub</a>
    </div>
  `
}

function Main() {
  const [profile, setProfile] = useState(null)
  const [playlists, setPlaylists] = useState(null)
  useEffect(() => {
    fetchSpotifyProfile().then(setProfile).catch((error) => {
      console.log('@todo handle profile error', error)
    })
  }, [])
  useEffect(() => {
    fetchSpotifyPlaylists().then(setPlaylists).catch((error) => {
      console.log('@todo handle playlists error', error)
    })
  }, [])
  return html `
    <${Topbar} profile=${profile} />
    <div class="main">
      <h2 class="main-title">Playlists</h1>
      ${playlists && html`<${Playlists} playlists=${playlists} />`}
    </div>
    <div class="main-github">
      <a href="https://github.com/johansatge/music">Made in Antibes with ♥ View source on GitHub</a>
    </div>
  `
}

function Topbar(props) {
  return html`
    <div class="topbar">
      <h1 class="topbar-title">Music</h1>
      <div class="topbar-user">
        ${props.profile && `Connected as ${props.profile.display_name}`}
        <button class="topbar-button" onClick=${logoutFromSpotify}>Logout</button>
      </div>
    </div>
  `
}

function Playlists(props) {
  return html`
    <table class="main-table" cellpadding="0" cellspacing="0">
      <tr>
        <th>Name</th>
        <th>Owner</th>
        <th>Tracks</th>
      </tr>
      ${props.playlists.map((playlist) => html`
        <tr>
          <td>
            ${playlist.name}
            <span class="main-table-desc">${playlist.description}</span>
          </td>
          <td>${playlist.owner.display_name}</td>
          <td>${playlist.tracks.total}</td>
        </tr>
      `)}
    </table>
  `
}
