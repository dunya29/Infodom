

document.addEventListener('DOMContentLoaded', function () {
    const videoEl = document.querySelectorAll('.mse-video')
    const mseUrl = document.querySelectorAll('.mse-url')

    videoEl.forEach((vid,idx) => {
            // fix stalled video in safari
            const mseQueue = []
    let mseSourceBuffer
    let mseStreamingStarted = false
  
    function startPlay (videoEl, url) {
      const mse = new MediaSource()
      videoEl.src = window.URL.createObjectURL(mse)
      mse.addEventListener('sourceopen', function () {
        const ws = new WebSocket(url)
        ws.binaryType = 'arraybuffer'
        ws.onopen = function (event) {
          console.log('Connect to ws')
        }
        ws.onmessage = function (event) {
          const data = new Uint8Array(event.data)
          if (data[0] === 9) {
            let mimeCodec
            const decodedArr = data.slice(1)
            if (window.TextDecoder) {
              mimeCodec = new TextDecoder('utf-8').decode(decodedArr)
            } else {
              mimeCodec = Utf8ArrayToStr(decodedArr)
            }
            mseSourceBuffer = mse.addSourceBuffer('video/mp4; codecs="' + mimeCodec + '"')
            mseSourceBuffer.mode = 'segments'
            mseSourceBuffer.addEventListener('updateend', () =>  pushPacket(vid))
          } else {
            readPacket(event.data)
          }
        }
      }, false)
    }
  
    function pushPacket (vid) {
      let packet
  
      if (!mseSourceBuffer.updating) {
        if (mseQueue.length > 0) {
          packet = mseQueue.shift()
          mseSourceBuffer.appendBuffer(packet)
        } else {
          mseStreamingStarted = false
        }
      }
      if (vid.buffered.length > 0) {
        if (typeof document.hidden !== 'undefined' && document.hidden) {
        // no sound, browser paused video without sound in background
          vid.currentTime = vid.buffered.end((vid.buffered.length - 1)) - 0.5
        }
      }
    }
  
    function readPacket (packet) {
      if (!mseStreamingStarted) {
        mseSourceBuffer.appendBuffer(packet)
        mseStreamingStarted = true
        return
      }
      mseQueue.push(packet)
      if (!mseSourceBuffer.updating) {
        pushPacket(vid)
      }
    }
    vid.addEventListener('pause', () => {
        if (vid.currentTime > vid.buffered.end(vid.buffered.length - 1)) {
          vid.currentTime = vid.buffered.end(vid.buffered.length - 1) - 0.1
          vid.play()
        }
    })
    startPlay(vid, mseUrl[idx].value)
    })
})