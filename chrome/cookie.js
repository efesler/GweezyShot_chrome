/**
 * Created with IntelliJ IDEA.
 * User: eric
 * Date: 09/12/13
 * Time: 08:23
 * To change this template use File | Settings | File Templates.
 */
updateCookie = function(url) {
    console.log("update cookie");
    return chrome.cookies.set({
        "url": url,
        "name": "newpage",
        "value": "" + Math.floor((Math.random() * 1000000) + 1)
    });
};