(function() {
  var capture, capturePage, debug, openGweezyShot, screenshot;

  debug = true;

  chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    var send;
    if (debug) {
      console.log("M: " + request.msg + "T: " + request.type);
    }
    switch (request.type) {
      case "snapshot":
        capture(sender.tab.id, request.dimensions);
    }
    sendResponse({});
    return send = function(request) {
      return chrome.tabs.sendMessage(sender.tab.id, request, function(response) {});
    };
  });

  chrome.extension.onRequest.addListener(function(request, sender, callback) {
    if (debug) {
      console.log("M: " + request.msg);
    }
    if (request.msg === 'capturePage') {
      if (debug) {
        console.log("Capture Page");
      }
      capturePage(request, sender, callback);
    } else {
      console.error('Unknown message received from content script: ' + request.msg);
    }
    return true;
  });

  chrome.browserAction.onClicked.addListener(function() {
    return chrome.tabs.getSelected(null, function(tab) {
      return openGweezyShot(tab);
    });
  });

  openGweezyShot = function(tab) {
    return chrome.tabs.captureVisibleTab(null, {
      format: "png"
    }, function(data) {
      chrome.storage.local.set({
        "screenshot": data
      });
      if (debug) {
        return console.log("img: " + data);
      }
    });
  };

  screenshot = {};

  capturePage = function(data, sender, callback) {
    var canvas, scale;
    if (debug) {
      console.log("capturePage: x=" + data.x + ", y=" + data.y);
    }
    scale = data.devicePixelRatio && data.devicePixelRatio !== 1 ? 1 / data.devicePixelRatio : 1;
    if (debug) {
      console.log("scale: " + scale);
    }
    if (!screenshot.canvas) {
      if (debug) {
        console.log("create a new canvas");
      }
      canvas = document.createElement('canvas');
      canvas.width = data.totalWidth;
      canvas.height = data.totalHeight;
      screenshot.canvas = canvas;
      screenshot.ctx = canvas.getContext('2d');
      if (scale !== 1) {
        screenshot.ctx.scale(scale, scale);
      }
    }
    if (scale !== 1) {
      data.x = data.x / scale;
      data.y = data.y / scale;
    }
    if (debug) {
      console.log("after scale: x=" + data.x + ", y=" + data.y);
    }
    return chrome.tabs.captureVisibleTab(null, {
      format: 'jpeg',
      quality: 80
    }, function(dataURI) {
      var image;
      if (dataURI) {
        image = new Image();
        image.onload = function() {
          screenshot.ctx.drawImage(image, data.x, data.y);
          return callback(true);
        };
        return image.src = dataURI;
      }
    });
  };

  capture = function(tabId, dimensions) {
    var canvas, dataUrl, image;
    if (debug) {
      console.log("capture");
    }
    if (debug) {
      console.log("capture: left=" + dimensions.left + ', top=' + dimensions.top + ', height=' + dimensions.height + ', width=' + dimensions.width);
    }
    dataUrl = screenshot.canvas.toDataURL();
    if (!screenshot.canvasExport) {
      if (debug) {
        console.log("create a new canvas");
      }
      canvas = document.createElement("canvas");
      document.body.appendChild(canvas);
      screenshot.canvasExport = canvas;
    } else {
      canvas = screenshot.canvasExport;
    }
    image = new Image();
    image.onload = function() {
      var context, croppedDataUrl;
      if (debug) {
        console.log("creating new image: " + window.devicePixelRatio);
      }
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      context = canvas.getContext("2d");
      context.drawImage(image, dimensions.left, dimensions.top, dimensions.width, dimensions.height, 0, 0, dimensions.width, dimensions.height);
      croppedDataUrl = canvas.toDataURL("image/png");
      chrome.tabs.sendMessage(tabId, {
        type: "export_done"
      }, function() {});
      return chrome.tabs.sendMessage(tabId, {
        type: "Gweezy_exportData",
        data: croppedDataUrl
      });
    };
    return image.src = dataUrl;
  };

}).call(this);
