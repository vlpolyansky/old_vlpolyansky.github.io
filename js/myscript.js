// Setup

String.prototype.format = function() {
    let args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] !== 'undefined'
            ? args[number]
            : match
            ;
    });
};

const dataFolders = [
    'data/label0/',
    'data/label1/',
    'data/label2/',
    'data/label3/',
    'data/label4/',
    'data/label5/',
    'data/label6/',
    'data/label7/',
    'data/label8/',
    'data/label9/',
    'data/labelall/'
];
var sc = 10;
var i = undefined;

scenes = {};

var scene = undefined;
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
var controls = new THREE.OrbitControls(camera);

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

camera.position.z = 5;

var properties = {};
var imageSize = {};

var imagesBinarySliced = {};
var imagesDecodedSliced = {};
var showSourceImages = true;
var labels = {};


// Points
var data = {};
var pointsComponent = {};

var labelColors = [];
for (i = 0; i < 10; i++) {
    var c = rainbow(10, i);
    c = c | 0x3f3f3f;
    labelColors.push(new THREE.Color(c));
}

function makePointsComponent(data, labels) {
    var geometry = new THREE.Geometry();
    for (i = 0; i < data.length; i++) {
        geometry.vertices.push(new THREE.Vector3(data[i][0], data[i][1], data[i][2]));
        geometry.colors.push(labelColors[labels[i][0]]);
    }
    var material = new THREE.PointsMaterial({size: 1, vertexColors: THREE.VertexColors, sizeAttenuation: false});
    return new THREE.Points(geometry, material);
}


// Filtered Points
function makeFilteredPointsComponent(dataFiltered, data, pointsComponent) {
    var geometry = new THREE.Geometry();
    for (var i = 0; i < dataFiltered.length; i++) {
        geometry.vertices.push(new THREE.Vector3(data[dataFiltered[i]][0], data[dataFiltered[i]][1], data[dataFiltered[i]][2]));
        geometry.colors.push(pointsComponent.geometry.colors[dataFiltered[i]]);
    }
    var material = new THREE.PointsMaterial({size: 1, vertexColors: THREE.VertexColors, sizeAttenuation: false});
    return new THREE.Points(geometry, material);
}
var dataFiltered = {};
var filteredPointsComponent = {};
var showFilteredPoints = false;


// Cycles
function makeCycleComponent(cycle, color, data) {
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

var cycleScale = 0.1;
function makeCycleImagesComponent(cycle, data, imagesBinarySliced) {
    var group = new THREE.Group();
    var i;
    if (cycle[0].length === 1) {
        // H1
        for (i = 0; i < cycle.length; i++) {
            var idx = cycle[i];

            var map = imagesBinarySliced[idx];
            var texture = new THREE.DataTexture(map, imageSize[sc][0], imageSize[sc][1],
                imageSize[sc][2] === 1 ? THREE.LuminanceFormat : THREE.RGBFormat);
            texture.flipY = true;
            texture.needsUpdate = true;

            var spriteMaterial = new THREE.SpriteMaterial({map: texture, color: 0xffffff});

            var sprite = new THREE.Sprite(spriteMaterial);
            var scale = cycleScale;

            sprite.position.set(data[idx][0], data[idx][1], data[idx][2]);
            sprite.scale.set(scale, scale, scale);
            sprite.needsUpdate = true;

            group.add(sprite);
        }
    }

    return group;
}

function makeKillerComponent(killer, color, data) {
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
var cycleComponents = {};
var cycles = {};
var cycleImageComponents = {};
var cycleDecodedComponents = {};
var showCycles = true;
var showCycleImages = false;
var killerComponents = {};
var showKillerSimplices = true;
var selectedCycle = {};

// Selected point
function makeSelectedPointComponent() {
    var geometry = new THREE.Geometry();
    var material = new THREE.PointsMaterial({size: 8, color: 0xff0000, sizeAttenuation: false});
    return new THREE.Points(geometry, material);
}
var selectedIndex = {};
var selectedPointComponent = {};

// Controlling
function setVisible(object, vis) {
    if (vis) {
        scene.add(object);
    } else {
        scene.remove(object);
    }
}

var showControls = true;
document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    var new_sc = undefined;
    var keyCode = event.which;
    if (keyCode === 70) { // F
        showFilteredPoints = !showFilteredPoints;
        updateFiltered();
    } else if (keyCode >= 96 && keyCode <= 105) { // NUM_0-NUM_9
        selectedCycle[sc] = keyCode - 96 - 1;
        updateSelectedCycle();
    } else if (keyCode >= 48 && keyCode <= 57 || keyCode === 8) { // 0-9 or backspace
        if (keyCode === 8) {
            new_sc = 10;
        } else {
            new_sc = keyCode - 48;
        }
        if (scenes[new_sc] == null) {
            initScene(new_sc);
        }
        sc = new_sc;
        scene = scenes[sc];
        updateScene();
    } else if (keyCode === 67) { // C
        showCycles = !showCycles;
        updateSelectedCycle();
    } else if (keyCode === 68) { // D
        showSourceImages = !showSourceImages;
        updatePicked(true);
        updateSelectedCycle();
    } else if (keyCode === 72) { // H
        showControls = !showControls;
        document.getElementById('controls').innerHTML = showControls ?
            '            Controls: <br>\n' +
            '            &lt;H&gt;: show/hide controls<br><br>\n' +
            '            &lt;0&gt;-&lt;9&gt;: select a label<br>\n' +
            '            &lt;Backspace&gt;: show all labels<br><br>\n' +
            '            &lt;NUM_1&gt;-&lt;NUM_9&gt;: select a cycle<br>\n' +
            '            &lt;NUM_0&gt;: show all cycles<br><br>\n' +
            '            &lt;C&gt;: show/side <u>c</u>ycles<br>\n' +
            '            &lt;K&gt;: show/side <u>k</u>illing simplices<br>\n' +
            '            &lt;I&gt;: show/side <u>i</u>mages on a selected cycle<br><br>\n' +
            '            &lt;D&gt;: switch between source images and <u>d</u>ecoded images<br>' +
            '            &lt;F&gt;: switch between all points and <u>f</u>iltered points used for analysis<br>':

            '            Controls: <br>\n' +
            '            &lt;H&gt;: show/hide controls';
    } else if (keyCode === 73) { // I
        showCycleImages = !showCycleImages;
        updateSelectedCycle();
    } else if (keyCode === 75) { // K
        showKillerSimplices = !showKillerSimplices;
        updateSelectedCycle();
    }

    updateInfo();
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
var selectedImageSprite = {};

scene = initScene(sc);
updateInfo();

// Rendering & ray casting
var raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 0.01;
var mouse = new THREE.Vector2();

function onMouseMove(event) {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}
function onMouseDown() {
    disallowSprites();
}
function onMouseUp() {
    allowSprites();
}
window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('mousedown', onMouseDown, false);
// window.addEventListener( 'wheel', disallowSprites, false );
window.addEventListener('mouseup', onMouseUp, false);

var animate = function () {
    requestAnimationFrame( animate );

    updatePicked();

    renderer.render( scene, camera );
};
animate();

// Functions
function updateSelectedCycle() {
    var sel = selectedCycle[sc];
    if (imagesBinarySliced[sc] != null && sel !== -1 && cycleComponents[sc][sel] != null
        && cycleImageComponents[sc][sel] == null) {
        console.log('HERE1');
        cycleImageComponents[sc][sel] = makeCycleImagesComponent(cycles[sc][sel], data[sc], imagesBinarySliced[sc]);
    }
    if (imagesDecodedSliced[sc] != null && sel !== -1 && cycleComponents[sc][sel] != null
        && cycleDecodedComponents[sc][sel] == null) {
        console.log('HERE2');
        cycleDecodedComponents[sc][sel] = makeCycleImagesComponent(cycles[sc][sel], data[sc], imagesDecodedSliced[sc]);
    }
    for (var i = 0; i < cycleComponents[sc].length; i++) {
        if (showCycles && (i === selectedCycle[sc] || selectedCycle[sc] === -1)) {
            if (cycleComponents[sc][i] != null)
                scene.add(cycleComponents[sc][i]);
            if (killerComponents[sc][i] != null) {
                if (showKillerSimplices)
                    scene.add(killerComponents[sc][i]);
                else
                    scene.remove(killerComponents[sc][i]);
            }
        } else {
            if (cycleComponents[sc][i] != null)
                scene.remove(cycleComponents[sc][i]);
            if (killerComponents[sc][i] != null)
                scene.remove(killerComponents[sc][i]);
        }
        if (showCycles && i === selectedCycle[sc] && showCycleImages) {
            if (showSourceImages) {
                scene.add(cycleImageComponents[sc][i]);
                scene.remove(cycleDecodedComponents[sc][i]);
            } else {
                scene.add(cycleDecodedComponents[sc][i]);
                scene.remove(cycleImageComponents[sc][i]);
            }
        } else {
            scene.remove(cycleImageComponents[sc][i]);
            scene.remove(cycleDecodedComponents[sc][i]);
        }
    }
}

function log(msg) {
    document.getElementById('info').innerText = msg;
}

function getScreenXY(obj) {

    var vector = obj.clone();
    vector.project(camera);
    vector.x += spriteScale * 1.5;
    vector.y += spriteScale * 2;
    vector.z = 0.5;
    vector.unproject(camera);

    return vector;

}

function disallowSprites() {
    spritesAllowed = false;
    selectedIndex[sc] = -1;
    scene.remove(selectedImageSprite[sc]);
    scene.remove(selectedPointComponent[sc]);
}
function allowSprites() {
    spritesAllowed = true;
}

function initScene(sc) {
    var dataFolder = dataFolders[sc];

    var scene = new THREE.Scene();
    scenes[sc] = scene;

    properties[sc] = JSON.parse(loadtext(dataFolder + 'properties.json'));
    imageSize[sc] = properties[sc].imageSize;

    // Images
    loadbytearray(dataFolder + 'images.bin', function (binary) {
        imagesBinarySliced[sc] = [];
        for (var i = 0; i < data[sc].length; i++) {
            var len = imageSize[sc][0] * imageSize[sc][1] * imageSize[sc][2];
            var map = binary.slice(i * len, (i + 1) * len);
            imagesBinarySliced[sc].push(map);
        }
    });
    loadbytearray(dataFolder + 'images_decoded.bin', function (binary) {
        imagesDecodedSliced[sc] = [];
        for (var i = 0; i < data[sc].length; i++) {
            var len = imageSize[sc][0] * imageSize[sc][1] * imageSize[sc][2];
            var map = binary.slice(i * len, (i + 1) * len);
            imagesDecodedSliced[sc].push(map);
        }
    });
    labels[sc] = loadarray(dataFolder + 'labels.txt', parseInt);

    // Points
    data[sc] = loadarray(dataFolder + 'points_3d.txt', parseFloat, 1);
    pointsComponent[sc] = makePointsComponent(data[sc], labels[sc]);
    scene.add(pointsComponent[sc]);

    // Filtered points
    dataFiltered[sc] = loadarray(dataFolder + 'filtered_points.txt', parseInt);
    if (dataFiltered[sc] == null) {
        dataFiltered[sc] = [];
        for (i = 0; i < data[sc].length; i++) {
            dataFiltered[sc].push(i);
        }
    }
    filteredPointsComponent[sc] = makeFilteredPointsComponent(dataFiltered[sc], data[sc], pointsComponent[sc]);

    // Cycles
    var colors = [0xff0000, 0x00ff00, 0xffff00, 0xff00ff];
    cycles[sc] = [];
    cycleComponents[sc] = [];
    killerComponents[sc] = [];
    cycleImageComponents[sc] = [];
    cycleDecodedComponents[sc] = [];
    selectedCycle[sc] = -1;
    for (i = 0; i < 4; i++) {
        var cycle = loadarray(dataFolder + 'cycle_' + i.toString() + '.txt', parseInt);
        if (cycle != null) {
            var cycleComponent = makeCycleComponent(cycle, colors[i], data[sc]);
            scene.add(cycleComponent);
            cycleComponents[sc].push(cycleComponent);
        } else {
            cycleComponents[sc].push(null);
        }
        cycles[sc].push(cycle);
        var killer = loadarray(dataFolder + 'killer_' + i.toString() + '.txt', parseInt);
        if (killer != null) {
            var killerComponent = makeKillerComponent(killer, colors[i], data[sc]);
            scene.add(killerComponent);
            killerComponents[sc].push(killerComponent);
        } else {
            killerComponents[sc].push(null);
        }
        cycleImageComponents[sc].push(null);
    }

    // Selected point
    selectedIndex[sc] = -1;
    selectedPointComponent[sc] = makeSelectedPointComponent();
    scene.add(selectedPointComponent[sc]);

    // Selected image
    selectedImageSprite[sc] = makeSelectedImageSprite();

    return scene;
}

function updateFiltered() {
    setVisible(pointsComponent[sc], !showFilteredPoints);
    setVisible(filteredPointsComponent[sc], showFilteredPoints);
}

function updateInfo() {
    var infoString =
        'Label: <b>{0}</b> | ' +
        'Cycle: <b>{1}</b><br>\n' +
        'Cycles: <b>{3}</b> | ' +
        'Cycle images: <b>{4}</b> | ' +
        'Killing simplices: <b>{5}</b><br>' +
        'Filtered: <b>{2}</b> | <b>{6}</b> images<br>\n' +
    '';
    var selectedId = selectedCycle[sc] != null && selectedCycle[sc] >= 0 ? selectedCycle[sc] + 1 : '-';
    if (selectedId !== '-') {
        selectedId = '#' + selectedId;
    }
    var labelId = sc < 10 ? sc : 'all';
    var yes = '&#10004';
    var no = '&#10060';
    var showFiltered = showFilteredPoints ? yes : no;
    var showingImages = showCycleImages ? yes : no;
    var showCyclesText = showCycles ? yes : no;
    var showKillersText = showKillerSimplices ? yes : no;
    var showSourceImagesText = showSourceImages ? 'Source' : 'Decoded';
    document.getElementById('info').innerHTML = infoString.format(labelId, selectedId, showFiltered, showCyclesText,
        showingImages, showKillersText, showSourceImagesText);
}

function updatePicked(force = false) {
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera( mouse, camera );

    // calculate objects intersecting the picking ray
    var component = !showFilteredPoints ? pointsComponent[sc] : filteredPointsComponent[sc];
    var intersects = raycaster.intersectObject(component);
    if (intersects.length > 0) {
        var idx = intersects[0].index;
        if (showFilteredPoints) {
            idx = dataFiltered[sc][idx][0];
        }
        if (selectedIndex[sc] !== idx || force) {
            selectedIndex[sc] = idx;
            var point = pointsComponent[sc].geometry.vertices[idx];
            selectedPointComponent[sc].geometry.vertices = [point];
            selectedPointComponent[sc].geometry.verticesNeedUpdate = true;
            scene.add(selectedPointComponent[sc]);

            var pos = getScreenXY(point);

            var sliced = showSourceImages ? imagesBinarySliced : imagesDecodedSliced;
            if (spritesAllowed && sliced[sc] != null) {
                var map = sliced[sc][idx];
                var texture = new THREE.DataTexture(map, imageSize[sc][0], imageSize[sc][1],
                    imageSize[sc][2] === 1 ? THREE.LuminanceFormat : THREE.RGBFormat);
                texture.flipY = true;
                texture.needsUpdate = true;
                selectedImageSprite[sc].material.map = texture;
                selectedImageSprite[sc].material.map.needsUpdate = true;
                selectedImageSprite[sc].position.set(pos.x, pos.y, pos.z);
                scene.add(selectedImageSprite[sc]);
            }
        }
    } else {
        selectedIndex[sc] = -1;
        scene.remove(selectedPointComponent[sc]);
        scene.remove(selectedImageSprite[sc]);
    }
}

function updateScene() {
    updatePicked();
    updateSelectedCycle();
    updateFiltered();
    updateInfo();
}