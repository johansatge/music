import { h } from 'preact'
import htm from 'htm'
import { useState, useEffect } from 'preact/hooks'
import { fetchSpotifyProfile, getSpotifyImage } from '../spotify.js'

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
  return html`
    <div class="main-profile">
      <img class="main-profile-pic" src="${imageUrl}" />
      <span class="main-profile-name">${profile.data ? profile.data.display_name : '...'}</span>
      ${profile.data ? profile.data.email : '...'}<br />
    </div>
  `
}
