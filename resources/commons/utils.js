var golden_ratio_conjugate = 0.618033988749895;
var previous_hue = Math.random();
function next_random_hue() {
    previous_hue += golden_ratio_conjugate;
    previous_hue %= 1;
    return previous_hue;
}

function hsv_to_rgb(h, s, v) {
    var h_i = Math.floor(h*6);
    var f = h*6 - h_i;
    var p = v * (1 - s);
    var q = v * (1 - f*s);
    var t = v * (1 - (1 - f) * s);
    var r, g, b;
    if (h_i == 0) {
        r = v; g = t; b = p;
    } else if (h_i == 1) {
        r = q; g = v; b = p;
    } else if (h_i == 2) {
        r = p; g = v; b = t;
    } else if (h_i == 3) {
        r = p; g = q; b = v;
    } else if (h_i == 4) {
        r = t; g = p; b = v;
    } else if (h_i == 5) {
        r = v; g = p; b = q;
    }
    return [r, g, b];
}