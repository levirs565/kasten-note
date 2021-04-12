function runReloader() {
  const url = "ws://" + window.location.host
  const webSocket = new WebSocket(url)
  
  webSocket.onmessage = function (msg) {
    if (msg.data == window.currentFileName) {
      console.log("Reloading page ...")
      webSocket.close()
      setTimeout(() => {
        window.location.reload()
      }, 100)
    }
  }
}

document.addEventListener("DOMContentLoaded", runReloader, false)
