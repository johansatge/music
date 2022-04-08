# Music 🎹

Display data and export playlists from a Spotify account.

* [Usage](#usage)
* [Local installation](#local-installation)
* [Build and deployment](#build-and-deployment)

## Usage

- Navigate to https://music.satge.me/
- Login with Spotify

## Local installation

```shell
# Make sure node 16 is installed
node -v
# Clone the project
git clone git@github.com:johansatge/music.git
cd music
# Install dependencies
npm install
# Create env file with a Spotify API key (with "localhost:9898" as allowed URL)
echo "module.exports = { SPOTIFY_CLIENT_ID: 'xxx' }" > .env.js
# Run the local server (will rebuild app on changes)
npm run watch
# Navigate to http://localhost:4000/
```

## Build and deployment

To test the build locally, run:

```shell
npm run build
```

Assets are built in `dist`.

Deployment is handled by [Netlify](https://www.netlify.com/), when pushing updates on `master`.
