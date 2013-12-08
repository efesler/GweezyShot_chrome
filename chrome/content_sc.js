/**
 * Created with IntelliJ IDEA.
 * User: eric
 * Date: 04/12/13
 * Time: 19:46
 * To change this template use File | Settings | File Templates.
 */


console.log("listen to gweezy");
document.addEventListener("Gweezy_plugin_request", function(e) {
    console.log("send message to gweezy");
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent("Gweezy_plugin_present", true,false,
        { version: "0.2.8" });
    document.dispatchEvent(evt);

});

document.addEventListener("Gweezy_export", exportImage, false);

function exportImage() {
    alert("Exporting ...");
}
