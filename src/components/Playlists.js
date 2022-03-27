import { h } from 'preact'
import htm from 'htm'
import { useState, useEffect } from 'preact/hooks'
import { getSpotifyUrl, getSpotifyImage, fetchSpotifyPlaylists } from '../spotify.js'

const html = htm.bind(h)

export function Playlists() {
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
  const imageUrl = getSpotifyImage(playlist)
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
