// eslint-disable no-console

const path = require('path')
const fsp = require('fs').promises
const http = require('http')
const { networkInterfaces } = require('os')

const serverPort = 8789
const serverPath = path.join(__dirname, 'dist')

module.exports = {
  startLocalServer,
}

async function startLocalServer() {
  try {
    const server = http.createServer()
    server.on('request', onLocalServerRequest)
    server.on('error', onLocalServerError)
    server.listen(serverPort)
    if (server.listening) {
      printLocalIps()
    }
  } catch (error) {
    console.log(`Server could not start: ${error.message}`)
  }
}

async function onLocalServerRequest(request, response) {
  try {
    if (request.method !== 'GET') {
      throw new Error(`Invalid method ${request.method}`)
    }
    const requestPath = getRequestPath(request.url)
    const contents = await fsp.readFile(path.join(serverPath, requestPath))
    response.writeHead(200, {
      'Content-Type': getMimeType(requestPath),
      'Cache-Control': 'no-cache, no-store',
    })
    response.end(contents)
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain' })
    response.end(`An error occurred: ${error.message}\n(${error.stack})`)
  }
}

function getRequestPath(requestUrl) {
  const specialUrls = {
    '/': 'index.html',
  }
  return specialUrls[requestUrl] || requestUrl
}

function getMimeType(requestPath) {
  const types = {
    html: 'text/html',
    css: 'text/css',
    woff: 'font/woff',
    woff2: 'font/woff2',
    js: 'application/javascript',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
  }
  const ext = requestPath.substring(requestPath.lastIndexOf('.') + 1)
  return types[ext] || 'text/plain'
}

function onLocalServerError(error) {
  console.log(`A server error occurred: ${error.message}`)
  process.exitCode = 1
}

function printLocalIps() {
  console.log(`Serving http://localhost:${serverPort}`)
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4') {
        console.log(`Serving http://${net.address}:${serverPort}`)
      }
    }
  }
}
