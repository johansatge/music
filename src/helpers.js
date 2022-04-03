export function downloadJson({ filename, json}) {
  const downloadNode = document.createElement('a')
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
  downloadNode.href = URL.createObjectURL(blob)
  downloadNode.download = filename
  document.body.appendChild(downloadNode)
  downloadNode.click()
  downloadNode.remove()
}

export function getFormattedDate() {
  const date = new Date()
  const formattedDate = []
  formattedDate.push(date.getFullYear())
  formattedDate.push(((date.getMonth() + 1) + '').padStart(2, '0'))
  formattedDate.push((date.getDate() + '').padStart(2, 0))
  return formattedDate.join('-')
}
