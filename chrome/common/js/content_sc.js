(function() {
  var GwPosition, debug, exportImage, generateFileName, getPositions, max, notifyGweezy, openSaveWindow, positionOf, send;

  debug = true;

  generateFileName = function() {
    var d, date, hours, minutes, month, seconds;
    d = new Date;
    date = d.getDate();
    if (date < 10) {
      date += '0';
    }
    month = d.getMonth();
    if (month < 10) {
      month += '0';
    }
    hours = d.getHours();
    if (hours < 10) {
      hours += '0';
    }
    minutes = d.getMinutes();
    if (minutes < 10) {
      minutes += '0';
    }
    seconds = d.getSeconds();
    if (seconds < 10) {
      seconds += '0';
    }
    return "Gweezy " + d.getFullYear() + "-" + month + "-" + date + " at " + hours + "." + minutes + "." + seconds;
  };

  notifyGweezy = function(msg) {
    var evt;
    evt = document.createEvent("Events");
    evt.initEvent(msg, false, false);
    return document.body.dispatchEvent(evt);
  };

  openSaveWindow = function(data) {
    var a, e, url;
    url = data.replace('data:image/jpeg', 'data:application/octet-stream');
    a = document.createElement('A');
    a.href = url.replace('data:image/jpeg', 'data:application/octet-stream');
    a.download = generateFileName() + ".jpg";
    a.target = "_blank";
    e = document.createEvent('MouseEvents');
    e.initEvent('click', true, true);
    return a.dispatchEvent(e);
  };

  send = function(request) {
    return chrome.extension.sendMessage(request, function(response) {});
  };

  max = function(nums) {
    return Math.max.apply(Math, nums.filter(function(x) {
      return x;
    }));
  };

  positionOf = function(el) {
    var offsetLeft, offsetTop;
    offsetTop = -$(window).scrollTop();
    offsetLeft = -$(window).scrollLeft();
    return new GwPosition(el.offset().top + offsetTop, el.offset().left + offsetLeft, el.height(), el.width());
  };

  exportImage = function() {
    var dimensions, elToExport;
    if (debug) {
      console.log("exportImage");
    }
    elToExport = $("#toexport");
    dimensions = positionOf(elToExport);
    if (debug) {
      console.log(dimensions.left + ',' + dimensions.top + ',' + dimensions.height + ',' + dimensions.width);
    }
    return getPositions(function() {
      return send({
        type: "snapshot",
        dimensions: dimensions
      });
    });
  };

  getPositions = function(callback) {
    var arrangements, body, cleanUp, fullHeight, fullWidth, heights, numArrangements, originalOverflowStyle, originalX, originalY, processArrangement, scrollPad, widths, windowHeight, windowWidth, xDelta, xPos, yDelta, yPos, _ref;
    body = document.body;
    widths = [document.documentElement.clientWidth, document.body.scrollWidth, document.documentElement.scrollWidth, document.body.offsetWidth, document.documentElement.offsetWidth];
    heights = [document.documentElement.clientHeight, document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight];
    if (debug) {
      console.log("widths: " + widths);
    }
    if (debug) {
      console.log("height: " + heights);
    }
    fullWidth = max(widths);
    fullHeight = max(heights);
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    fullWidth = windowWidth;
    if (debug) {
      console.log("width: " + windowWidth + ", height: " + windowHeight);
    }
    originalX = window.scrollX;
    originalY = window.scrollY;
    originalOverflowStyle = document.documentElement.style.overflow;
    arrangements = [];
    scrollPad = 200;
    yDelta = windowHeight - ((_ref = windowHeight > scrollPad) != null ? _ref : {
      scrollPad: 0
    });
    xDelta = windowWidth;
    yPos = fullHeight - windowHeight;
    if (fullWidth <= xDelta + 1) {
      fullWidth = xDelta;
    }
    document.documentElement.style.overflow = 'hidden';
    while (yPos > -yDelta) {
      xPos = 0;
      while (xPos < fullWidth) {
        arrangements.push([xPos, yPos]);
        xPos += xDelta;
      }
      yPos -= yDelta;
    }
    if (debug) {
      console.log("Arrangements: " + arrangements);
    }
    numArrangements = arrangements.length;
    cleanUp = function() {
      if (debug) {
        console.log("cleanUp");
      }
      document.documentElement.style.overflow = originalOverflowStyle;
      return window.scrollTo(originalX, originalY);
    };
    processArrangement = function() {
      var data, next, timeoutCallback, x, y;
      if (debug) {
        console.log("processArrangement: " + arrangements.length);
      }
      if (!arrangements.length) {
        cleanUp();
        window.scrollTo(0, 0);
        if (debug) {
          console.log("callback");
        }
        if (callback) {
          callback();
        }
        return;
      }
      next = arrangements.shift();
      x = next[0];
      y = next[1];
      window.scrollTo(x, y);
      data = {
        msg: 'capturePage',
        x: window.scrollX,
        y: window.scrollY,
        complete: (numArrangements - arrangements.length) / numArrangements,
        totalWidth: fullWidth,
        totalHeight: fullHeight,
        devicePixelRatio: window.devicePixelRatio
      };
      timeoutCallback = function() {
        var cleanUpTimeout;
        cleanUpTimeout = window.setTimeout(cleanUp, 750);
        return chrome.extension.sendRequest(data, function(captured) {
          if (debug) {
            console.log("back frm background");
          }
          window.clearTimeout(cleanUpTimeout);
          if (captured) {
            return processArrangement();
          } else {
            return cleanUp();
          }
        });
      };
      return window.setTimeout(timeoutCallback, 200);
    };
    return processArrangement();
  };

  GwPosition = (function() {
    function GwPosition(top, left, height, width) {
      this.top = top;
      this.left = left;
      this.height = height;
      this.width = width;
    }

    return GwPosition;

  })();

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.type) {
      case "export_done":
        if (debug) {
          console.log("Export done");
        }
        return notifyGweezy("export_done");
      case "Gweezy_exportData":
        if (debug) {
          console.log("open window");
        }
        return openSaveWindow(request.data);
      case "updateCookie":
        return updateCookie(request.data);
    }
  });

  if (debug) {
    console.log("listen to gweezy");
  }

  document.addEventListener("Gweezy_plugin_request", function(e) {
    var evt;
    if (debug) {
      console.log("send message to gweezy");
    }
    evt = document.createEvent("CustomEvent");
    evt.initCustomEvent("Gweezy_plugin_present", true, false, {
      version: "0.2.9"
    });
    return document.dispatchEvent(evt);
  });

  document.addEventListener("Gweezy_export", exportImage, false);

}).call(this);
