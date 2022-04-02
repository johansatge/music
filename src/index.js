import { h, render } from 'preact'
import htm from 'htm'
import { useState, useEffect } from 'preact/hooks'
import {
  isConnectedToSpotify,
  fetchSpotifyTopArtists,
  fetchSpotifyFollowedArtists,
  handleSpotifyAuth,
  logoutFromSpotify,
} from './spotify.js'
import { Login } from './components/Login.js'
import { Profile } from './components/Profile.js'
import { Artists } from './components/Artists.js'
import { TopTracks } from './components/Tracks.js'
import { Playlists } from './components/Playlists.js'

const html = htm.bind(h)

run()

async function run() {
  try {
    await handleSpotifyAuth()
    render(html`<${App} />`, document.querySelector('[js-root]'))
  } catch (error) {
    console.warn(`Could not setup auth (${error.message})`)
  }
}

function App() {
  return html`
    ${isConnectedToSpotify() && html`<${Main} />` || html`<${Login} />`}
    <div class="footer">
      <a href="https://github.com/johansatge/music">
        Made in Antibes with ♥ View source on GitHub
      </a>
    </div>
  `
}

function Main() {
  return html`
    <div class="topbar">
      <h1 class="topbar-title">
        Music
      </h1>
      <div class="topbar-buttons">
        <button class="topbar-button" onClick=${logoutFromSpotify}>Logout</button>
      </div>
    </div>
    <div class="main">
      <${Profile} />
      <${Artists} fetchFunction=${fetchSpotifyFollowedArtists} title="Followed Artists" loadingText="Loading followed artists..." />
      <${Artists} fetchFunction=${fetchSpotifyTopArtists} title="Top Artists" loadingText="Loading top artists..." />
      <${TopTracks} />
      <${Playlists} />
    </div>
  `
}
