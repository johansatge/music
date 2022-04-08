import { h } from 'preact'
import htm from 'htm'
import { useState, useEffect } from 'preact/hooks'
import { fetchSpotifyProfile, getSpotifyImage, logoutFromSpotify } from '../spotify.js'

const html = htm.bind(h)

export function Profile() {
  const [profile, setProfile] = useState({
    data: null,
    isLoading: true,
    error: null,
  })
  useEffect(() => {
    fetchSpotifyProfile()
      .then((profile) => {
        setProfile({ data: profile, isLoading: false, error: null })
      })
      .catch((error) => {
        setProfile({ profile: null, isLoading: false, error })
      })
  }, [])
  const imageUrl = getSpotifyImage(profile.data)
  let name = '...'
  let email = '...'
  if (profile.data) {
    name = profile.data.display_name
    email = profile.data.email
  }
  if (profile.error) {
    name = 'Could not load profile'
    email = profile.error.message
  }
  return html`
    <div class="main-profile">
      <img class="main-profile-pic" src="${imageUrl}" />
      <button class="main-profile-logout" onclick=${logoutFromSpotify}>Logout</button>
      <span class="main-profile-name">${name}</span>
      ${email}
    </div>
  `
}
