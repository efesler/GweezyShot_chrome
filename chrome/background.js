chrome.browserAction.onClicked.addListener(function () {
    chrome.tabs.getSelected(null, function (tab) {
        openBugSnap(tab);
    });
});
chrome.commands.onCommand.addListener(function (command) {
    if(command == 'toggle-bugsnap-on') {
        chrome.tabs.getSelected(null, function (tab) {
            openBugSnap(tab);
        });
    }
});

// Do the screenshots using the chrome.tabs API - chrome.tabs.captureVisibleTab
// TODO check login gweezy
// TODO open selection windows for gweezy
// TODO send data
function openBugSnap(tab) {
    chrome.tabs.captureVisibleTab(null, {
        format: "png"
    }, function (data) {
        // TODO Play sound

        chrome.storage.local.set( {"screenshot":  data});
        console.log("img: " + data);
        // Open popup


        chrome.tabs.create({
            index: tab.index + 1,
            url: "common/editor.html"
        }, function (tab) {
            // DOES NOTHING FOR NOW
        });
    });
}

updateCookie = function (url) {
    chrome.cookies.set({
        "url":url,
        "name":"newpage",
        "value": ""+Math.floor((Math.random()*1000000)+1)
    });
}