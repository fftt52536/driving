var car, controls, camera;
var keys = {l:false,r:false,b:false,t:false};
var maxv = 6, minv = -6;
var constraints = [], cars = [];
var lampCount = 4, carCount = 5;
async function init() {
    console.log(Physijs);
    Physijs.scripts.worker = '../../libs/other/physijs/physijs_worker.js';
    Physijs.scripts.ammo = './ammo.js';

    // use the defaults
    var stats = initStats();
    var renderer = initRenderer();
    camera = initCamera(new THREE.Vector3(0, 30, 30));
    camera.near = 10; camera.far = 650;
    camera.updateProjectionMatrix()
    // var trackballControls = initTrackballControls(camera, renderer);
    //var clock = new THREE.Clock();
    scene = new Physijs.Scene({reportSize: 10, fixedTimeStep: 1 / 60});
    scene.setGravity(new THREE.Vector3(0, -80, 0));
    initDefaultLighting(scene);
    
    createGroundAndWalls(scene);
    for(var i = 0; i < lampCount; i ++){ createLamp(i * 200) }
    for(var i = 0; i < carCount; i++){
        var c = createCar(scene, 200, i*100-200);
        cars.push(c);
    }

    //var butterfly = await createModels(scene, '/assets/models/butterfly/butterfly.obj');
    //butterfly.scale.set(30, 30, 30);
    //scene.add(butterfly);

    car = createCar(scene, 0, 0);
    //scene.simulate();
    var loosenXRight = 0;
    var loosenXLeft = 0;
    var velocity = -2;

    function updateCameraPosition(followedObject) {

        camera.position.x = followedObject.position.x;
        camera.position.y = followedObject.position.y + 15;
        camera.position.z = followedObject.position.z + 0; // 设置一个适当的距离
        camera.lookAt(followedObject.position);
        camera.rotation.copy(followedObject.rotation);
        camera.rotateY(-Math.PI/2);
        camera.translateZ(50);
        //console.log(followedObject.rotation.y);
 
    }
    function degToRad(deg){
        return deg / 180 * Math.PI;
    }
  
    render();
    function render() {
        updateCameraPosition(car.body);
    
        stats.update();
        
        velocityChange(velocity * 0.94);
        if(keys.l){
            directionChange(a + 0.05);
        }
        if(keys.r){
            directionChange(a - 0.05);
        }
        if(keys.t){
            if(velocity <= maxv)
            velocityChange(velocity + (velocity + minv) / 2);
        }
        if(keys.b){
            velocityChange(velocity + 0.4);
        }
        if(Math.abs(a) > 0.01)
            directionChange(a / (1 + Math.abs(velocity / 100)));
        else
            directionChange(0);
        // var delta = clock.getDelta();
        //trackballControls.update(delta);
        constraints.forEach(function(s){
            var pos = s[1].position;
            s[0].position.set(pos.x, pos.y, pos.z);
            s[0].rotation.copy(s[1].rotation);
            if(s[2])s[2]();
        });
        cars.forEach(function(c){
            var velocity = Math.random() * 10 - 25;
            c.flConstraint.configureAngularMotor(2, 0.1, 0, velocity, 15000);
            c.frConstraint.configureAngularMotor(2, 0.1, 0, velocity, 15000);
    
            // motor two is forward and backwards
            c.flConstraint.enableAngularMotor(2);
            c.frConstraint.enableAngularMotor(2);

            var angle = Math.random() * 3 -1.5;
            c.rrConstraint.setAngularLowerLimit({x: 0, y: angle, z: 0.1});
            c.rrConstraint.setAngularUpperLimit({x: loosenXRight, y: angle, z: 0});
            c.rlConstraint.setAngularLowerLimit({x: loosenXLeft, y: angle, z: 0.1});
            c.rlConstraint.setAngularUpperLimit({x: 0, y: angle, z: 0});
        });
        //console.log(car.body.rotation);
        requestAnimationFrame(render);
        renderer.render(scene, camera);
        //scene.simulate(undefined, 1);
        scene.simulate();
    }
    var a = 0;
    window.addEventListener('keydown', function(e){
        //console.log(e.code);
        switch(e.code){
            case 'ArrowUp':
                keys.t = true;
                break;
            case 'ArrowDown':
                keys.b = true;
                break;
            case 'ArrowLeft':
                keys.l = true;
                break;
            case 'ArrowRight':
                keys.r = true;
                break;
            case 'KeyW':
                if(minv > -30) {
                    minv -= 3;
                    velocityChange(velocity);
                    document.getElementById('dangwei').innerText = ''+(-minv / 3);
                }
                break;
            case 'KeyS':
                if(minv < -3) {
                    minv += 3;
                    velocityChange(velocity);
                    document.getElementById('dangwei').innerText = ''+(-minv / 3);
                }
                break;
        }
    });
    window.addEventListener('keyup', function(e){
        //console.log(e.code);
        switch(e.code){
            case 'ArrowUp':
                keys.t = false;
                break;
            case 'ArrowDown':
                keys.b = false;
                break;
            case 'ArrowLeft':
                keys.l = false;
                break;
            case 'ArrowRight':
                keys.r = false;
                break;
        }
    });
    
    function directionChange(angle){
        a = angle;
        if(a > 0.7) a = 0.7;
        if(a < -0.7) a = -0.7;
        car.rrConstraint.setAngularLowerLimit({x: 0, y: angle, z: 0.1});
        car.rrConstraint.setAngularUpperLimit({x: loosenXRight, y: angle, z: 0});
        car.rlConstraint.setAngularLowerLimit({x: loosenXLeft, y: angle, z: 0.1});
        car.rlConstraint.setAngularUpperLimit({x: 0, y: angle, z: 0});
    }
    function velocityChange(v) {
        velocity = v;
        if(velocity < minv) velocity = minv;
        // if you add a motor, the current constraint is overridden if you want to rotate set min higher then max
        car.flConstraint.configureAngularMotor(2, 0.1, 0, velocity, 15000);
        car.frConstraint.configureAngularMotor(2, 0.1, 0, velocity, 15000);

        // motor two is forward and backwards
        car.flConstraint.enableAngularMotor(2);
        car.frConstraint.enableAngularMotor(2);
    };

    directionChange(a);
    velocityChange(velocity);
}

function createCar(scene, x, z) {
    var car = {};
    var car_material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({color: Math.floor(Math.random() * 0x1000000), opacity: 0.9, transparent: true}),
        .2, // high friction
        .2 // medium restitution
    );

    // create the car body
    var geom = new THREE.BoxGeometry(15, 4, 4);
    var body = new Physijs.BoxMesh(geom, car_material, 6000);
    body.position.set(x+5, 5, z+5);
    body.castShadow = true;
    scene.add(body);
    const pointLight = new THREE.PointLight(0xffaaaa, 1, 100); 
    pointLight.position.set(5, 5, 5); 
    scene.add(pointLight);
    constraints.push([pointLight, body]);

    // 创建一个聚光灯
    const spotLight = new THREE.SpotLight(0xffffff, 1.0); // 白色，强度1.0
    spotLight.position.set(5, 5, 5); // 设置光源位置
    spotLight.target = new THREE.Object3D();
    spotLight.target.position.set(6, 5, 5); // 设置光源位置
    scene.add(spotLight);
    scene.add(spotLight.target);
    constraints.push([spotLight, body, function(){
        spotLight.target.position.copy(spotLight.position);
        spotLight.target.rotation.copy(body.rotation);
        spotLight.target.translateX(10);
    }]);

    // create the wheels
    var fr = createWheel(new THREE.Vector3(x+0, 4, z+10));
    var fl = createWheel(new THREE.Vector3(x+0, 4, z+0));
    var rr = createWheel(new THREE.Vector3(x+10, 4, z+10));
    var rl = createWheel(new THREE.Vector3(x+10, 4, z+0));
    
    // add the wheels to the scene
    scene.add(fr);
    scene.add(fl);
    scene.add(rr);
    scene.add(rl);

    var frConstraint = createWheelConstraint(fr, body, new THREE.Vector3(x+0, 4, z+8));
    scene.addConstraint(frConstraint);

    var flConstraint = createWheelConstraint(fl, body, new THREE.Vector3(x+0, 4, z+2));
    scene.addConstraint(flConstraint);

    var rrConstraint = createWheelConstraint(rr, body, new THREE.Vector3(x+10, 4, z+8));
    scene.addConstraint(rrConstraint);

    var rlConstraint = createWheelConstraint(rl, body, new THREE.Vector3(x+10, 4, z+2));
    scene.addConstraint(rlConstraint);


    // backwheels don't move themselves and are restriced in their
    // movement. They should be able to rotate along the z-axis
    // same here, if the complete angle is allowed set lower higher
    // than upper.
    // by setting the lower and upper to the same value you can
    // fix the position
    // we can set the x position to 'loosen' the axis for the directional
    rrConstraint.setAngularLowerLimit({x: 0, y: 0.5, z: 0.1});
    rrConstraint.setAngularUpperLimit({x: 0, y: 0.5, z: 0});
    rlConstraint.setAngularLowerLimit({x: 0, y: 0.5, z: 0.1});
    rlConstraint.setAngularUpperLimit({x: 0, y: 0.5, z: 0});


    // front wheels should only move along the z axis.
    // we don't need to specify anything here, since
    // that value is overridden by the motors
    frConstraint.setAngularLowerLimit({x: 0, y: 0, z: 0});
    frConstraint.setAngularUpperLimit({x: 0, y: 0, z: 0});
    flConstraint.setAngularLowerLimit({x: 0, y: 0, z: 0});
    flConstraint.setAngularUpperLimit({x: 0, y: 0, z: 0});

    // if you add a motor, the current constraint is overridden
    // if you want to rotate set min higher then max
    flConstraint.configureAngularMotor(2, 0.1, 0, 0, 1500);
    frConstraint.configureAngularMotor(2, 0.1, 0, 0, 1500);

    // motor one is for left and right
//                          frConstraint.enableAngularMotor(1);

    // motor two is forward and backwards
    flConstraint.enableAngularMotor(2);
    frConstraint.enableAngularMotor(2);

    car.flConstraint = flConstraint;
    car.frConstraint = frConstraint;
    car.rlConstraint = rlConstraint;
    car.rrConstraint = rrConstraint;
    car.body = body;
    car.fl = fl;
    car.fr = fr;
    car.rl = rl;
    car.rr = rr;
    car.light1 = spotLight;
    car.light2 = pointLight;

    return car;
}

function createWheelConstraint(wheel, body, position) {
    var constraint = new Physijs.DOFConstraint(
        wheel, body, position);

    return constraint;
}

function createWheel(position) {
    var wheel_material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({color: 0x444444, opacity: 0.9, transparent: true}),
        1, // high friction
        .5 // medium restitution
    );

    var wheel_geometry = new THREE.CylinderGeometry(4, 4, 2, 10);
    var wheel = new Physijs.CylinderMesh(
        wheel_geometry,
        wheel_material,
        400
    );

    wheel.rotation.x = Math.PI / 2;
    wheel.castShadow = true;
    wheel.position.copy(position);
    return wheel;
}

function createGroundAndWalls(scene) {
    var texture = THREE.ImageUtils.loadTexture('../../assets/textures/general/plaster.jpg');
    texture.repeat.x = 500
    texture.repeat.y = 500
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    var ground_material = Physijs.createMaterial(new THREE.MeshPhongMaterial({map: texture}), 1, 0.7);
    var ground = new Physijs.BoxMesh(new THREE.BoxGeometry(50000, 1, 80000), ground_material, 0);
    scene.add(ground);

    var wall_material = Physijs.createMaterial(
        new THREE.MeshPhysicalMaterial({
            color: 0xcccc00, // 颜色
            roughness: 0.1,  // 粗糙度
            metalness: 0.4   // 金属感
        }),
        1, //friction
        .5 //restitution
    );
    var wall1 = new Physijs.BoxMesh(new THREE.BoxGeometry(4, 40, 600), wall_material, 0);
    var wall2 = new Physijs.BoxMesh(new THREE.BoxGeometry(300, 40, 4), wall_material, 0);
    var wall3 = new Physijs.BoxMesh(new THREE.BoxGeometry(300, 40, 4), wall_material, 0);
    var wall4 = new Physijs.BoxMesh(new THREE.BoxGeometry(4, 40, 600), wall_material, 0);
    var wall5 = new Physijs.BoxMesh(new THREE.BoxGeometry(4, 40, 1200), wall_material, 0);
    wall1.position.set(500, 0, -600);
    wall2.position.set(350, 0, 300);
    wall3.position.set(350, 0, -300);
    wall4.position.set(500, 0, 600);
    wall5.position.set(600, 0, 0);
    scene.add(wall1);
    scene.add(wall2);
    scene.add(wall3);
    scene.add(wall4);
    scene.add(wall5);
}

function createLamp(z){
    
    //柱子
    var cubeGeometry = new THREE.BoxGeometry(4, 100, 4);
    var cubeMaterial = Physijs.createMaterial(
        new THREE.MeshPhysicalMaterial({
            color: 0x00ff00, // 颜色
            roughness: 0.1,  // 粗糙度
            metalness: 0.6   // 金属感
        }),
        1, //friction
        .5 //restitution
    );
    var cube = new Physijs.BoxMesh(cubeGeometry, cubeMaterial, 500);
    cube.position.set(100, 51, z);
    scene.add(cube);

    var spotLight2 = new THREE.SpotLight(0x111111);
    spotLight2.position.copy(new THREE.Vector3(100, 103, z));
    spotLight2.shadow.mapSize.width = 1000;
    spotLight2.shadow.mapSize.height = 1000;
    spotLight2.shadow.camera.fov = 10;
    spotLight2.castShadow = true;
    spotLight2.decay = 100;
    spotLight2.penumbra = 0.05;
    spotLight2.intensity = 10;
    spotLight2.name = "spotLight2";
    scene.add(spotLight2);


    //灯泡
    var boxGeometry = new THREE.BoxGeometry(4, 4, 4);
    var boxMaterial = Physijs.createMaterial(
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1 }),
        1, //friction
        .5 //restitution
    );
    var box = new Physijs.BoxMesh(boxGeometry, boxMaterial, 50);
    box.position.set(100, 103, z);
    scene.add(box);

    constraints.push([spotLight2, box]);

    var constraint = new Physijs.HingeConstraint(box, cube, cube.position, new THREE.Vector3(0, 2, 0));
    scene.addConstraint(constraint);
    constraint.setLimits(
        -3.14, // minimum angle of motion, in radians, from the point object 1 starts (going back)
        3.14, // maximum angle of motion, in radians, from the point object 1 starts (going forward)
        0.1, // applied as a factor to constraint error, how big the kantelpunt is moved when a constraint is hit
        0.2 // controls bounce at limit (0.0 == no bounce)
    );
    
}

function createModels(scene, objPath, mtlPath){
    return new Promise(function(resolve){
        if(mtlPath){
            const mtlLoader = new THREE.MTLLoader();
            mtlLoader.load(mtlPath, function(materials) {
                materials.preload();
                const objLoader = new THREE.OBJLoader();
                objLoader.setMaterials(materials);
                objLoader.load(objPath, function(object) {
                    //object.position.set(0, 0, 50);
                    //scene.add(object);
                    console.log(object);
                    var gg = new THREE.BoxGeometry(0.01, 0.01, 0.01);
                    var mm = new THREE.MeshDepthMaterial();
                    var nn = new Physijs.BoxMesh(gg, mm);
                    for(var i = 0; i < object.children.length; i++){
                        var mesh = object.children[i];
                        var g = mesh.geometry, m = mesh.material;
                        var newMesh = new Physijs.BoxMesh(g, m, 100);
                        newMesh.position.copy(mesh.position);
                        newMesh.rotation.copy(mesh.rotation);
                        newMesh.scale.copy(mesh.scale);
                        nn.add(newMesh);
                    }
                    // 设置位置和旋转，不触发物理事件
                    console.log(nn);
                    //nn.body.setTransform(new THREE.Vector3(0, -30, 0), new THREE.Quaternion());
                    //nn.position.set(100, 10, 0);
                    scene.add(nn);
                    resolve(nn);
                });
            });
        }else{
            const objLoader = new THREE.OBJLoader();
            objLoader.load(objPath, function(object) {
                console.log(object);
                var gg = new THREE.BoxGeometry(0.01, 0.01, 0.01);
                var mm = new THREE.MeshDepthMaterial();
                var nn = new Physijs.BoxMesh(gg, mm);
                for(var i = 0; i < object.children.length; i++){
                    var mesh = object.children[i];
                    var g = mesh.geometry, m = mesh.material;
                    var newMesh = new Physijs.BoxMesh(g, m, 100);
                    newMesh.position.copy(mesh.position);
                    newMesh.rotation.copy(mesh.rotation);
                    newMesh.scale.copy(mesh.scale);
                    nn.add(newMesh);
                }
                // 设置位置和旋转，不触发物理事件
                console.log(nn);
                //nn.body.setTransform(new THREE.Vector3(0, -30, 0), new THREE.Quaternion());
                //nn.position.set(100, 10, 0);
                scene.add(nn);
                resolve(nn);
            });
        }
    });
}

function removeCar(car){
    if(car.flConstraint)scene.removeConstraint(car.flConstraint);
    if(car.frConstraint)scene.removeConstraint(car.frConstraint);
    if(car.rlConstraint)scene.removeConstraint(car.rlConstraint);
    if(car.rrConstraint)scene.removeConstraint(car.rrConstraint);

    constraints = constraints.filter(ss=>(ss[0]!=car.light1)&&(ss[0]!=car.light2)&&(ss[1]!=car.body));
    if(car.body)scene.remove(car.body);
    if(car.fl)scene.remove(car.fl);
    if(car.fr)scene.remove(car.fr);
    if(car.rl)scene.remove(car.rl);
    if(car.rr)scene.remove(car.rr);
    if(car.light1)scene.remove(car.light1);
    if(car.light2)scene.remove(car.light2);

}

function refreshCar(){
    removeCar(car);
    car = createCar(scene, 0, 0);
    for(var i = 0; i < carCount; i++){
        removeCar(cars[i]);
        var c = createCar(scene, 200, i*100);
        cars[i] = c;
    }
}

