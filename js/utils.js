Array.prototype.subarray = function(start, end) {
    if(!end) {
        end = -1;
    }
    return this.slice(start, this.length + 1 - (end * -1));
};

function loadarray(path, parse, skip = 0) {
    var client = new XMLHttpRequest();
    var data = undefined;
    client.open('GET', path, false);
    client.onreadystatechange = function() {
        if (client.readyState === XMLHttpRequest.DONE && client.status === 200) {
            var lines = client.responseText.split('\n');
            lines = lines.subarray(skip, -2);
            data = [];
            for (var i = 0; i < lines.length; i++) {
                var coords = lines[i].split(' ');
                data.push([]);
                for (var j = 0; j < coords.length; j++) {
                    data[i].push(parse(coords[j]));
                }
            }
        }
    };
    try {
        client.send();
    } catch (e) {
    }

    return data;
}

function loadtext(path) {
    var client = new XMLHttpRequest();
    var data = undefined;
    client.open('GET', path, false);
    client.onreadystatechange = function() {
        if (client.readyState === XMLHttpRequest.DONE && client.status === 200) {
            data = client.responseText;
        }
    };
    try {
        client.send();
    } catch (e) { }

    return data;
}

function loadbytearray(path, callback, tag=null) {
    if (tag != null) {
        log('Loading "' + tag + '" ...');
    }
    var client = new XMLHttpRequest();
    client.open('GET', path, true);
    client.responseType = 'arraybuffer';
    var array = undefined;

    client.onloadend = function() {
        var arrayBuffer = client.response;
        if (arrayBuffer) {
            if (tag != null) {
                log('"' + tag + '" loaded');
            }
            callback(new Uint8Array(arrayBuffer));
        }
    };
    client.send();
}

function rainbow(numOfSteps, step) {
    // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
    // Adam Cole, 2011-Sept-14
    // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
    var r, g, b;
    var h = step / numOfSteps;
    var i = ~~(h * 6);
    var f = h * 6 - i;
    var q = 1 - f;
    switch(i % 6){
        case 0: r = 1; g = f; b = 0; break;
        case 1: r = q; g = 1; b = 0; break;
        case 2: r = 0; g = 1; b = f; break;
        case 3: r = 0; g = q; b = 1; break;
        case 4: r = f; g = 0; b = 1; break;
        case 5: r = 1; g = 0; b = q; break;
    }
    var c = "" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
    return parseInt(c, 16);
}

function unique(arr) {
    var u = {}, a = [];
    for(var i = 0, l = arr.length; i < l; ++i){
        if(!u.hasOwnProperty(arr[i])) {
            a.push(arr[i]);
            u[arr[i]] = 1;
        }
    }
    return a;
}

function log(message) {
    document.getElementById('logs').innerText += message + '\n';
}

function clear_logs() {
    document.getElementById('logs').innerText = '';
}

function get_yadisk_link(code) {
    let link_1 = 'https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=https://yadi.sk/d/' + code;
    let response = JSON.parse(loadtext(link_1));
    return response.href;
}