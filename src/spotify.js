const spotifyClientId = __SPOTIFY_CLIENT_ID__
const localStorageTokens = 'musicTokens'
const localStorageVerifier = 'musicVerifier'
const apiScopes = [
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

export function getSpotifyUrl(resource) {
  return resource.external_urls.spotify ? resource.external_urls.spotify : '#'
}

export function getSpotifyImage(resource) {
  // Always return smallest image for now
  const image = resource.images.length > 0 ? resource.images[resource.images.length - 1] : null
  return image ? image.url : null
}

export async function fetchSpotifyFollowedArtists() {
  let artists = []
  const limit = 50
  let offset = 0
  let json = null
  do {
    json = await fetchApi({
      endpoint: '/me/following',
      query: { limit, offset, type: 'artist' },
    })
    if (json.artists.items) {
      artists = [...artists, ...json.artists.items]
    }
    offset += json.artists.items.length
  } while(json.artists.next)
  return artists
}

export async function fetchSpotifyTopArtists() {
  const json = await fetchApi({
    endpoint: '/me/top/artists',
    query: {
      limit: 10,
      offset: 0,
    },
  })
  return json.items || []
}

export async function fetchSpotifyTopTracks() {
  const json = await fetchApi({
    endpoint: '/me/top/tracks',
    query: {
      limit: 10,
      offset: 0,
    },
  })
  return json.items || []
}

export async function fetchSpotifyPlaylists() {
  let playlists = []
  const limit = 50
  let offset = 0
  let json = null
  do {
    json = await fetchApi({
      endpoint: '/me/playlists',
      query: { limit, offset },
    })
    if (json.items) {
      playlists = [...playlists, ...json.items]
    }
    offset += json.items.length
  } while(json.next)
  return playlists
}

export async function fetchSpotifyProfile() {
  return fetchApi({ endpoint: '/me' })
}


export function isConnectedToSpotify() {
  return getTokensFromStorage() ? true : false
}

export async function handleSpotifyAuth() {
  const currentUrl = new URL(document.location.href)
  const code = currentUrl.searchParams.get('code')
  if (typeof code !== 'string' || code.length === 0) {
    return
  }
  await fetchAndStoreAccessToken({ grantType: 'authorization_code', code })
  window.localStorage.removeItem(localStorageVerifier)
  window.location.href = '/'
}

export function logoutFromSpotify() {
  window.localStorage.removeItem(localStorageTokens)
  window.location.href = '/'
}

function getTokensFromStorage() {
  const raw = window.localStorage.getItem(localStorageTokens)
  try {
    const tokens = JSON.parse(raw)
    return tokens && tokens.accessToken ? tokens : null
  } catch(error) {
    return null
  }
}

async function fetchApi({ endpoint, query = {} }) {
  const accessToken = await getFreshAccessToken()
  const urlSearchParams = new URLSearchParams()
  for(const [key, value] of Object.entries(query)) {
    urlSearchParams.set(key, value)
  }
  const url = `https://api.spotify.com/v1${endpoint}?${urlSearchParams.toString()}`
  const response = await window.fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  const json = await response.json()
  if (json.error) {
    throw new Error(`${json.error.message} (${json.error.status})`)
  }
  return json
}

let freshAccessTokenFetcher = null // Fetch one single access token at a time

async function getFreshAccessToken() {
  const tokens = getTokensFromStorage()
  if (!tokens || !tokens.accessToken) {
    throw new Error('No access token found in storage')
  }
  if (tokens.expires && Date.now() < tokens.expires && tokens.accessToken) {
    return tokens.accessToken
  }
  try {
    if (!freshAccessTokenFetcher) {
      freshAccessTokenFetcher = fetchAndStoreAccessToken({ grantType: 'refresh_token', refreshToken: tokens.refreshToken })
    }
    const accessToken = await freshAccessTokenFetcher
    freshAccessTokenFetcher = null
    return accessToken
  }
  catch(error) {
    freshAccessTokenFetcher = null
    throw error
  }
}

// https://developer.spotify.com/documentation/general/guides/authorization/code-flow/#request-access-token
async function fetchAndStoreAccessToken({ grantType, refreshToken, code }) {
  const body = new URLSearchParams()
  body.set('grant_type', grantType)
  body.set('client_id', spotifyClientId)
  if (grantType === 'authorization_code') {
    body.set('code', code)
    body.set('code_verifier', window.localStorage.getItem(localStorageVerifier))
    body.set('redirect_uri', getRedirectUrl())
  }
  if (grantType === 'refresh_token') {
    body.set('refresh_token', refreshToken)
  }
  const response = await window.fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
    body: body.toString(),
  })
  const json = await response.json()
  if (json.error) {
    throw new Error(`${json.error} (${json.error_description})`)
  }
  const tokens = {
    expires: Date.now() + json.expires_in * 1000,
    accessToken: json.access_token,
    refreshToken: json.refresh_token || refreshToken,
  }
  window.localStorage.setItem(localStorageTokens, JSON.stringify(tokens))
  return tokens.accessToken
}

// https://developer.spotify.com/documentation/general/guides/authorization/code-flow/#request-user-authorization
export async function getSpotifyAuthUrlAndStoreVerifier() {
  const verifier = generateRandomString();
  const challenge = await challengeFromVerifier(verifier)
  const queryParams = new URLSearchParams()
  queryParams.set('client_id', spotifyClientId)
  queryParams.set('response_type', 'code')
  queryParams.set('redirect_uri', getRedirectUrl())
  queryParams.set('scope', apiScopes.join(' '))
  queryParams.set('show_dialog', 'false')
  queryParams.set('code_challenge_method', 'S256')
  queryParams.set('code_challenge', challenge)
  window.localStorage.setItem(localStorageVerifier, verifier)
  return `https://accounts.spotify.com/authorize?${queryParams.toString()}`
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
