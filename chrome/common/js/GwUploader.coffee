
GwConfig =
  baseUrl: "http://www.gweezy.com/gweezy/"
  debug: true

class GwUploader

  constructor: (@data) ->
    # Load user information
    @user = @getUser()

  getUser: ->
    @get "users"

  getProjects: ->
    @get "projects"

  get: (ref) ->
    url = GwConfig.baseUrl + ref

    console.log("Get " + ref + ": " + url) if GwConfig.debug

    xhr = new XMLHttpRequest()
    xhr.open('GET', url, false)
    xhr.setRequestHeader("Cache-Control", "no-cache")
    xhr.send(null)
    if (xhr.status == 200)
      console.log xhr.responseText if GwConfig.debug
      return JSON.parse(xhr.responseText)
    else
      showConnectionError()



  isLogged: ->
    return !(@user.nouser)

  uploadTo: (project, name, callback) ->
    imgDataURI = @data
    console.log("dataURL: " + imgDataURI.toString())
    imgData = imgDataURI.toString().replace(/data:image\/png;base64,/, '')

    formData = new FormData
    formData.append("image", imgData)
    formData.append("pid", project)
    formData.append("enc", "b64")
    formData.append("name", name)

    @submitForm formData,callback

  submitForm: (formData, callback) ->
    url = GwConfig.baseUrl + "pages/fromhtml"

    xhr = new XMLHttpRequest()
    xhr.open('POST', url, true);

    nb_try = 3

    xhr.onreadystatechange = () ->
      nb_try--;
      if xhr.readyState == 4
        if (xhr.status==200)
          console.log ("SUCCEEDED upload") if GwConfig.debug

          callback JSON.parse xhr.responseText

        else
          console.log "FAILED upload: " + xhr.status + " " + xhr.responseText
          if nb_try > 0
            @()
          else
            showConnectionError();

    xhr.send(formData)


  updateCookie: ->
    bgPage = chrome.extension.getBackgroundPage()
    bgPage.updateCookie(GwConfig.baseUrl)


class GwController

  constructor: (@uploader) ->

  selectionWindow = '
    <div class="screen plugin-screen">
        <h1>Your Screen</h1>
        <form id="__gweezy_form" action="#">
            <p>
                <label for="screenname">Screen\'s name</label>
                <input id="__gweezy_screenname" class="screenname" name="screenname" class="data" type="text" />
            </p>

            <p>
                <label for="foldername">Select a folder</label>
    			<span class="data select" >
				    <select id="__gweezy_foldername">
            </select>
			    </span>
            </p>

            <input type="submit" id="__gweezy_button" value="Add to Gweezy" class= "upload"/>
        </form>
    </div>'

  successContent = '
    <div class="screen content congrats">
      <p><strong>Congrats!</strong> The screen was added to your library</p>
      <a id="__gweezy_link" class="goto"  target="_blank">Go to Gweezy</a>
      <a id="__gweezy_popup_close" class="close" href="javascript:void(0)">Close</a>
    </div>'

  loginContent = '
    <div class="screen login-view login" >
        <h1>Welcome to Gweezy</h1>
        <h2>Use <strong>Gweezy</strong> to analyse this page</h2>
        <form id="__gweezy_login_form" class="login-form">
            <ul id="__gweezy_login_errors" style="display: none" class="errors"></ul>
            <input id="__gweezy_login" type="text" placeholder="Username or Email" name="login" value=""><br>
            <input id="__gweezy_password" type="password" placeholder="Password" name="password" value=""><br>
            <input type="submit" value="Log In">
        </form>
    </div>'

  loadingContent = '
      <div class="screen  loading-content">
          <span id="__gweezy_loading_message">Loading ...</span><progress max="100" value="100"></progress>
      </div>'


  displaySelectionWindow: ->
    hideConnectionError()
    $("#gweezy-overlay").html(selectionWindow)


  displayLoginWindow: ->
    hideConnectionError()
    $("#gweezy-overlay").html(loginContent)

  displayLoading: (message) ->
    hideConnectionError()
    console.log "Display loading" if GwConfig.debug
    $("#gweezy-overlay").html(loadingContent)
    $("#__gweezy_loading_message").html(message)


  fillProjectFolder: (projects) ->
    projectOptions = $("#__gweezy_foldername")
    projectOptions.empty()
    $.each projects, (index, p) ->
      projectOptions.append($("<option></option>").attr("value", p.id).text(p.name))


  fillScreenTitle: ->
    chrome.tabs.getSelected (tab) ->
      # console.log ("tab: " + tab.title)  if GwConfig.debug
      $("#__gweezy_screenname").val(tab.title)


  doLogin: (login, password) ->
    console.log ("Do Login for " + login + " with " + password) if GwConfig.debug
    postUrl = GwConfig.baseUrl + "oauth/gweezy"
    xhr = new XMLHttpRequest()
    xhr.open('POST', postUrl, false)
    query_string = 'login=' + encodeURIComponent(login) + "&password=" + encodeURIComponent(password)

    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
    xhr.setRequestHeader("Content-length", query_string.length)
    xhr.setRequestHeader("Connection", "close")

    xhr.send(query_string)

    if xhr.status == 200
      if xhr.responseText==undefined or xhr.responseText == ""
        # Display dialog
        console.log "Login succeeded" if GwConfig.debug
        @displayProjectDialog()
      else
        # Login errors
        console.log ("Login error: " + xhr.responseText) if GwConfig.debug
        login_errors = xhr.responseText
        $("#__gweezy_login_errors").html(login_errors).show()
    else
        console.log "Login failed"
        showConnectionError()


  bindPostToGweezy: (uploader) =>
    $("#__gweezy_form").submit (e) =>


      e.preventDefault()
      project = $("#__gweezy_foldername").val()
      name = $("#__gweezy_screenname").val()

      console.log "Uploading: " + name + "into " + project
      @displayLoading("Uploading your image ...")

      uploader.uploadTo project,name, (data) ->
        # Success call back
        console.log "Display success" if GwConfig.debug
        uploader.updateCookie()
        targetUrl = GwConfig.baseUrl + "main#" + data.id
        $("#gweezy-overlay").html(successContent)
        $("#__gweezy_link").attr("href", targetUrl )
        $("#__gweezy_popup_close").click () ->
          window.close()


  bindPostLogin: () ->
    $("#__gweezy_login_form").submit (e) =>
      e.preventDefault()
      @doLogin $("#__gweezy_login").val(),$("#__gweezy_password").val()


  displayProjectDialog: () ->
    console.log "Load projects" if GwConfig.debug
    projects = @uploader.getProjects()

    @displaySelectionWindow()
    @fillProjectFolder(projects)
    @fillScreenTitle()
    @bindPostToGweezy(@uploader)

showConnectionError = () ->
  $("#__gweezy_error").show("fast")

hideConnectionError=  () ->
  $("#__gweezy_error").hide()

# Script
launch = () ->

  format = {
    format: "png"
  }
  chrome.tabs.captureVisibleTab null, format, (data) ->

    # TODO Play sound

    console.log("img: " + data);

    handleData data

# Process the image
handleData = (data) ->
  uploader = new GwUploader(data)
  controller  = new GwController(uploader)

  console.log uploader.isLogged()

  if uploader.isLogged()
    # load project
    controller.displayProjectDialog()

  else
    controller.displayLoginWindow()
    controller.bindPostLogin()


# Document listener
document.addEventListener 'DOMContentLoaded', () ->
    setTimeout launch, 100    # This is required to display the popup without waiting to fetch the information




