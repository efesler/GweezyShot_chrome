chrome.extension.onMessage.addListener (request, sender, sendResponse) ->
  console.log ("M: " + request.msg + "T: " + request.type)
  switch request.type
    when "snapshot"
      capture sender.tab.id, request.dimensions
      console.log "test"

  sendResponse({})

  send = (request) ->
    chrome.tabs.sendMessage sender.tab.id, request, (response) ->


chrome.extension.onRequest.addListener (request, sender, callback) ->
  console.log ("M: " + request.msg + "T: " + request.type)
  if (request.msg == 'capturePage')
    console.log "Capture Page"
    capturePage(request, sender, callback)
  else
    console.error('Unknown message received from content script: ' + request.msg)



chrome.browserAction.onClicked.addListener () ->
  chrome.tabs.getSelected null, (tab) ->
    openGweezyShot(tab);


# Do the screenshots using the chrome.tabs API - chrome.tabs.captureVisibleTab
openGweezyShot = (tab) ->
  chrome.tabs.captureVisibleTab null, {format: "png"}, (data) ->

    # TODO Play sound

    chrome.storage.local.set( {"screenshot":  data})
    console.log("img: " + data)



updateCookie = (url) ->
  chrome.cookies.set
    "url":url,
    "name":"newpage",
    "value": ""+Math.floor((Math.random()*1000000)+1)

screenshot = {}

capturePage = (data, sender, callback) ->
  console.log "capturePage: " + data.x
  # Get window.devicePixelRatio from the page, not the popup
  scale = if data.devicePixelRatio && data.devicePixelRatio != 1 then 1 / data.devicePixelRatio else 1

  if (!screenshot.canvas)
    canvas = document.createElement('canvas')
    canvas.width = data.totalWidth
    canvas.height = data.totalHeight
    screenshot.canvas = canvas
    screenshot.ctx = canvas.getContext('2d')

    # Scale to account for device pixel ratios greater than one. (On a
    # MacBook Pro with Retina display, window.devicePixelRatio = 2.)
    if (scale != 1)
      # TODO - create option to not scale? It's not clear if it's
      # better to scale down the image or to just draw it twice
      # as large.
      screenshot.ctx.scale(scale, scale)

  # if the canvas is scaled, then x- and y-positions have to make
  # up for it in the opposite direction
  if (scale != 1)
    data.x = data.x / scale
    data.y = data.y / scale

  chrome.tabs.captureVisibleTab null, {format: 'png', quality: 100}, (dataURI) ->
    if (dataURI)
      image = new Image()
      image.onload = () ->
        screenshot.ctx.drawImage(image, data.x, data.y)
        callback(true)

      image.src = dataURI



capture = (tabId, dimensions) ->
  console.log ("capture")

  dataUrl = screenshot.canvas.toDataURL()
  if (!canvas)
    canvas = document.createElement("canvas")
    document.body.appendChild(canvas);

  image = new Image()
  image.onload = () ->
    console.log ("creating new image: " + window.devicePixelRatio )
    canvas.width = dimensions.width
    canvas.height = dimensions.height
    context = canvas.getContext("2d")
    context.drawImage(image,
      dimensions.left, dimensions.top,
      dimensions.width, dimensions.height,
      0, 0,
      dimensions.width, dimensions.height)

    # context.scale(1/window.devicePixelRatio, 1/window.devicePixelRatio)
    croppedDataUrl = canvas.toDataURL("image/png");

    # Notify content script
    chrome.tabs.sendMessage tabId, { type: "export_done"}, () ->

    # Open save popup
    chrome.tabs.sendMessage tabId, { type: "Gweezy_exportData", data: croppedDataUrl}


  image.src = dataUrl




