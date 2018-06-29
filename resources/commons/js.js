/**
 * Framerate object
 *
 * This object keeps track of framerate and displays it as the innerHTML text of the
 * HTML element with the passed id. Once created you call snapshot at the end
 * of every rendering cycle. Every 500ms the framerate is updated in the HTML element.
 *
 * @from J3DI.js - https://code.google.com/p/webgl-code-storage/source/browse/trunk/samples/SpinningBox/resources/J3DI.js?r=2
 */
Framerate = function (id) {
    this.numFramerates = 4;
    this.framerateUpdateInterval = 500;
    this.id = id;
    this.sourceHtml = document.getElementById(this.id).innerHTML;

    this.renderTime = -1;
    this.framerates = [];
    var self = this;
    var fr = function () {
        self.updateFramerate()
    };
    fr();
    setInterval(fr, this.framerateUpdateInterval);
};

Framerate.prototype.updateFramerate = function () {
    var tot = 0;
    for (var i = 0; i < this.framerates.length; ++i)
        tot += this.framerates[i];

    var framerate = -1;
    if (this.framerates.length != 0) {
        framerate = tot / this.framerates.length;
        framerate = Math.round(framerate);
    }
    document.getElementById(this.id).innerHTML = this.sourceHtml.replace('{FPS}', framerate.toString());
};

Framerate.prototype.snapshot = function () {
    if (this.renderTime < 0) {
        this.renderTime = new Date().getTime();
    } else {
        var newTime = new Date().getTime();
        var t = newTime - this.renderTime;
        if (t == 0)
            return;
        var framerate = 1000 / t;
        this.framerates.push(framerate);
        while (this.framerates.length > this.numFramerates)
            this.framerates.shift();
        this.renderTime = newTime;
    }
};


/**
 * Provides requestAnimationFrame in a cross browser way.
 */
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
            return window.setTimeout(callback, 1000 / 30);
        };
})();

var lastCall = null;

function requestAnimFrameSmart(callback, canvas) {
    var minDelay = 15;

    function callbackWrapper() {
        var time = new Date().getTime();
        var timePassed = time - lastCall;
        if (timePassed < minDelay) {
            while (timePassed < minDelay) {
                time = new Date().getTime();
                timePassed = time - lastCall;
            }
        }
        lastCall = time;
        callback();
    }

    window.requestAnimFrame(callbackWrapper, canvas);
}