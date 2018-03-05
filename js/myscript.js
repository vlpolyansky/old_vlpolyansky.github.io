String.prototype.format = function() {
    let args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] !== 'undefined'
            ? args[number]
            : match
            ;
    });
};

const description = JSON.parse(loadtext(document.currentScript.getAttribute('data-json')));
let dataFolders = [];
for (let i = 0; i < description.labels.length; i++) {
    dataFolders.push('data/' + description.labels[i].folder + '/');
}
console.log(dataFolders);

let sc = description.initId;

scenes = {};

let scene = undefined;
let camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
let controls = new THREE.OrbitControls(camera);

let renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

camera.position.z = 5;

let properties = {};
let imageSize = {};

let imagesBinarySliced = {};
let imagesDecodedSliced = {};
let showSourceImages = true;
let labels = {};


// Points
let data = {};
let pointsComponent = {};

let labelColors = [];
for (let i = 0; i < 10; i++) {
    let c = rainbow(10, i);
    c = c | 0x3f3f3f;
    labelColors.push(new THREE.Color(c));
}

function makePointsComponent(data, labels) {
    let geometry = new THREE.Geometry();
    for (let i = 0; i < data.length; i++) {
        geometry.vertices.push(new THREE.Vector3(data[i][0], data[i][1], data[i][2]));
        geometry.colors.push(labelColors[labels[i][0]]);
    }
    let material = new THREE.PointsMaterial({size: 1, vertexColors: THREE.VertexColors, sizeAttenuation: false});
    return new THREE.Points(geometry, material);
}


// Filtered Points
function makeFilteredPointsComponent(dataFiltered, data, pointsComponent) {
    let geometry = new THREE.Geometry();
    for (let i = 0; i < dataFiltered.length; i++) {
        geometry.vertices.push(new THREE.Vector3(data[dataFiltered[i]][0], data[dataFiltered[i]][1], data[dataFiltered[i]][2]));
        geometry.colors.push(pointsComponent.geometry.colors[dataFiltered[i]]);
    }
    let material = new THREE.PointsMaterial({size: 1, vertexColors: THREE.VertexColors, sizeAttenuation: false});
    return new THREE.Points(geometry, material);
}
let dataFiltered = {};
let filteredPointsComponent = {};
let showFilteredPoints = false;


// Cycles
function makeCycleComponent(cycle, color, data) {
    let geometry, material;
    if (cycle[0].length === 1) {
        // H1
        geometry = new THREE.Geometry();
        for (let i = 0; i < cycle.length; i++) {
            geometry.vertices.push(new THREE.Vector3(data[cycle[i]][0], data[cycle[i]][1], data[cycle[i]][2]));
        }
        material = new THREE.LineBasicMaterial({color: color, linewidth: 3, opacity: 0.8});
        material.transparent = true;
        return new THREE.Line(geometry, material);
    } else if (cycle[0].length === 3) {
        // H2
        geometry = new THREE.Geometry();
        for (let i = 0; i < data.length; i++) {
            geometry.vertices.push(new THREE.Vector3(data[i][0], data[i][1], data[i][2]));
        }
        for (let i = 0; i < cycle.length; i++) {
            geometry.faces.push(new THREE.Face3(cycle[i][0], cycle[i][1], cycle[i][2]));
        }
        material = new THREE.MeshBasicMaterial({color: color & 0x3f3f3f, opacity: 0.3});
        material.transparent = true;
        material.depthWrite = false;
        material.side = THREE.DoubleSide;
        let mesh = new THREE.Mesh(geometry, material);

        let wireframeGeometry = new THREE.EdgesGeometry(mesh.geometry);
        let wireframeMaterial = new THREE.LineBasicMaterial({color: color, linewidth: 2, opacity: 0.6});
        wireframeMaterial.transparent = true;
        let wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
        mesh.add(wireframe);

        return mesh;
    }

}

let cycleScale = 0.1;
function makeCycleImagesComponent(cycle, data, imagesBinarySliced) {
    let group = new THREE.Group();
    if (cycle[0].length === 1) {
        // H1
        for (let i = 0; i < cycle.length; i++) {
            let idx = cycle[i];

            let map = imagesBinarySliced[idx];
            let texture = new THREE.DataTexture(map, imageSize[sc][0], imageSize[sc][1],
                imageSize[sc][2] === 1 ? THREE.LuminanceFormat : THREE.RGBFormat);
            texture.flipY = true;
            texture.needsUpdate = true;

            let spriteMaterial = new THREE.SpriteMaterial({map: texture, color: 0xffffff});

            let sprite = new THREE.Sprite(spriteMaterial);
            let scale = cycleScale;

            sprite.position.set(data[idx][0], data[idx][1], data[idx][2]);
            sprite.scale.set(scale, scale, scale);
            sprite.needsUpdate = true;

            group.add(sprite);
        }
    } else {
        let merged = [].concat.apply([], cycle);
        let points = unique(merged);
        for (let i = 0; i < points.length; i++) {
            let idx = points[i];

            let map = imagesBinarySliced[idx];
            let texture = new THREE.DataTexture(map, imageSize[sc][0], imageSize[sc][1],
                imageSize[sc][2] === 1 ? THREE.LuminanceFormat : THREE.RGBFormat);
            texture.flipY = true;
            texture.needsUpdate = true;

            let spriteMaterial = new THREE.SpriteMaterial({map: texture, color: 0xffffff});

            let sprite = new THREE.Sprite(spriteMaterial);
            let scale = cycleScale;

            sprite.position.set(data[idx][0], data[idx][1], data[idx][2]);
            sprite.scale.set(scale, scale, scale);
            sprite.needsUpdate = true;

            group.add(sprite);
        }
    }

    return group;
}

function makeKillerComponent(killer, color, data) {
    let geometry = new THREE.Geometry();
    let material = undefined;
    for (let i = 0; i < killer.length; i++) {
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
    let mesh = new THREE.Mesh(geometry, material);

    let wireframeGeometry = new THREE.EdgesGeometry(mesh.geometry);
    let wireframeMaterial = new THREE.LineBasicMaterial({color: color, linewidth: 2, opacity: 0.8});
    wireframeMaterial.transparent = true;
    let wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    mesh.add(wireframe);

    return mesh;

}
let colors = [0xff0000, 0x00ff00, 0xffff00, 0xff00ff];
let cycleComponents = {};
let cycles = {};
let cycleImageComponents = {};
let cycleDecodedComponents = {};
let showCycles = true;
let showCycleImages = false;
let killerComponents = {};
let showKillerSimplices = true;
let selectedCycle = {};

// Selected point
function makeSelectedPointComponent() {
    let geometry = new THREE.Geometry();
    let material = new THREE.PointsMaterial({size: 8, color: 0xff0000, sizeAttenuation: false});
    return new THREE.Points(geometry, material);
}
let selectedIndex = {};
let selectedPointComponent = {};

// Controlling
function setVisible(object, vis) {
    if (vis) {
        scene.add(object);
    } else {
        scene.remove(object);
    }
}

let showControls = true;
document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    let new_sc = undefined;
    let keyCode = event.which;
    // Changing labels
    for (let i = 0; i < description.labels.length; i++) {
        if (keyCode === description.labels[i].key) {
            new_sc = i;
            if (scenes[new_sc] == null) {
                initScene(new_sc);
            }
            sc = new_sc;
            scene = scenes[sc];
            updateScene();
            break;
        }
    }
    if (keyCode === 70) { // F
        showFilteredPoints = !showFilteredPoints;
        updateFiltered();
    } else if (keyCode >= 96 && keyCode <= 105) { // NUM_0-NUM_9
        selectedCycle[sc] = keyCode - 96 - 1;
        updateSelectedCycle();
    } else if (keyCode === 67) { // C
        showCycles = !showCycles;
        updateSelectedCycle();
    } else if (keyCode === 68) { // D
        showSourceImages = !showSourceImages;
        updatePicked(true);
        updateSelectedCycle();
    } else if (keyCode === 72) { // H
        showControls = !showControls;
        updateControls();
    } else if (keyCode === 73) { // I
        showCycleImages = !showCycleImages;
        updateSelectedCycle();
    } else if (keyCode === 75) { // K
        showKillerSimplices = !showKillerSimplices;
        updateSelectedCycle();
    } else if (keyCode === 187 || keyCode === 189) { // +/-
        if (keyCode === 187) {
            spriteScale *= 1.5;
            cycleScale *= 1.5;
        } else {
            spriteScale /= 1.5;
            cycleScale /= 1.5;
        }
        updatePicked(true);
        updateSelectedCycle();
    }

    updateInfo();
}

// Selected image
let spriteScale = 0.025;
let spritesAllowed = true;
function makeSelectedImageSprite() {
    let spriteMaterial = new THREE.SpriteMaterial({color: 0xffffff});
    let sprite = new THREE.Sprite(spriteMaterial);
    let scale = spriteScale;
    sprite.scale.set(scale, scale, scale);
    return sprite;
}
let selectedImageSprite = {};

scene = initScene(sc);
updatePlot();
updateInfo();

// Rendering & ray casting
let raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 0.01;
let mouse = new THREE.Vector2();

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

let animate = function () {
    requestAnimationFrame( animate );

    updatePicked();

    renderer.render( scene, camera );
};
animate();

// Functions
function updateSelectedCycle() {
    let sel = selectedCycle[sc];
    if (imagesBinarySliced[sc] != null && sel !== -1 && cycleComponents[sc][sel] != null
        && cycleImageComponents[sc][sel] == null) {
        cycleImageComponents[sc][sel] = makeCycleImagesComponent(cycles[sc][sel], data[sc], imagesBinarySliced[sc]);
    }
    if (imagesDecodedSliced[sc] != null && sel !== -1 && cycleComponents[sc][sel] != null
        && cycleDecodedComponents[sc][sel] == null) {
        cycleDecodedComponents[sc][sel] = makeCycleImagesComponent(cycles[sc][sel], data[sc], imagesDecodedSliced[sc]);
    }
    for (let i = 0; i < cycleComponents[sc].length; i++) {
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
                cycleImageComponents[sc][i].traverse( function ( object ) {
                    if (object instanceof THREE.Sprite)
                        object.scale.set(cycleScale, cycleScale, cycleScale);
                });
                scene.add(cycleImageComponents[sc][i]);
                scene.remove(cycleDecodedComponents[sc][i]);
            } else {
                cycleDecodedComponents[sc][i].traverse( function ( object ) {
                    if (object instanceof THREE.Sprite)
                        object.scale.set(cycleScale, cycleScale, cycleScale);
                } );
                scene.add(cycleDecodedComponents[sc][i]);
                scene.remove(cycleImageComponents[sc][i]);
            }
        } else {
            scene.remove(cycleImageComponents[sc][i]);
            scene.remove(cycleDecodedComponents[sc][i]);
        }
    }
}

function getScreenXY(obj) {

    let vector = obj.clone();
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
    let dataFolder = dataFolders[sc];

    let scene = new THREE.Scene();
    scenes[sc] = scene;

    properties[sc] = JSON.parse(loadtext(dataFolder + 'properties.json'));
    imageSize[sc] = properties[sc].imageSize;

    // Images
    if (!description.labels[sc].noimages) {
        let path = description.labels[sc].images_bin != null ?
            get_yadisk_link(description.labels[sc].images_bin) :
            dataFolder + 'images.bin';
        loadbytearray(path, function (binary) {
            imagesBinarySliced[sc] = [];
            for (let i = 0; i < data[sc].length; i++) {
                let len = imageSize[sc][0] * imageSize[sc][1] * imageSize[sc][2];
                let map = binary.slice(i * len, (i + 1) * len);
                imagesBinarySliced[sc].push(map);
            }
            updateScene();
        }, 'images.bin');
        path = description.labels[sc].images_decoded_bin != null ?
            get_yadisk_link(description.labels[sc].images_decoded_bin) :
            dataFolder + 'images_decoded.bin';
        loadbytearray(path, function (binary) {
            imagesDecodedSliced[sc] = [];
            for (let i = 0; i < data[sc].length; i++) {
                let len = imageSize[sc][0] * imageSize[sc][1] * imageSize[sc][2];
                let map = binary.slice(i * len, (i + 1) * len);
                imagesDecodedSliced[sc].push(map);
            }
            updateScene();
        }, 'images_decoded.bin');
    }
    labels[sc] = loadarray(dataFolder + 'labels.txt', parseInt);
    // Points
    data[sc] = loadarray(dataFolder + 'points_3d.txt', parseFloat, 1);
    pointsComponent[sc] = makePointsComponent(data[sc], labels[sc]);
    scene.add(pointsComponent[sc]);

    // Filtered points
    dataFiltered[sc] = loadarray(dataFolder + 'filtered_points.txt', parseInt);
    if (dataFiltered[sc] == null) {
        dataFiltered[sc] = [];
        for (let i = 0; i < data[sc].length; i++) {
            dataFiltered[sc].push(i);
        }
    }
    filteredPointsComponent[sc] = makeFilteredPointsComponent(dataFiltered[sc], data[sc], pointsComponent[sc]);

    // Cycles
    let colors = [0xff0000, 0x00ff00, 0xffff00, 0xff00ff];
    cycles[sc] = [];
    cycleComponents[sc] = [];
    killerComponents[sc] = [];
    cycleImageComponents[sc] = [];
    cycleDecodedComponents[sc] = [];
    selectedCycle[sc] = -1;
    for (let i = 0; i < 4; i++) {
        let cycle = loadarray(dataFolder + 'cycle_' + i.toString() + '.txt', parseInt);
        if (cycle != null) {
            let cycleComponent = makeCycleComponent(cycle, colors[i], data[sc]);
            scene.add(cycleComponent);
            cycleComponents[sc].push(cycleComponent);
        } else {
            cycleComponents[sc].push(null);
        }
        cycles[sc].push(cycle);
        let killer = loadarray(dataFolder + 'killer_' + i.toString() + '.txt', parseInt);
        if (killer != null) {
            let killerComponent = makeKillerComponent(killer, colors[i], data[sc]);
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

    updateControls();

    return scene;
}

function updateFiltered() {
    setVisible(pointsComponent[sc], !showFilteredPoints);
    setVisible(filteredPointsComponent[sc], showFilteredPoints);
}

function updateInfo() {
    let infoString =
        'Label: <b>{0}</b> | ' +
        'Cycle: <b>{1}</b><br>\n' +
        'Cycles: <b>{3}</b> | ' +
        'Cycle images: <b>{4}</b> | ' +
        'Killing simplices: <b>{5}</b><br>' +
        'Filtered: <b>{2}</b> | <b>{6}</b> images<br>\n' +
    '';
    let selectedId = selectedCycle[sc] != null && selectedCycle[sc] >= 0 ? selectedCycle[sc] + 1 : '-';
    if (selectedId !== '-') {
        selectedId = '#' + selectedId;
    }
    let labelId = description.labels[sc].name;
    let yes = '&#10004';
    let no = '&#10060';
    let showFiltered = showFilteredPoints ? yes : no;
    let showingImages = showCycleImages ? yes : no;
    let showCyclesText = showCycles ? yes : no;
    let showKillersText = showKillerSimplices ? yes : no;
    let showSourceImagesText = showSourceImages ? 'Source' : 'Decoded';
    document.getElementById('info').innerHTML = infoString.format(labelId, selectedId, showFiltered, showCyclesText,
        showingImages, showKillersText, showSourceImagesText);
}

function updateControls() {
    if (!showControls) {
        document.getElementById('controls').innerHTML =
            '            Controls: <br>\n' +
            '            &lt;H&gt;: show/hide controls';
    } else {
        let line =
            '            Controls: <br>\n' +
            '            &lt;H&gt;: show/hide controls<br><br>\n';
        line += '[';
        for (let i = 0; i < description.labels.length; i++) {
            if (i > 0) {
                line += ', ';
            }
            const key = description.labels[i].key;
            if (key === 8) {
                line += 'backspace';
            } else {
                line += String.fromCharCode(key);
            }

        }
        line += ']: available label keys<br><br>';
        line +=
        '            &lt;NUM_1&gt;-&lt;NUM_9&gt;: select a cycle<br>\n' +
        '            &lt;NUM_0&gt;: show all cycles<br><br>\n' +
        '            &lt;C&gt;: show/hide <u>c</u>ycles<br>\n' +
        '            &lt;K&gt;: show/hide <u>k</u>illing simplices<br>\n' +
        '            &lt;I&gt;: show/hide <u>i</u>mages on a selected cycle<br><br>\n' +
        '            &lt;D&gt;: switch between source images and <u>d</u>ecoded images<br>' +
        '            &lt;F&gt;: switch between all points and <u>f</u>iltered points used for analysis<br><br>' +
        '&lt;+&gt/&lt;-&gt: change sprites\' scale';

        document.getElementById('controls').innerHTML = line;
    }

}

function updatePicked(force = false) {
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera( mouse, camera );

    // calculate objects intersecting the picking ray
    let component = !showFilteredPoints ? pointsComponent[sc] : filteredPointsComponent[sc];
    let intersects = raycaster.intersectObject(component);
    if (intersects.length > 0) {
        let idx = intersects[0].index;
        if (showFilteredPoints) {
            idx = dataFiltered[sc][idx][0];
        }
        if (selectedIndex[sc] !== idx || force) {
            selectedIndex[sc] = idx;
            let point = pointsComponent[sc].geometry.vertices[idx];
            selectedPointComponent[sc].geometry.vertices = [point];
            selectedPointComponent[sc].geometry.verticesNeedUpdate = true;
            scene.add(selectedPointComponent[sc]);

            let pos = getScreenXY(point);

            let sliced = showSourceImages ? imagesBinarySliced : imagesDecodedSliced;
            if (spritesAllowed && sliced[sc] != null) {
                let map = sliced[sc][idx];
                let texture = new THREE.DataTexture(map, imageSize[sc][0], imageSize[sc][1],
                    imageSize[sc][2] === 1 ? THREE.LuminanceFormat : THREE.RGBFormat);
                texture.flipY = true;
                texture.needsUpdate = true;
                selectedImageSprite[sc].material.map = texture;
                selectedImageSprite[sc].material.map.needsUpdate = true;
                selectedImageSprite[sc].position.set(pos.x, pos.y, pos.z);
                selectedImageSprite[sc].scale.set(spriteScale, spriteScale, spriteScale);
                scene.add(selectedImageSprite[sc]);
            }
        }
    } else {
        selectedIndex[sc] = -1;
        scene.remove(selectedPointComponent[sc]);
        scene.remove(selectedImageSprite[sc]);
    }
}

function updatePlot() {
    if (document.getElementById('plot') != null) {
        document.getElementById('plot').src = dataFolders[sc] + 'plot.png';
    }
}

function updateScene() {
    updatePicked();
    updateSelectedCycle();
    updateFiltered();
    updateInfo();
    updateControls();
    updatePlot();
}