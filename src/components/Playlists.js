import { h } from 'preact'
import htm from 'htm'
import { useState, useEffect } from 'preact/hooks'
import {
  getSpotifyUrl,
  getSpotifyImage,
  fetchSpotifyPlaylists,
  fetchSpotifyPlaylist,
} from '../spotify.js'
import { downloadJson, getFormattedDate } from '../helpers.js'

const html = htm.bind(h)

export function Playlists() {
  const [playlists, setPlaylists] = useState({
    list: [],
    isLoading: true,
    error: null,
  })
  const [isCollapsed, setIsCollapsed] = useState(true)
  useEffect(() => {
    fetchSpotifyPlaylists()
      .then((playlists) => {
        setPlaylists({ list: playlists, isLoading: false, error: null })
      }).catch((error) => {
        setPlaylists({ list: [], isLoading: false, error })
      })
  }, [])
  return html`
    <h2 class="main-title" onclick=${() => setIsCollapsed(!isCollapsed)}>
      <span class="main-title-toggle ${isCollapsed ? 'main-title-toggle-collapsed' : ''}"></span>
      Playlists
      <span class="main-title-info">
        ${!playlists.isLoading && !playlists.error ? playlists.list.length : '...' }
      </span>
    </h1>
    <div class="main-section" style="display: ${isCollapsed ? 'none' : 'block'}">
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
            <th>Actions</th>
          </tr>
          ${playlists.list.map((playlist) => html`<${Playlist} playlist=${playlist} />`)}
        </table>
      `}
    </div>
  `
}

function Playlist({ playlist }) {
  const imageUrl = getSpotifyImage(playlist)
  const [exportState, setExportState] = useState({ status: 'idle', exportProgress: 0 })
  const onExportPlaylist = () => {
    if (exportState.status !== 'idle') {
      return
    }
    setExportState({ status: 'exporting', exportProgress: 0 })
    exportPlaylistRecursive({ playlistId: playlist.id, tracks: [] })
  }
  const exportPlaylistRecursive = ({ playlistId, playlistNextUrl, tracks }) => {
    fetchSpotifyPlaylist({ playlistId, playlistNextUrl })
      .then((result) => {
        tracks = [...tracks, ...result.items]
        setExportState({ status: 'exporting', exportProgress: Math.round(tracks.length / playlist.tracks.total * 100) })
        if (result.next) {
          exportPlaylistRecursive({ playlistNextUrl: result.next, tracks })
        } else {
          downloadJson({
            filename: `${getFormattedDate()} ${playlist.name}.json`,
            json: {
              playlist,
              tracks,
            }
          })
          setExportState({ status: 'idle', exportProgress: 0 })
        }
      })
      .catch((error) => {
        // Lazy error handler
        alert(`Could not export playlist: ${error.message}`)
        setExportState({ status: 'idle', exportProgress: 0 })
      })
  }
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
      <td>
        <button
          class="main-table-button"
          style="background: linear-gradient(to right, var(--colorGreen) ${exportState.exportProgress}%, var(--colorText) 0%)"
          disabled=${playlist.tracks.total === 0}
          onclick=${onExportPlaylist}
        >Export</button>
      </td>
    </tr>
  `
}
