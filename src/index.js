import { h, render } from 'preact'
import { useState, useCallback, useEffect } from 'preact/hooks'
import htm from 'htm'
import {
  isConnectedToSpotify,
  fetchSpotifyProfile,
  fetchSpotifyPlaylists,
  fetchSpotifyTopTracks,
  fetchSpotifyTopArtists,
  fetchSpotifyFollowedArtists,
  getSpotifyUrl,
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
      <${Artists} fetchFunction=${fetchSpotifyFollowedArtists} title="Followed Artists" loadingText="Loading followed artists..." />
      <${Artists} fetchFunction=${fetchSpotifyTopArtists} title="Top Artists" loadingText="Loading top artists..." />
      <${TopTracks} />
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

function Topbar({ profile }) {
  return html`
    <div class="topbar">
      <h1 class="topbar-title">
        Music
      </h1>
      <div class="topbar-user">
        ${profile && `Connected as ${profile.display_name}`}
        <button class="topbar-button" onClick=${logoutFromSpotify}>Logout</button>
      </div>
    </div>
  `
}

function Artists({ title, loadingText, fetchFunction }) {
  const [artists, setArtists] = useState({
    list: [],
    isLoading: true,
    error: null,
  })
  useEffect(() => {
    fetchFunction()
      .then((artists) => {
        setArtists({ list: artists, isLoading: false, error: null })
      }).catch((error) => {
        setArtists({ list: [], isLoading: false, error })
      })
  }, [])
  return html`
    <h2 class="main-title">${title}</h1>
    ${artists.isLoading && html`
      <div class="main-loader">${loadingText}</div>
    `}
    ${artists.error && html`
      <div class="main-error">
        An error occurred: ${artists.error.message}
      </div>
    `}
    ${!artists.isLoading && !artists.error && html`
      <table class="main-table" cellpadding="0" cellspacing="0">
        <tr>
          <th></th>
          <th>Name</th>
          <th>Genre</th>
        </tr>
        ${artists.list.map((artist) => html`<${Artist} artist=${artist} />`)}
      </table>
    `}
  `
}

function Artist({ artist }) {
  const image = artist.images.length > 0 ? artist.images[artist.images.length - 1] : null
  const imageUrl = image ? image.url : null
  return html`
    <tr>
      <td class="main-table-img-cell">
        ${imageUrl && html`<img class="main-table-img" src="${imageUrl}" />`}
      </td>
      <td>
        <a href="${getSpotifyUrl(artist)}">${artist.name}</a>
      </td>
      <td>${artist.genres.join(', ')}</td>
    </tr>
  `
}

function TopTracks() {
  const [topTracks, setTopTracks] = useState({
    list: [],
    isLoading: true,
    error: null,
  })
  useEffect(() => {
    fetchSpotifyTopTracks()
      .then((topTracks) => {
        setTopTracks({ list: topTracks, isLoading: false, error: null, })
      }).catch((error) => {
        setTopTracks({ list: [], isLoading: false, error })
      })
  }, [])
  return html`
    <h2 class="main-title">Top Tracks</h1>
    ${topTracks.isLoading && html`
      <div class="main-loader">
        Loading top tracks...
      </div>
    `}
    ${topTracks.error && html`
      <div class="main-error">
        An error occurred: ${topTracks.error.message}
      </div>
    `}
    ${!topTracks.isLoading && !topTracks.error && html`
      <table class="main-table" cellpadding="0" cellspacing="0">
        <tr>
          <th></th>
          <th>Name</th>
          <th>Artist</th>
        </tr>
        ${topTracks.list.map((track) => html`<${Track} track=${track} />`)}
      </table>
    `}
  `
}

function Track({ track }) {
  const image = track.album.images.length > 0 ? track.album.images[track.album.images.length - 1] : null
  const imageUrl = image ? image.url : null
  return html`
    <tr>
      <td class="main-table-img-cell">
        ${imageUrl && html`<img class="main-table-img" src="${imageUrl}" />`}
      </td>
      <td>
        <a href="${getSpotifyUrl(track)}">${track.name}</a>
      </td>
      <td>
        ${track.artists.map((artist) => html`<a href="${getSpotifyUrl(artist)}">${artist.name}</a><br />`)}
      </td>
    </tr>
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
        setPlaylists({ list: playlists, isLoading: false, error: null })
      }).catch((error) => {
        setPlaylists({ list: [], isLoading: false, error })
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
          <th>Public</th>
          <th>Tracks</th>
        </tr>
        ${playlists.list.map((playlist) => html`<${Playlist} playlist=${playlist} />`)}
      </table>
    `}
  `
}

function Playlist({ playlist }) {
  const image = playlist.images.length > 0 ? playlist.images[playlist.images.length - 1] : null
  const imageUrl = image ? image.url : null
  return html`
    <tr>
      <td class="main-table-img-cell">
        ${imageUrl && html`<img class="main-table-img" src="${imageUrl}" />`}
      </td>
      <td>
        <a href="${getSpotifyUrl(playlist)}">${playlist.name}</a>
        <span class="main-table-desc">${playlist.description}</span>
      </td>
      <td>
        <a href="${getSpotifyUrl(playlist.owner)}">
          ${playlist.owner.display_name}
        </a>
      </td>
      <td>${playlist.public ? 'Yes' : 'No'}</td>
      <td>${playlist.tracks.total}</td>
    </tr>
  `
}
