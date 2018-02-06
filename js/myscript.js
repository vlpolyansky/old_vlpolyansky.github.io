Array.prototype.subarray = function(start, end) {
    if(!end) {
        end = -1;
    }
    return this.slice(start, this.length + 1 - (end * -1));
};


var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
var controls = new THREE.OrbitControls(camera);

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// var geometry = new THREE.BoxGeometry( 1, 1, 1 );
// var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// var cube = new THREE.Mesh( geometry, material );
// scene.add( cube );


camera.position.z = 5;

var client = new XMLHttpRequest();
var data = null;
client.open('GET', 'data/data.txt', false);
client.onreadystatechange = function() {
    if (client.readyState === XMLHttpRequest.DONE) {
        var lines = client.responseText.split('\n');
        lines = lines.subarray(1, -2);
        data = [];
        for (var i = 0; i < lines.length; i++) {
            var coords = lines[i].split(' ');
            data.push([parseFloat(coords[0]), parseFloat(coords[1]), parseFloat(coords[2])]);
        }
    }
};
client.send();

var dotGeometry = new THREE.Geometry();
for (var i = 0; i < data.length; i++) {
    dotGeometry.vertices.push(new THREE.Vector3(data[i][0], data[i][1], data[i][2]));
}
var dotMaterial = new THREE.PointsMaterial( { size: 0.001, color: 0x7fffff, sizeAttenuation: false } );
var dot = new THREE.Points( dotGeometry, dotMaterial );
scene.add( dot );



var animate = function () {
    requestAnimationFrame( animate );

    renderer.render( scene, camera );
};


animate();