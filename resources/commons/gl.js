var DEBUG_FLAG = false;

var gl;

var setupWebGL = function (canvas) {
    var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    var context = null;
    for (var ii = 0; ii < names.length; ++ii) {
        try {
            context = canvas.getContext(names[ii]);
        } catch (e) {
        }
        if (context != null) {
            gl = context;
            if (DEBUG_FLAG) {
                var throwOnGLError = function(err, funcName, args) {
                    alert(WebGLDebugUtils.glEnumToString(err) + " was caused by call to: " + funcName);
                    throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to: " + funcName;
                };

                gl = WebGLDebugUtils.makeDebugContext(gl, throwOnGLError);
            }
            initWebGLValues();
            return true;
        }
    }
    return false;
};

function initWebGLValues() {
    REPEAT_TEXTURE = [[gl.TEXTURE_WRAP_S, gl.REPEAT],
        [gl.TEXTURE_WRAP_T, gl.REPEAT]];
    CLAMP_TO_EDGE_TEXTURE = [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE],
        [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]];
    LINEAR_TEXTURE = [[gl.TEXTURE_MIN_FILTER, gl.LINEAR],
        [gl.TEXTURE_MAG_FILTER, gl.LINEAR]];
    NEAREST_TEXTURE = [[gl.TEXTURE_MIN_FILTER, gl.NEAREST],
        [gl.TEXTURE_MAG_FILTER, gl.NEAREST]];
}

function build_shader(shader_code, shader_type) {
    var shader = gl.createShader(shader_type);
    gl.shaderSource(shader, shader_code);
    gl.compileShader(shader);

    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    } else {
        console.log('Shader compilation failed!');
        var compilationLog = gl.getShaderInfoLog(shader);
        console.log('Shader compiler log: ' + compilationLog);
        alert('Shader compiler log: ' + compilationLog);
        return null;
    }
}


function build_program(vertex_code, fragment_code) {
    var gl_program = gl.createProgram();

    var vertex = build_shader(vertex_code, gl.VERTEX_SHADER);
    if (!vertex) {
        return null;
    }
    gl.attachShader(gl_program, vertex);

    if (fragment_code != null) {
        var fragment = build_shader(fragment_code, gl.FRAGMENT_SHADER);
        if (!fragment) {
            return null;
        }
        gl.attachShader(gl_program, fragment);
    }

    gl.linkProgram(gl_program);

    var success = gl.getProgramParameter(gl_program, gl.LINK_STATUS);
    if (!success) {
        var error_log = gl.getProgramInfoLog(gl_program);
        console.log("Error in program linking: " + error_log);
        alert("Error in program linking: " + error_log);
        return null;
    }

    gl.detachShader(gl_program, vertex);
    if (fragment_code != null) {
        gl.detachShader(gl_program, fragment);
    }
    return gl_program;
}


function VertexBufferObject(target) {
    this.target = target || gl.ARRAY_BUFFER;
    this.handle = gl.createBuffer();
}

VertexBufferObject.prototype.bind = function () {
    gl.bindBuffer(this.target, this.handle);
};

VertexBufferObject.prototype.unbind = function () {
    gl.bindBuffer(this.target, null);
};


function Framebuffer() {
    this.handle = gl.createFramebuffer();
}

Framebuffer.prototype.bind = function() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.handle);
};

Framebuffer.prototype.unbind = function () {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

var REPEAT_TEXTURE;

var CLAMP_TO_EDGE_TEXTURE;

var LINEAR_TEXTURE;

var NEAREST_TEXTURE;

var next_texture_slot = 1;
function Texture(target) {
    this.target = target;
    this.slot = next_texture_slot;
    next_texture_slot += 1;
    this.handle = gl.createTexture();
    this.bind();
    gl.bindTexture(this.target, this.handle);
}

Texture.prototype.bind = function() {
    gl.activeTexture(gl.TEXTURE0 + this.slot);
};

Texture.prototype.unbind = function() {
    gl.activeTexture(gl.TEXTURE0);
};

Texture.prototype.set_params = function(params) {
    for (var i = 0; i < params.length; i++) {
        var key = params[i][0];
        var value = params[i][1];
        if (value === parseInt(value, 10)) {
            gl.texParameteri(this.target, key, value);
        } else if (value === parseFloat(value)) {
            gl.texParameterf(this.target, key, value);
        } else {
            log("No glTexParameter for key = " + key + " value = " + value);
        }
    }
};