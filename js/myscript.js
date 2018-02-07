// Setup

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
var controls = new THREE.OrbitControls(camera);

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

camera.position.z = 5;

var dataFolder = 'data/label6rot/';
var i = undefined;

var properties = JSON.parse(loadtext(dataFolder + 'properties.json'));
var imageSize = properties.imageSize;



// Images
var imagesBinary = undefined;
loadbytearray(dataFolder + 'images.bin', function (data) {
    imagesBinary = data;
});
var labels = loadarray(dataFolder + 'labels.txt', parseInt);


// Points
var data = loadarray(dataFolder + 'points_3d.txt', parseFloat, 1);
function makePointsComponent(data, labels) {
    var uniqueLabels = unique(labels);
    var colors = [];
    var i, j;
    for (i = 0; i < uniqueLabels.length; i++) {
        var c = rainbow(uniqueLabels.length, i);
        c = c | 0x7f7f7f;
        colors.push(new THREE.Color(c));
    }
    var geometry = new THREE.Geometry();
    for (i = 0; i < data.length; i++) {
        geometry.vertices.push(new THREE.Vector3(data[i][0], data[i][1], data[i][2]));
        // var c = new THREE.Color();
        // c.setHSL( Math.random(), 1.0, 0.5 );
        // geometry.colors.push(c);
        for (j = 0; j < uniqueLabels.length; j++) {
            if (labels[i][0] === uniqueLabels[j][0]) {
                geometry.colors.push(colors[j]);
                break;
            }
        }
    }
    var material = new THREE.PointsMaterial({size: 1, vertexColors: THREE.VertexColors, sizeAttenuation: false});
    return new THREE.Points(geometry, material);
}
var pointsComponent = makePointsComponent(data, labels);
scene.add(pointsComponent);


// Filtered Points
function makeFilteredPointsComponent(dataFiltered) {
    var geometry = new THREE.Geometry();
    for (var i = 0; i < dataFiltered.length; i++) {
        geometry.vertices.push(new THREE.Vector3(data[dataFiltered[i]][0], data[dataFiltered[i]][1], data[dataFiltered[i]][2]));
        geometry.colors.push(pointsComponent.geometry.colors[dataFiltered[i]]);
    }
    var material = new THREE.PointsMaterial({size: 1, vertexColors: THREE.VertexColors, sizeAttenuation: false});
    return new THREE.Points(geometry, material);
}

var dataFiltered = loadarray(dataFolder + 'filtered_points.txt', parseInt);
if (dataFiltered == null) {
    dataFiltered = [];
    for (i = 0; i < data.length; i++) {
        dataFiltered.push(i);
    }
}
var filteredPointsComponent = makeFilteredPointsComponent(dataFiltered);
var showFilteredPoints = false;


// Cycles
function makeCycleComponent(cycle, color) {
    var geometry, i, material;
    if (cycle[0].length === 1) {
        // H1
        geometry = new THREE.Geometry();
        for (i = 0; i < cycle.length; i++) {
            geometry.vertices.push(new THREE.Vector3(data[cycle[i]][0], data[cycle[i]][1], data[cycle[i]][2]));
        }
        material = new THREE.LineBasicMaterial({color: color, linewidth: 3, opacity: 0.8});
        material.transparent = true;
        return new THREE.Line(geometry, material);
    } else if (cycle[0].length === 3) {
        // H2
        geometry = new THREE.Geometry();
        for (i = 0; i < data.length; i++) {
            geometry.vertices.push(new THREE.Vector3(data[i][0], data[i][1], data[i][2]));
        }
        for (i = 0; i < cycle.length; i++) {
            geometry.faces.push(new THREE.Face3(cycle[i][0], cycle[i][1], cycle[i][2]));
        }
        material = new THREE.MeshBasicMaterial({color: color & 0x3f3f3f, opacity: 0.3});
        material.transparent = true;
        material.depthWrite = false;
        material.side = THREE.DoubleSide;
        var mesh = new THREE.Mesh(geometry, material);

        var wireframeGeometry = new THREE.EdgesGeometry(mesh.geometry);
        var wireframeMaterial = new THREE.LineBasicMaterial({color: color, linewidth: 2, opacity: 0.6});
        wireframeMaterial.transparent = true;
        var wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        mesh.add(wireframe);

        return mesh;
    }

}
function makeKillerComponent(killer, color) {
    var geometry = new THREE.Geometry();
    var material = undefined;
    for (var i = 0; i < killer.length; i++) {
        geometry.vertices.push(new THREE.Vector3(data[killer[i]][0], data[killer[i]][1], data[killer[i]][2]));
    }
    geometry.faces.push(new THREE.Face3(0, 1, 2));
    if (geometry.vertices.length === 4) {
        // 3D case
        geometry.faces.push(new THREE.Face3(0, 1, 3));
        geometry.faces.push(new THREE.Face3(0, 2, 3));
        geometry.faces.push(new THREE.Face3(1, 2, 3));
        material = new THREE.MeshBasicMaterial({color: color & 0x7f7f7f, opacity: 0.6});
    } else {
        material = new THREE.MeshBasicMaterial({color: color & 0x7f7f7f, opacity: 0.6});
    }
    material.transparent = true;
    material.side = THREE.DoubleSide;
    var mesh = new THREE.Mesh(geometry, material);

    var wireframeGeometry = new THREE.EdgesGeometry(mesh.geometry);
    var wireframeMaterial = new THREE.LineBasicMaterial({color: color, linewidth: 2, opacity: 0.8});
    wireframeMaterial.transparent = true;
    var wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    mesh.add(wireframe);

    return mesh;

}
var colors = [0xff0000, 0x00ff00, 0xffff00, 0xff00ff];
var cycleComponents = [];
var killerComponents = [];
var selectedCycle = -1;
for (i = 0; i < 4; i++) {
    var cycle = loadarray(dataFolder + 'cycle_' + i.toString() + '.txt', parseInt);
    if (cycle != null) {
        var cycleComponent = makeCycleComponent(cycle, colors[i]);
        scene.add(cycleComponent);
        cycleComponents.push(cycleComponent);
    } else {
        cycleComponents.push(null);
    }
    var killer = loadarray(dataFolder + 'killer_' + i.toString() + '.txt', parseInt);
    if (killer != null) {
        var killerComponent = makeKillerComponent(killer, colors[i]);
        scene.add(killerComponent);
        killerComponents.push(killerComponent);
    } else {
        killerComponents.push(null);
    }
}

// Selected point
function makeSelectedPointComponent() {
    var geometry = new THREE.Geometry();
    var material = new THREE.PointsMaterial({size: 8, color: 0xff0000, sizeAttenuation: false});
    return new THREE.Points(geometry, material);
}
var selectedIndex = undefined;
var selectedPointComponent = makeSelectedPointComponent();
scene.add(selectedPointComponent);

// Controlling
function setVisible(object, vis) {
    if (vis) {
        scene.add(object);
    } else {
        scene.remove(object);
    }
}
function switchVisible(object) {
    object.traverse(function(child) {
        child.visible = !child.visible;
    });
}
document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    var keyCode = event.which;
    if (keyCode === 70) { // F
        showFilteredPoints = !showFilteredPoints;
        setVisible(pointsComponent, !showFilteredPoints);
        setVisible(filteredPointsComponent, showFilteredPoints);
    } else if (keyCode >= 48 && keyCode <= 57) { // 0-9
        selectedCycle = keyCode - 48 - 1;
        updateSelectedCycle();
    }
}

// Selected image
var spriteScale = 0.025;
var spritesAllowed = true;
function makeSelectedImageSprite() {
    var spriteMaterial = new THREE.SpriteMaterial({color: 0xffffff});
    var sprite = new THREE.Sprite(spriteMaterial);
    var scale = spriteScale;
    sprite.scale.set(scale, scale, scale);
    return sprite;
}
var selectedImageSprite = makeSelectedImageSprite();

// Rendering & ray casting
var raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 0.005;
var mouse = new THREE.Vector2();

function onMouseMove(event) {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}
function onMouseDown(event) {
    disallowSprites();
}
function onMouseUp(event) {
    allowSprites();
}
window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('mousedown', onMouseDown, false);
// window.addEventListener( 'wheel', disallowSprites, false );
window.addEventListener('mouseup', onMouseUp, false);

var animate = function () {
    requestAnimationFrame( animate );

    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera( mouse, camera );

    // calculate objects intersecting the picking ray
    var component = !showFilteredPoints ? pointsComponent : filteredPointsComponent;
    var intersects = raycaster.intersectObject(component);
    if (intersects.length > 0) {
        var idx = intersects[0].index;
        if (showFilteredPoints) {
            idx = dataFiltered[idx][0];
        }
        if (selectedIndex !== idx) {
            selectedIndex = idx;
            var point = pointsComponent.geometry.vertices[idx];
            selectedPointComponent.geometry.vertices = [point];
            selectedPointComponent.geometry.verticesNeedUpdate = true;
            scene.add(selectedPointComponent);

            var pos = getScreenXY(point);
            // document.getElementById('info').innerText = coords.x + ' ' + coords.y;

            if (spritesAllowed && imagesBinary != null) {
                var len = imageSize[0] * imageSize[1] * imageSize[2];
                var map = imagesBinary.slice(idx * len, (idx + 1) * len);
                var texture = new THREE.DataTexture(map, imageSize[0], imageSize[1],
                    imageSize[2] === 1 ? THREE.LuminanceFormat : THREE.RGBFormat);
                texture.flipY = true;
                texture.needsUpdate = true;
                selectedImageSprite.material.map = texture;
                selectedImageSprite.material.map.needsUpdate = true;
                selectedImageSprite.position.set(pos.x, pos.y, pos.z);
                scene.add(selectedImageSprite);
            }
        }
    } else {
        selectedIndex = -1;
        scene.remove(selectedPointComponent);
        scene.remove(selectedImageSprite);
    }

    renderer.render( scene, camera );
};
animate();

// Functions
function updateSelectedCycle() {
    for (var i = 0; i < cycleComponents.length; i++) {
        if (i === selectedCycle || selectedCycle === -1) {
            if (cycleComponents[i] != null)
                scene.add(cycleComponents[i]);
            if (killerComponents[i] != null)
                scene.add(killerComponents[i]);
        } else {
            if (cycleComponents[i] != null)
                scene.remove(cycleComponents[i]);
            if (killerComponents[i] != null)
                scene.remove(killerComponents[i]);
        }
    }
}

function log(msg) {
    document.getElementById('info').innerText = msg;
}

function getScreenXY(obj) {

    var vector = obj.clone();
    // var windowWidth = window.innerWidth;
    // var minWidth = 1280;
    //
    // if(windowWidth < minWidth) {
    //     windowWidth = minWidth;
    // }
    //
    // var widthHalf = (windowWidth/2);
    // var heightHalf = (window.innerHeight/2);

    vector.project(camera);
    vector.x += spriteScale * 1.5;
    vector.y += spriteScale * 2;
    vector.z = 0.5;
    vector.unproject(camera);
    // vector.x = ( vector.x * widthHalf ) + widthHalf;
    // vector.y = - ( vector.y * heightHalf ) + heightHalf;
    // vector.z = 0;

    return vector;

}

function disallowSprites() {
    spritesAllowed = false;
    selectedIndex = -1;
    scene.remove(selectedImageSprite);
    scene.remove(selectedPointComponent);
}
function allowSprites() {
    spritesAllowed = true;
}