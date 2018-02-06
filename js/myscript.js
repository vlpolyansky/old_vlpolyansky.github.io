// Setup

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
var controls = new THREE.OrbitControls(camera);

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

camera.position.z = 5;

var dataFolder = 'data/label6rot/';

// Points
var data = loadarray(dataFolder + 'points_3d.txt', parseFloat, 1);
function makePointsComponent(data) {
    var geometry = new THREE.Geometry();
    for (var i = 0; i < data.length; i++) {
        geometry.vertices.push(new THREE.Vector3(data[i][0], data[i][1], data[i][2]));
    }
    var material = new THREE.PointsMaterial({size: 1, color: 0x7fffff, sizeAttenuation: false});
    return new THREE.Points(geometry, material);
}
var pointsComponent = makePointsComponent(data);
scene.add(pointsComponent);


// Filtered Points
function makeFilteredPointsComponent(dataFiltered) {
    var geometry = new THREE.Geometry();
    for (var i = 0; i < dataFiltered.length; i++) {
        geometry.vertices.push(new THREE.Vector3(data[dataFiltered[i]][0], data[dataFiltered[i]][1], data[dataFiltered[i]][2]));
    }
    var material = new THREE.PointsMaterial({size: 1, color: 0x7fffff, sizeAttenuation: false});
    return new THREE.Points(geometry, material);
}

var dataFiltered = loadarray(dataFolder + 'filtered_points.txt', parseInt);
var filteredPointsComponent = makeFilteredPointsComponent(dataFiltered);
// scene.add(filteredPointsComponent);
// filteredPointsComponent.visible = false;
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
        material = new THREE.LineBasicMaterial({color: color, linewidth: 3, opacity: 0.6});
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
        material = new THREE.MeshBasicMaterial({color: color & 0x3f3f3f, opacity: 0.4});
        material.transparent = true;
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
    for (var i = 0; i < killer.length; i++) {
        geometry.vertices.push(new THREE.Vector3(data[killer[i]][0], data[killer[i]][1], data[killer[i]][2]));
    }
    geometry.faces.push(new THREE.Face3(0, 1, 2));
    if (geometry.vertices.length === 4) {
        // 3D case
        geometry.faces.push(new THREE.Face3(0, 1, 3));
        geometry.faces.push(new THREE.Face3(0, 2, 3));
        geometry.faces.push(new THREE.Face3(1, 2, 3));
    }
    var material = new THREE.MeshBasicMaterial({color: color, opacity: 0.6});
    material.transparent = true;
    material.side = THREE.DoubleSide;
    return new THREE.Mesh(geometry, material);

}
var i = undefined;
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

// Rendering
var animate = function () {
    requestAnimationFrame( animate );

    renderer.render( scene, camera );
};
animate();

// Functions
function updateSelectedCycle() {
    for (var i = 0; i < cycleComponents.length; i++) {
        if (i === selectedCycle || selectedCycle === -1) {
            scene.add(cycleComponents[i]);
            scene.add(killerComponents[i]);
        } else {
            scene.remove(cycleComponents[i]);
            scene.remove(killerComponents[i]);
        }
    }
}