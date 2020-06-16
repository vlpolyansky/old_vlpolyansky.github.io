String.prototype.format = function() {
    let args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] !== 'undefined'
            ? args[number]
            : match
            ;
    });
};

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function make_list(n) {
    let a = [];
    for (let i = 0; i < n; i++) {
        a.push(undefined);
    }
    return a;
}

function make_mat(n) {
    let a = [];
    for (let i = 0; i < n; i++) {
        a.push(make_list(n));
    }
    return a;
}


let canvasWidth = Math.floor(window.innerWidth / 2) - 10;
let canvasHeight = window.innerHeight - 1;

let scene = undefined;
let scene2 = undefined;
let camera = new THREE.PerspectiveCamera( 75, canvasWidth/canvasHeight, 0.1, 1000 );
let controls = new THREE.OrbitControls(camera);

let default_z = 3;
camera.position.z = default_z;

let mouse = new THREE.Vector2();

function onMouseMove(event) {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}
window.addEventListener('mousemove', onMouseMove, false);

let canvas1 = document.getElementById("canvas1");
let canvas2 = document.getElementById("canvas2");
canvas1.width = canvasWidth;
canvas1.height = canvasHeight;
canvas2.width = canvasWidth;
canvas2.height = canvasHeight;

let renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas1 });
renderer.setSize( canvasWidth, canvasHeight);
document.body.appendChild( renderer.domElement );

let renderer2 = new THREE.WebGLRenderer({ antialias: true, canvas: canvas2 });
renderer2.setSize(canvasWidth, canvasHeight);
document.body.appendChild( renderer2.domElement );


let scene_to_render = 0;
let camera_rotation = true;

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    let keyCode = event.which;
    if (keyCode === 90) { // Z
        scene_to_render = (scene_to_render + 1) % 2;
    } else if (keyCode === 88) { // X
        camera_rotation = !camera_rotation;
    }
}


let lineVertexShader = `
  	varying vec3 vPos;
    void main() 
    {
      vPos = position;
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewPosition;
    }
  `;
let lineFragmentShader = `
    uniform vec3 origin;
    uniform vec3 color;
    uniform float def_opacity;
  	varying vec3 vPos;
    float limitDistance = 2.0;
    void main() {
        float distance = clamp(length(vPos), 0., limitDistance);
        float opacity = 1. - distance / limitDistance;
        opacity = opacity * def_opacity;
        gl_FragColor = vec4(color, opacity);
    }
  `;


// let animatedLineFragmentShader = `
//     uniform vec3 p1;
//     uniform vec3 p2;
//     uniform vec3 color;
//     uniform float alpha;
//   	varying vec3 vPos;
//
//     void main() {
//         float ratio = length(vPos - p1) / length(p2 - p1);
//         float opacity = alpha <= 1.0 ? (ratio < alpha ? 1.0 : 0.0) : (1.0 - ratio < 2.0 - alpha ? 1.0 : 0.0);
//         gl_FragColor = vec4(color, opacity);
//     }
//   `;
let animatedLineFragmentShader = `
    uniform vec3 p1;
    uniform vec3 p2;
    uniform vec3 color1;
    uniform vec3 color;
    uniform float alpha;
  	varying vec3 vPos;
  	
    void main() {
        float last_age = 0.8;
        
        float ratio = length(vPos - p1) / length(p2 - p1);
        float age = alpha - ratio;
        float opacity = 0.0;
        vec3 cur_color;
        if (age >= 0.0 && age < last_age) {
            if (age < 0.1) {
                cur_color = color1;
                opacity = 1.0;
            } else if (age < 0.6) {
                cur_color = color1 * (0.6 - age) * 2.0 + 
                    color * (age - 0.1) * 2.0;
                opacity = 1.0;
            } else {
                cur_color = color;
                opacity = (last_age - age) / 0.2;
            }
        }
        gl_FragColor = vec4(cur_color, opacity);
    }
  `;

let gray_color = new THREE.Color('gray');
let blink_color = new THREE.Color('white');
let wireframe_color = new THREE.Color('gray');

let dw_default = false;

let fade_material = function() {
    return new THREE.ShaderMaterial({
        uniforms: {
            color: {
                value: new THREE.Color('gray')
            },
            origin: {
                value: new THREE.Vector3()
            },
            def_opacity: {
                value: 1.0
            }
        },
        vertexShader: lineVertexShader,
        fragmentShader: lineFragmentShader,
        transparent: true,
        depthWrite: dw_default,
        side: THREE.DoubleSide
    });
};

let animated_material = function(p1, p2) {
    return new THREE.ShaderMaterial({
        uniforms: {
            color1: {
                value: new THREE.Color('white')
            },
            color: {
                value: new THREE.Color('purple')
            },
            alpha: {
                value: 0.0
            },
            p1: {
                value: p1
            },
            p2: {
                value: p2
            }
        },
        vertexShader: lineVertexShader,
        fragmentShader: animatedLineFragmentShader,
        linewidth: 3,
        transparent: true,
        depthWrite: dw_default
    });
};

// function makePointsComponent(data, colors) {
//     let geometry = new THREE.Geometry();
//     for (let i = 0; i < data.length; i++) {
//         geometry.vertices.push(new THREE.Vector3(data[i][0], data[i][1], data[i][2]));
//         geometry.colors.push(i === 0 ? colors[0] : data[i][0] < 0 ? colors[1] : colors[2]);
//     }
//     let material = new THREE.PointsMaterial({size: pointSize, map: pointSprite, alphaTest: 0.5,
//         vertexColors: THREE.VertexColors, sizeAttenuation: true, transparent: true});
//     // let material = new THREE.PointsMaterial( { size: 35, sizeAttenuation: false, map: pointSprite, alphaTest: 0.5, transparent: true } );
//     // material.color.setHSL( 1.0, 0.3, 0.7 );
//     return new THREE.Points(geometry, material);
// }

let points = make_list(data.length);
let points2 = make_list(data.length);

function make_sphere(rad, color, x, y, z) {
    let geometry = new THREE.SphereGeometry(rad, 16, 16);
    let material = new THREE.MeshBasicMaterial( {color: color} );
    // let material = fade_material();
    // material.uniforms.color.value = new THREE.Color(color);
    material.transparent = true;
    material.depthWrite = dw_default;
    material.side = THREE.DoubleSide;
    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    return mesh;
}

let data_vec3 = [];
for (let i = 0; i < data.length; i++) {
    data_vec3.push(new THREE.Vector3(
        data[i][0],
        data[i][1],
        data[i][2]));
}

function makePointsComponent(data, points) {
    let group = new THREE.Group();
    for (let i = 0; i < data.length; i++) {
        let geometry = new THREE.SphereGeometry(0.02, 16, 16);
        let material = new THREE.MeshBasicMaterial( {color: 'gray', side: THREE.BackSide} );
        // let material = fade_material();
        // material.transparent = true;
        material.depthWrite = dw_default;
        material.side = THREE.DoubleSide;
        let mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(data[i][0], data[i][1], data[i][2]);
        points[i] = mesh;

        group.add(mesh);
    }
    return group;
}

let vertices_vec3 = [];
for (let i = 0; i < vertices.length; i++) {
    vertices_vec3.push(new THREE.Vector3(
        vertices[i][0],
        vertices[i][1],
        vertices[i][2]));
}

let voronoi_graph = make_mat(vertices_vec3.length);

let selected_ridges = [[0, 14, 2], [1, 4, 1]];
let ridges = [];

function makeRidgeComponent(scene) {
    // let material = new THREE.LineBasicMaterial({color: gray_color, linewidth: lineSize, opacity: 0.8});
    // material.transparent = true;
    next_ridge:
    for (let i = 0; i < ridge_points.length; i++) {
        // if (ridge_points[i][0] === idx || ridge_points[i][1] === idx) {
        for (let j = 0; j < ridge_vertices[i].length; j++) {
            if (ridge_vertices[i][j] === -1) {
                continue next_ridge;
            }
        }
        let geometry = new THREE.Geometry();
        let n = ridge_vertices[i].length;
        for (let j = 0; j < n; j++) {
            let ver1 = ridge_vertices[i][j];
            let ver2 = ridge_vertices[i][(j + 1) % n];
            if (!voronoi_graph[ver1][ver2]) {
                let geometry = new THREE.Geometry();
                geometry.vertices.push(vertices_vec3[ver1]);
                geometry.vertices.push(vertices_vec3[ver2]);
                let line = new THREE.Line(geometry, fade_material());
                scene.add(line);

                voronoi_graph[ver1][ver2] = line;
                voronoi_graph[ver2][ver1] = line;
            }

            for (let sr of selected_ridges) {
                if (ridge_points[i][0] === sr[0] && ridge_points[i][1] === sr[1] && (j === sr[2] || sr[2] < 0)) {
                    ridges.push(voronoi_graph[ver1][ver2]);
                }
            }

        }

    }
}

let faces = [];


function makeFaceComponent(scene) {
    let group = new THREE.Group();
    let geometry = new THREE.Geometry();
    // geometry.vertices = vertices;
    for (let i = 0; i < vertices.length; i++) {
        geometry.vertices.push(new THREE.Vector3(vertices[i][0], vertices[i][1], vertices[i][2]));
    }
    for (let t of start_dim1) {
        let idx0 = t[0];
        let idx1 = t[1];
        next_ridge:
            for (let i = 0; i < ridge_points.length; i++) {
                if (ridge_points[i][0] === idx0 && ridge_points[i][1] === idx1) {
                    // for (let j = 0; j < ridge_vertices[i].length; j++) {
                    //     if (ridge_vertices[i][j] === -1) {
                    //         continue next_ridge;
                    //     }
                    // }
                    for (let j = 1; j < ridge_vertices[i].length - 1; j++) {
                        geometry.faces.push(new THREE.Face3(
                            ridge_vertices[i][0],
                            ridge_vertices[i][j],
                            ridge_vertices[i][j + 1]));
                    }
                }
            }
        geometry.computeFaceNormals();
        // geometry.computeVertexNormals();
        // let material = new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 0.1});
        let material = fade_material();
        material.uniforms.def_opacity.value = 0.0;
        // let material = new THREE.MeshPhongMaterial({color: 0xffffff, opacity: 0.3});
        // let material = new THREE.MeshStandardMaterial( { color: 0xff0000, roughness: 1, metalness: 0., opacity: 0.3 } );
        material.transparent = true;
        // material.depthWrite = dw_default;
        material.side = THREE.DoubleSide;
        let mesh = new THREE.Mesh(geometry, material);
        faces.push(mesh);
        scene.add(mesh);
    }

    // let wireframeGeometry = new THREE.EdgesGeometry(mesh.geometry);
    // let wireframeMaterial = new THREE.LineBasicMaterial({color: color, linewidth: wireframeSize, opacity: 0.6});
    // wireframeMaterial.transparent = true;
    // let wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    // mesh.add(wireframe);
}

let vertices_meshes = [];

function makeVerticesComponent(scene) {
    for (let i = 0; i < vertices_vec3.length; i++) {
        let geometry = new THREE.SphereGeometry(0.035, 16, 16);
        // let material = fade_material();
        let material = new THREE.MeshBasicMaterial( {color: 'blue'} );
        material.transparent = true;
        material.opacity = 0.5;
        material.depthWrite = dw_default;
        material.side = THREE.DoubleSide;
        let mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(vertices[i][0], vertices[i][1], vertices[i][2]);

        vertices_meshes.push(mesh);
        scene.add(mesh);
    }
    // let material = new THREE.PointsMaterial( { size: 35, sizeAttenuation: false, map: pointSprite, alphaTest: 0.5, transparent: true } );
    // material.color.setHSL( 1.0, 0.3, 0.7 );
}


let lines_per_stage = make_list(3);

let make_ray = function(x0, y0, z0, x1, y1, z1) {
    let p1 = new THREE.Vector3(x0, y0, z0);
    let p2 = new THREE.Vector3(x1, y1, z1);
    let geometry = new THREE.Geometry();
    geometry.vertices.push(p1);
    geometry.vertices.push(p2);
    return new THREE.Line(geometry, animated_material(p1, p2));
};

let initScene = function() {
    let scene = new THREE.Scene();
    // makeGrid();
    scene.add(makePointsComponent(data, points));
    // scene.add(verticesComponent);
    //
    // for (let i = 0; i < data.length; i++) {
    //     scene.add(makeRidgeComponent(i, new THREE.Color('gray')));
    // }
    makeRidgeComponent(scene);
    //

    makeFaceComponent(scene);

    // makeVerticesComponent(scene);

    let rays = [rays_dim0, rays_dim1, rays_dim2];
    for(let i = 0; i < 3; i++) {
        lines_per_stage[i] = [];
        for (let seg of rays[i]) {
            let line = make_ray(seg[0], seg[1], seg[2], seg[3], seg[4], seg[5]);
            lines_per_stage[i].push(line);
            // scene.add(line);
        }
    }

    return scene;
};

let initScene2 = function() {
    let scene = new THREE.Scene();
    scene.add(makePointsComponent(data, points2));

    return scene;
};


scene = initScene();
scene2 = initScene2();

var exporter = new THREE.OBJExporter();
var obj = exporter.parse(scene);

// var exporter = new THREE.OBJExporter();
// var result = exporter.parse( scene );
// console.log(result);

let blinks = [];
let line_anims = [];
let last_stage = -1;

let get_camera_position = function(now) {
    let period = 10;
    let w = now * 2 * Math.PI / period;
    return new THREE.Vector3(default_z * Math.sin(w), 0, default_z * Math.cos(w));
};


let last_del_group = new THREE.Group();
let tetrahedra = {};
let color_it = 0;
let color_max = 16;

let animate = function (now) {
    now *= 0.001;
    now /= 2;

    let nstages = 12;
    now = now % nstages;
    let stage = Math.floor(now);
    let new_stage = false;
    if (stage !== last_stage) {
        last_stage = stage;
        new_stage = true;
    }

    let new_blinks = [];
    for (let blink of blinks) {
        let tick = blink[0];
        let mesh = blink[1];
        let col0 = blink[2];
        let col1 = blink[3];
        // let isline = mesh instanceof THREE.Line;
        let value = col0 ? col0.clone() : col1.clone();
        let opa = 0.0;
        let lw = 1.0;
        if (tick === stage) {
            value = value.lerp(col1, 1.0 - (now % 1));
            opa = 1.0 - (now % 1);
            lw = 1.0 + (1.0 - (now % 1)) * 3.0;
            new_blinks.push(blink);
        } else if (!col0) {
            // scene.remove(mesh);
            // scene2.remove(mesh);
        }
        if ('uniforms' in mesh.material) {
            mesh.material.uniforms.color.value = value;
            if (!col0) {
                // console.log('here');
                mesh.material.uniforms.def_opacity.value = opa;
            }
        } else {
            mesh.material.color = value;
            if (!col0) {
                mesh.material.opacity = opa;
            }
        }
        mesh.material.linewidth = lw;

    }
    blinks = new_blinks;

    let new_line_anims = [];
    for (let task of line_anims) {
        let tick = task[0];
        let mesh = task[1];

        if (tick === stage) {
            mesh.material.uniforms.alpha.value = now % 1;
            new_line_anims.push(task);
        } else if (tick + 1 === stage) {
            mesh.material.uniforms.alpha.value = 1 + (now % 1);
            new_line_anims.push(task);
        } else {
            mesh.material.uniforms.alpha.value = 0;
            scene.remove(mesh);
        }

    }
    line_anims = new_line_anims;

    let walk_offset = 3;

    if (new_stage) {
        if (stage < walk_offset) {
            for (let line of lines_per_stage[stage]) {
                scene.add(line);
                line_anims.push([stage, line]);
            }

            if (stage === 0) {
                console.log("new cycle");
                scene2 = initScene2(); // todo fix
                for (let t of start_dim0) {
                    let i = t[0];
                    if (points[i]) {
                        // points[i].material.color = gray_color.clone().lerp(blink_color, dim0_blink);
                        blinks.push([stage, points[i], gray_color, blink_color]);
                        blinks.push([stage, points2[i], gray_color, blink_color]);
                    } else {
                        console.log(start_dim0);
                    }
                }
            } else if (stage === 1) {
                for (let mesh of faces) {
                    blinks.push([stage, mesh, null, blink_color]);
                }
                last_del_group = new THREE.Group();
                for (let t of start_dim1) {
                    let geometry = new THREE.Geometry();
                    geometry.vertices.push(data_vec3[t[0]], data_vec3[t[1]]);
                    let line = new THREE.Line(geometry, fade_material());
                    last_del_group.add(line);
                    blinks.push([stage, line, gray_color, blink_color]);
                }
                scene2.add(last_del_group);
            } else if (stage === 2) {
                scene2.remove(last_del_group);
                last_del_group = new THREE.Group();
                color_it = 0;
                for (let mesh of ridges) {
                    blinks.push([stage, mesh, gray_color, blink_color]);
                }
                for (let t of start_dim2) {
                    let geometry = new THREE.Geometry();
                    geometry.vertices.push(data_vec3[t[0]], data_vec3[t[1]], data_vec3[t[2]]);
                    geometry.faces.push(new THREE.Face3(0, 1, 2));
                    let mesh = new THREE.Mesh(geometry, fade_material());
                    last_del_group.add(mesh);
                    blinks.push([stage, mesh, null, blink_color]);

                    let wireframeGeometry = new THREE.EdgesGeometry(mesh.geometry);
                    let wireframeMaterial = new THREE.LineBasicMaterial({color: 'white', linewidth: 1, opacity: 0.8});
                    wireframeMaterial.transparent = true;
                    let wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
                    mesh.add(wireframe);
                }
                scene2.add(last_del_group);
            }
        } else {
            if (stage === 3) {
                scene2.remove(last_del_group);
                tetrahedra = {};
                color_it = 0;
            }
            for (let w of walks[stage - walk_offset]) {
                let mesh = undefined;
                let color = undefined;
                let key = w[7].toString() + " " + w[8].toString() + " " + w[9].toString() + " " + w[10].toString();

                let line = make_ray(w[0], w[1], w[2], w[3], w[4], w[5]);
                scene.add(line);
                line_anims.push([stage, line]);

                if (key in tetrahedra) {
                    mesh = tetrahedra[key];
                    color = mesh.material.uniforms.color.value;
                } else {
                    let geometry = new THREE.Geometry();

                    geometry.vertices.push(data_vec3[w[7]], data_vec3[w[8]], data_vec3[w[9]], data_vec3[w[10]]);
                    geometry.faces.push(new THREE.Face3(0, 1, 2));
                    geometry.faces.push(new THREE.Face3(0, 1, 3));
                    geometry.faces.push(new THREE.Face3(0, 2, 3));
                    geometry.faces.push(new THREE.Face3(1, 2, 3));
                    mesh = new THREE.Mesh(geometry, fade_material());
                    tetrahedra[key] = mesh;
                    color = new THREE.Color(rainbow(color_max, color_it++));
                    scene2.add(mesh);

                    let wireframeGeometry = new THREE.EdgesGeometry(mesh.geometry.clone());
                    // let wireframeMaterial = new THREE.LineBasicMaterial({color: 'white', linewidth: 1, opacity: 0.8});
                    // wireframeMaterial.transparent = true;
                    let wireframe = new THREE.LineSegments(wireframeGeometry, fade_material());
                    scene2.add(wireframe);
                }

                let sphere = make_sphere(0.04, color, w[0], w[1], w[2]);
                scene.add(sphere);
                blinks.push([stage, sphere, null, blink_color]);

                blinks.push([stage, mesh, null, blink_color]);

            }
        }
    }

    if (camera_rotation) {
        // console.log(camera.position);
        let pos = get_camera_position(now);
        camera.position.set(pos.x, pos.y, pos.z);
        camera.lookAt(0, 0, 0);
    }


    requestAnimationFrame( animate );

    renderer.render( scene_to_render == 0 ? scene : scene2, camera );
    renderer2.render( scene_to_render == 0 ? scene2 : scene, camera );
};
animate(0);


function getScreenXY(obj) {

    let vector = obj.clone();
    vector.project(camera);
    vector.x += spriteScale * 1.5;
    vector.y += spriteScale * 2;
    vector.z = 0.5;
    vector.unproject(camera);

    return vector;

}
