(function() {
  var GwConfig, GwController, GwUploader, handleData, hideConnectionError, launch, showConnectionError,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  GwConfig = {
    baseUrl: "http://www.gweezy.com/gweezy/",
    debug: true
  };

  GwUploader = (function() {
    function GwUploader(data) {
      this.data = data;
      this.user = this.getUser();
    }

    GwUploader.prototype.getUser = function() {
      return this.get("users");
    };

    GwUploader.prototype.getProjects = function() {
      return this.get("projects");
    };

    GwUploader.prototype.get = function(ref) {
      var url, xhr;
      url = GwConfig.baseUrl + ref;
      if (GwConfig.debug) {
        console.log("Get " + ref + ": " + url);
      }
      xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.setRequestHeader("Cache-Control", "no-cache");
      xhr.send(null);
      if (xhr.status === 200) {
        if (GwConfig.debug) {
          console.log(xhr.responseText);
        }
        return JSON.parse(xhr.responseText);
      } else {
        return showConnectionError();
      }
    };

    GwUploader.prototype.isLogged = function() {
      return !this.user.nouser;
    };

    GwUploader.prototype.uploadTo = function(project, name, callback) {
      var formData, imgData, imgDataURI;
      imgDataURI = this.data;
      console.log("dataURL: " + imgDataURI.toString());
      imgData = imgDataURI.toString().replace(/data:image\/png;base64,/, '');
      formData = new FormData;
      formData.append("image", imgData);
      formData.append("pid", project);
      formData.append("enc", "b64");
      formData.append("name", name);
      return this.submitForm(formData, callback);
    };

    GwUploader.prototype.submitForm = function(formData, callback) {
      var nb_try, url, xhr;
      url = GwConfig.baseUrl + "pages/fromhtml";
      xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      nb_try = 3;
      xhr.onreadystatechange = function() {
        nb_try--;
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            if (GwConfig.debug) {
              console.log("SUCCEEDED upload");
            }
            return callback(JSON.parse(xhr.responseText));
          } else {
            console.log("FAILED upload: " + xhr.status + " " + xhr.responseText);
            if (nb_try > 0) {
              return this();
            } else {
              return showConnectionError();
            }
          }
        }
      };
      return xhr.send(formData);
    };

    GwUploader.prototype.updateCookie = function() {
      var bgPage;
      bgPage = chrome.extension.getBackgroundPage();
      return bgPage.updateCookie(GwConfig.baseUrl);
    };

    return GwUploader;

  })();

  GwController = (function() {
    var loadingContent, loginContent, selectionWindow, successContent;

    function GwController(uploader) {
      this.uploader = uploader;
      this.bindPostToGweezy = __bind(this.bindPostToGweezy, this);
    }

    selectionWindow = '<div class="screen plugin-screen"> <h1>Your Screen</h1> <form id="__gweezy_form" action="#"> <p> <label for="screenname">Screen\'s name</label> <input id="__gweezy_screenname" class="screenname" name="screenname" class="data" type="text" /> </p> <p> <label for="foldername">Select a folder</label> <span class="data select" > <select id="__gweezy_foldername"> </select> </span> </p> <input type="submit" id="__gweezy_button" value="Add to Gweezy" class= "upload"/> </form> </div>';

    successContent = '<div class="screen content congrats"> <p><strong>Congrats!</strong> The screen was added to your library</p> <a id="__gweezy_link" class="goto"  target="_blank">Go to Gweezy</a> <a id="__gweezy_popup_close" class="close" href="javascript:void(0)">Close</a> </div>';

    loginContent = '<div class="screen login-view login" > <h1>Welcome to Gweezy</h1> <h2>Use <strong>Gweezy</strong> to analyse this page</h2> <form id="__gweezy_login_form" class="login-form"> <ul id="__gweezy_login_errors" style="display: none" class="errors"></ul> <input id="__gweezy_login" type="text" placeholder="Username or Email" name="login" value=""><br> <input id="__gweezy_password" type="password" placeholder="Password" name="password" value=""><br> <input type="submit" value="Log In"> </form> </div>';

    loadingContent = '<div class="screen  loading-content"> <span id="__gweezy_loading_message">Loading ...</span><progress max="100" value="100"></progress> </div>';

    GwController.prototype.displaySelectionWindow = function() {
      hideConnectionError();
      return $("#gweezy-overlay").html(selectionWindow);
    };

    GwController.prototype.displayLoginWindow = function() {
      hideConnectionError();
      return $("#gweezy-overlay").html(loginContent);
    };

    GwController.prototype.displayLoading = function(message) {
      hideConnectionError();
      if (GwConfig.debug) {
        console.log("Display loading");
      }
      $("#gweezy-overlay").html(loadingContent);
      return $("#__gweezy_loading_message").html(message);
    };

    GwController.prototype.fillProjectFolder = function(projects) {
      var projectOptions;
      projectOptions = $("#__gweezy_foldername");
      projectOptions.empty();
      return $.each(projects, function(index, p) {
        return projectOptions.append($("<option></option>").attr("value", p.id).text(p.name));
      });
    };

    GwController.prototype.fillScreenTitle = function() {
      return chrome.tabs.getSelected(function(tab) {
        return $("#__gweezy_screenname").val(tab.title);
      });
    };

    GwController.prototype.doLogin = function(login, password) {
      var login_errors, postUrl, query_string, xhr;
      if (GwConfig.debug) {
        console.log("Do Login for " + login + " with " + password);
      }
      postUrl = GwConfig.baseUrl + "oauth/gweezy";
      xhr = new XMLHttpRequest();
      xhr.open('POST', postUrl, false);
      query_string = 'login=' + encodeURIComponent(login) + "&password=" + encodeURIComponent(password);
      xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xhr.setRequestHeader("Content-length", query_string.length);
      xhr.setRequestHeader("Connection", "close");
      xhr.send(query_string);
      if (xhr.status === 200) {
        if (xhr.responseText === void 0 || xhr.responseText === "") {
          if (GwConfig.debug) {
            console.log("Login succeeded");
          }
          return this.displayProjectDialog();
        } else {
          if (GwConfig.debug) {
            console.log("Login error: " + xhr.responseText);
          }
          login_errors = xhr.responseText;
          return $("#__gweezy_login_errors").html(login_errors).show();
        }
      } else {
        console.log("Login failed");
        return showConnectionError();
      }
    };

    GwController.prototype.bindPostToGweezy = function(uploader) {
      return $("#__gweezy_form").submit((function(_this) {
        return function(e) {
          var name, project;
          e.preventDefault();
          project = $("#__gweezy_foldername").val();
          name = $("#__gweezy_screenname").val();
          console.log("Uploading: " + name + "into " + project);
          _this.displayLoading("Uploading your image ...");
          return uploader.uploadTo(project, name, function(data) {
            var targetUrl;
            if (GwConfig.debug) {
              console.log("Display success");
            }
            uploader.updateCookie();
            targetUrl = GwConfig.baseUrl + "main#" + data.id;
            $("#gweezy-overlay").html(successContent);
            $("#__gweezy_link").attr("href", targetUrl);
            return $("#__gweezy_popup_close").click(function() {
              return window.close();
            });
          });
        };
      })(this));
    };

    GwController.prototype.bindPostLogin = function() {
      return $("#__gweezy_login_form").submit((function(_this) {
        return function(e) {
          e.preventDefault();
          return _this.doLogin($("#__gweezy_login").val(), $("#__gweezy_password").val());
        };
      })(this));
    };

    GwController.prototype.displayProjectDialog = function() {
      var projects;
      if (GwConfig.debug) {
        console.log("Load projects");
      }
      projects = this.uploader.getProjects();
      this.displaySelectionWindow();
      this.fillProjectFolder(projects);
      this.fillScreenTitle();
      return this.bindPostToGweezy(this.uploader);
    };

    return GwController;

  })();

  showConnectionError = function() {
    return $("#__gweezy_error").show("fast");
  };

  hideConnectionError = function() {
    return $("#__gweezy_error").hide();
  };

  launch = function() {
    var format;
    format = {
      format: "png"
    };
    return chrome.tabs.captureVisibleTab(null, format, function(data) {
      console.log("img: " + data);
      return handleData(data);
    });
  };

  handleData = function(data) {
    var controller, uploader;
    uploader = new GwUploader(data);
    controller = new GwController(uploader);
    console.log(uploader.isLogged());
    if (uploader.isLogged()) {
      return controller.displayProjectDialog();
    } else {
      controller.displayLoginWindow();
      return controller.bindPostLogin();
    }
  };

  document.addEventListener('DOMContentLoaded', function() {
    return setTimeout(launch, 100);
  });

}).call(this);
