var matrix = {};

matrix.dot = function (a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];
    var out;
    if (b.length == 3) {
        var b0 = b[0],
            b1 = b[1],
            b2 = b[2];

        out = new Float32Array(3);
        out[0] = a00 * b0 + a01 * b1 + a02 * b2;
        out[1] = a10 * b0 + a11 * b1 + a12 * b2;
        out[2] = a20 * b0 + a21 * b1 + a22 * b2;
    } else if (b.length == 9) {
        var b00 = b[0], b01 = b[1], b02 = b[2],
            b10 = b[3], b11 = b[4], b12 = b[5],
            b20 = b[6], b21 = b[7], b22 = b[8];
        out = new Float32Array(9);

        out[0] = a00 * b00 + a01 * b10 + a02 * b20;
        out[1] = a00 * b01 + a01 * b11 + a02 * b21;
        out[2] = a00 * b02 + a01 * b12 + a02 * b22;

        out[3] = a10 * b00 + a11 * b10 + a12 * b20;
        out[4] = a10 * b01 + a11 * b11 + a12 * b21;
        out[5] = a10 * b02 + a11 * b12 + a12 * b22;

        out[6] = a20 * b00 + a21 * b10 + a22 * b20;
        out[7] = a20 * b01 + a21 * b11 + a22 * b21;
        out[8] = a20 * b02 + a21 * b12 + a22 * b22;
    }
    return out;
};

matrix.transpose = function (a) {
    return new Float32Array([
        a[0], a[3], a[6],
        a[1], a[4], a[7],
        a[2], a[5], a[8]
    ]);
};

matrix.ones = function () {
    return new Float32Array([
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
    ]);
};

matrix.rect_to_rect = function (rect0, rect1) {
    var scale_x = (rect1[1][0] - rect1[0][0]) / (rect0[1][0] - rect0[0][0]);
    var scale_y = (rect1[1][1] - rect1[0][1]) / (rect0[1][1] - rect0[0][1]);
    return new Float32Array([
        scale_x, 0, rect1[0][0] - rect0[0][0] * scale_x,
        0, scale_y, rect1[0][1] - rect0[0][1] * scale_y,
        0, 0, 1]);
};

matrix.invert_y_in_range = function (from_y, to_y) {
    var matrix = new Float32Array(9);
    matrix[0] = 1;
    matrix[4] = -1;
    matrix[5] = from_y + to_y;
    matrix[8] = 1;
    return matrix;
};

matrix.rotation_2d = function (alpha) {
    return new Float32Array([
        Math.cos(alpha), -Math.sin(alpha), 0,
        Math.sin(alpha), Math.cos(alpha), 0,
        0, 0, 1]);
};

matrix.translation_2d = function (x0, y0) {
    return new Float32Array([
        1, 0, x0,
        0, 1, y0,
        0, 0, 1]);
};

matrix.frustum_2d = function (left, right, near, far) {
    return new Float32Array([
        2 * far / (right - left), (right + left) / (left - right), 0,
        0, (near + far) / (far - near), 2 * far * near / (near - far),
        0, 1, 0]);
};