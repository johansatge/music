import { h } from 'preact'
import htm from 'htm'
import { useState, useEffect } from 'preact/hooks'
import { getSpotifyUrl } from '../spotify.js'

const html = htm.bind(h)

export function Artists({ title, loadingText, fetchFunction }) {
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
      <td>${artist.genres.map((genre) => html`<span class="main-table-tag">${genre}</span>`)}</td>
    </tr>
  `
}
