import { h } from 'preact'
import htm from 'htm'
import { useState, useEffect } from 'preact/hooks'
import { getSpotifyAuthUrlAndStoreVerifier } from '../spotify.js'

const html = htm.bind(h)

export function Login() {
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
