
generateFileName = () ->
  d = new Date

  date = d.getDate()
  date += '0' if date < 10

  month = d.getMonth()
  month += '0' if month < 10

  hours = d.getHours()
  hours += '0' if hours < 10

  minutes = d.getMinutes()
  minutes += '0' if minutes < 10

  seconds = d.getSeconds()
  seconds += '0' if seconds < 10

  "Gweezy "+d.getFullYear()+"-"+month+"-"+date+" at "+hours+"."+minutes+"."+seconds


notifyGweezy = (msg) ->
  evt = document.createEvent("Events")
  evt.initEvent(msg, false, false)
  document.body.dispatchEvent(evt)


openSaveWindow = (data) ->
  url = data.replace('data:image/jpeg','data:application/octet-stream')
  a = document.createElement('A')
  a.href = url.replace('data:image/jpeg','data:application/octet-stream');
  a.download = generateFileName()+".jpg"
  a.target = "_blank"
  e = document.createEvent('MouseEvents')
  e.initEvent( 'click', true, true )
  a.dispatchEvent(e)


send = (request) ->
  chrome.extension.sendMessage request, (response) ->

max = (nums) ->
  Math.max.apply Math, nums.filter((x) -> x)

positionOf = (el) ->
  offsetTop = - $(window).scrollTop()
  offsetLeft = - $(window).scrollLeft()

  new GwPosition(el.offset().top + offsetTop, el.offset().left + offsetLeft, el.height(), el.width())


exportImage = () ->
  # Retrieve content
  console.log ("exportImage")
  elToExport = $("#toexport")
  dimensions = positionOf(elToExport)

  console.log(dimensions.left + ',' + dimensions.top + ',' + dimensions.height + ',' + dimensions.width)

  # Get the different position and do the capture
  getPositions  () ->
    send { type: "snapshot", dimensions: dimensions}


getPositions = (callback) ->
  body = document.body
  widths = [
    document.documentElement.clientWidth,
    document.body.scrollWidth,
    document.documentElement.scrollWidth,
    document.body.offsetWidth,
    document.documentElement.offsetWidth
  ]
  heights = [
    document.documentElement.clientHeight,
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight
  ]
  fullWidth = max(widths)
  fullHeight = max(heights)
  windowWidth = window.innerWidth
  windowHeight = window.innerHeight
  originalX = window.scrollX
  originalY = window.scrollY
  originalOverflowStyle = document.documentElement.style.overflow
  arrangements = []
  # pad the vertical scrolling to try to deal with
  scrollPad = 200
  yDelta = windowHeight - (windowHeight > scrollPad ? scrollPad : 0)
  xDelta = windowWidth
  yPos = fullHeight - windowHeight

  # During zooming, there can be weird off-by-1 types of things...
  if (fullWidth <= xDelta + 1) then fullWidth = xDelta


  # Disable all scrollbars. We'll restore the scrollbar state when we're done
  # taking the screenshots.
  document.documentElement.style.overflow = 'hidden'

  while (yPos > -yDelta)
    xPos = 0
    while (xPos < fullWidth)
      arrangements.push([xPos, yPos])
      xPos += xDelta

    yPos -= yDelta

  numArrangements = arrangements.length

  cleanUp = () ->
    document.documentElement.style.overflow = originalOverflowStyle
    window.scrollTo(originalX, originalY)

  processArrangement = () ->
    console.log ("processArrangement: " + arrangements.length)
    if (!arrangements.length)
      cleanUp()
      window.scrollTo(0, 0)
      console.log ("callback")
      if (callback) then callback()

      return

    next = arrangements.shift()
    x = next[0]
    y = next[1]

    window.scrollTo(x, y)

    data = {
      msg: 'capturePage',
      x: window.scrollX,
      y: window.scrollY,
      complete: (numArrangements-arrangements.length)/numArrangements,
      totalWidth: fullWidth,
      totalHeight: fullHeight,
      devicePixelRatio: window.devicePixelRatio
    }

    # Need to wait for things to settle
    timeoutCallback = ->
      # In case the below callback never returns, cleanup
      cleanUpTimeout = window.setTimeout(cleanUp, 750)

      chrome.extension.sendRequest data, (captured) ->
        window.clearTimeout(cleanUpTimeout)
        if (captured) then processArrangement() #  Move on to capture next arrangement.
        # If there's an error in popup.js, the response value can be
        # undefined, so cleanup
        else cleanUp()

    window.setTimeout timeoutCallback,100

  processArrangement()



class GwPosition

  constructor: (@top,@left,@height,@width) ->



# Listerner of background script
chrome.runtime.onMessage.addListener (request,sender,sendResponse) ->

  switch request.type
    when "export_done"
      console.log "Export done"
      notifyGweezy("export_done")

    when "Gweezy_exportData"
      console.log "open window"
      openSaveWindow(request.data)

    when "updateCookie"
      updateCookie(request.data)


console.log "listen to gweezy"

document.addEventListener "Gweezy_plugin_request", (e) ->
  console.log "send message to gweezy"
  evt = document.createEvent("CustomEvent")
  evt.initCustomEvent("Gweezy_plugin_present",true,false,{
    version: "0.2.8"
  })
  document.dispatchEvent(evt)

document.addEventListener("Gweezy_export", exportImage, false);
