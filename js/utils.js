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
        if (client.readyState === XMLHttpRequest.DONE) {
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