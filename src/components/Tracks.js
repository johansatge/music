import { h } from 'preact'
import htm from 'htm'
import { useState, useEffect } from 'preact/hooks'
import { getSpotifyUrl, getSpotifyImage, fetchSpotifyTopTracks } from '../spotify.js'

const html = htm.bind(h)

export function TopTracks() {
  const [topTracks, setTopTracks] = useState({
    list: [],
    isLoading: true,
    error: null,
  })
  const [isCollapsed, setIsCollapsed] = useState(true)
  useEffect(() => {
    fetchSpotifyTopTracks()
      .then((topTracks) => {
        setTopTracks({ list: topTracks, isLoading: false, error: null, })
      }).catch((error) => {
        setTopTracks({ list: [], isLoading: false, error })
      })
  }, [])
  return html`
    <div class="main-section">
      <h2 class="main-title" onclick=${() => setIsCollapsed(!isCollapsed)}>
        <span class="main-title-toggle ${isCollapsed ? 'main-title-toggle-collapsed' : ''}"></span>
        Top Tracks
        <span class="main-title-info">
          ${!topTracks.isLoading && !topTracks.error ? topTracks.list.length : '...' }
        </span>
      </h1>
      <div style="display: ${isCollapsed ? 'none' : 'block'}">
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
      </div>
    </div>
  `
}

function Track({ track }) {
  const imageUrl = getSpotifyImage(track.album)
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
