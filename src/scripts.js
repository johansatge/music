if (hasTokens()) {
  console.log('@todo show main UI')
} else if (hasAuthCode()) {
  connectAndRefresh()
} else {
  initLoginUi()
}

function initLoginUi() {
  const loginButtonNode = document.querySelector('[js-login-button]')
  getAuthUrl().then(({ authUrl, verifierString }) => {
    loginButtonNode.href = authUrl
    window.localStorage.setItem('mySpotifyVerifier', verifierString)
  })
}

function hasTokens() {
  const raw = window.localStorage.getItem('mySpotifyTokens')
  try {
    const tokens = JSON.parse(raw)
    return tokens && tokens.accessToken ? true : false
  } catch(error) {
    return false
  }
}

function hasAuthCode() {
  const currentUrl = new URL(document.location.href)
  return typeof currentUrl.searchParams.get('code') === 'string'
}

function connectAndRefresh() {
  const currentUrl = new URL(document.location.href)
  const code = currentUrl.searchParams.get('code')
  const verifier = window.localStorage.getItem('mySpotifyVerifier')
  if (code && verifier) {
    window.localStorage.removeItem('mySpotifyVerifier')
    fetchAndStoreAccessToken({ code, verifier })
      .then(() => {
        window.location.href = '/'
      })
      .catch((error) => {
        console.log('Error when fetching access token', error)
      })
  }
}

// https://developer.spotify.com/documentation/general/guides/authorization/code-flow/
function fetchAndStoreAccessToken({ code, verifier }) {
  const body = new URLSearchParams()
  body.set('grant_type', 'authorization_code')
  body.set('code', code)
  body.set('redirect_uri', getRedirectUrl())
  body.set('client_id', window.spotifyClientId)
  body.set('code_verifier', verifier)
  return window.fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
    },
    body: body.toString(),
  })
    .then((response) => response.json())
    .then((json) => {
      const data = {
        accessToken: json.access_token,
        refreshToken: json.refresh_token,
        expires: Date.now() + json.expires_in * 1000
      }
      window.localStorage.setItem('mySpotifyTokens', JSON.stringify(data))
    })
}

async function getAuthUrl() {
  const scope = [
    'user-read-playback-state',
    'user-read-currently-playing',
    'user-read-private',
    'user-follow-read',
    'user-library-read',
    'user-read-playback-position',
    'user-read-email',
    'user-top-read',
    'user-read-recently-played',
    'playlist-read-collaborative',
    'playlist-read-private',
  ]
  const verifierString = generateRandomString();
  const challengeString = await challengeFromVerifier(verifierString)
  const queryParams = new URLSearchParams()
  queryParams.set('client_id', window.spotifyClientId)
  queryParams.set('response_type', 'code')
  queryParams.set('redirect_uri', getRedirectUrl())
  queryParams.set('scope', scope.join(' '))
  queryParams.set('show_dialog', 'false')
  queryParams.set('code_challenge_method', 'S256')
  queryParams.set('code_challenge', challengeString)

  return {
    authUrl: `https://accounts.spotify.com/authorize?${queryParams.toString()}`,
    verifierString,
  }
}

function getRedirectUrl() {
  const currentUrl = new URL(document.location.href)
  return `${currentUrl.protocol}//${currentUrl.host}`
}

// https://stackoverflow.com/a/63336562
function generateRandomString() {
  const dec2hex = (dec) => ('0' + dec.toString(16)).substr(-2)
  const array = new Uint32Array(56/2)
  window.crypto.getRandomValues(array)
  return Array.from(array, dec2hex).join('')
}

async function challengeFromVerifier(v) {
  const sha256 = (plain) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    return window.crypto.subtle.digest('SHA-256', data)
  }
  const hashed = await sha256(v)
  let base64encoded = ''
  const bytes = new Uint8Array(hashed)
  for (let index = 0; index < bytes.byteLength; index += 1) {
    base64encoded += String.fromCharCode(bytes[index])
  }
  return btoa(base64encoded).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
