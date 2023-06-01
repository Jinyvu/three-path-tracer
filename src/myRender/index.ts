import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { envMaps, models } from "./render.config";
import {
    ACESFilmicToneMapping,
    Box3,
    Color,
    CustomBlending,
    DoubleSide,
    FloatType,
    Group,
    LoadingManager,
    Mesh,
    MeshBasicMaterial,
    MeshPhysicalMaterial,
    MeshStandardMaterial,
    NoToneMapping,
    PerspectiveCamera,
    PlaneGeometry,
    Scene,
    Sphere,
    WebGLRenderer,
    sRGBEncoding,
} from "three";
import { PathTracingRenderer } from "./src/core/PathTracingRenderer.js";
import { PhysicalPathTracingMaterial } from "./src/materials/pathtracing/PhysicalPathTracingMaterial";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass";
import { generateRadialFloorTexture } from "./utils/generateRadialFloorTexture";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { GradientEquirectTexture } from "./src/textures/GradientEquirectTexture";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { BlurredEnvMapGenerator } from "./src/utils/BlurredEnvMapGenerator";
import { MaterialReducer } from "./src/core/MaterialReducer";
import { PathTracingSceneWorker } from "./src/works/PathTracingSceneWorker";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

let initialModel = Object.keys(models)[3];
console.log("initialModel", initialModel);

// 初始化配置参数
const params = {
    canvas: null,

    multipleImportanceSampling: true,
    acesToneMapping: true,
    resolutionScale: 1 / window.devicePixelRatio,
    tilesX: 10,
    tilesY: 10,
    samplesPerFrame: 1,

    model: initialModel,

    envMap: envMaps["Aristea Wreck Puresky"],

    gradientTop: "#bfd8ff",
    gradientBottom: "#ffffff",

    environmentIntensity: 1.0,
    environmentBlur: 0.0,
    environmentRotation: 0,

    cameraProjection: "Perspective",

    backgroundType: "Gradient",
    bgGradientTop: new Color().set("#111111"),
    bgGradientBottom: new Color().set("#000000"),
    backgroundAlpha: 1.0,
    checkerboardTransparency: true,

    enable: false,
    bounces: 5,
    filterGlossyFactor: 0.5,
    pause: false,

    floorColor: new Color("#111111"),
    floorOpacity: 1.0,
    floorRoughness: 0.2,
    floorMetalness: 0.2,
};

// 容器
let loadingEl: HTMLElement, samplesEl: HTMLElement, canvasEl: HTMLCanvasElement;
// 渲染器
let renderer: WebGLRenderer, ptRenderer: PathTracingRenderer;
// 场景
let scene: Scene, sceneInfo;
// 相机, 控制器
let perspectiveCamera: PerspectiveCamera, controls: OrbitControls;
// 屏幕分割对象
let fsQuad: FullScreenQuad;
// 背景
let envMap,
    backgroundMap: GradientEquirectTexture,
    envMapGenerator: BlurredEnvMapGenerator;
// 辅助
let floorPlane: Mesh<PlaneGeometry, MeshStandardMaterial>,
    stats: Stats,
    gui: GUI;
// 状态
let loadingModel = false,
    delaySamples = 0;

interface IInit {
    canvasId: string;
    loadingId: string;
    samplesId: string;
}

// 初始化
export default async function init({ canvasId, loadingId, samplesId }: IInit) {
    // 获取容器
    canvasEl = document.getElementById(canvasId) as HTMLCanvasElement;
    loadingEl = document.getElementById(loadingId) as HTMLElement;
    samplesEl = document.getElementById(samplesId) as HTMLElement;
    params.canvas = canvasEl;

    // 实例化three渲染器
    renderer = new WebGLRenderer({
        canvas: canvasEl,
        antialias: true,
        preserveDrawingBuffer: true,
    });
    renderer.outputEncoding = sRGBEncoding;
    renderer.toneMapping = ACESFilmicToneMapping;

    // 实例化场景对象
    scene = new Scene();

    // 设置投影相机
    const aspect = window.innerWidth / window.innerHeight;
    perspectiveCamera = new PerspectiveCamera(60, aspect, 0.025, 500);
    perspectiveCamera.position.set(-1, 0.25, 1);

    // 设置背景贴图
    backgroundMap = new GradientEquirectTexture();
    backgroundMap.topColor.set(params.bgGradientTop);
    backgroundMap.bottomColor.set(params.bgGradientBottom);
    backgroundMap.update();

    // 初始化路径追踪渲染器
    ptRenderer = new PathTracingRenderer(renderer);
    ptRenderer.camera = perspectiveCamera;
    // ptRenderer.alpha = true;
    ptRenderer.material = new PhysicalPathTracingMaterial();
    ptRenderer.tiles.set(params.tilesX, params.tilesY);
    ptRenderer.material.setDefine(
        "FEATURE_MIS",
        Number(params.multipleImportanceSampling)
    );
    ptRenderer.material.backgroundMap = backgroundMap;
    ptRenderer.material.transmissiveBounces = 10;

    // 屏幕分割，性能优化
    fsQuad = new FullScreenQuad(
        new MeshBasicMaterial({
            map: ptRenderer.target.texture,
            blending: CustomBlending,
            premultipliedAlpha:
                renderer.getContextAttributes().premultipliedAlpha,
        })
    );

    // 实例化场景控制器
    controls = new OrbitControls(perspectiveCamera, renderer.domElement);
    controls.addEventListener("change", resetRenderer);

    // 环境模糊度
    envMapGenerator = new BlurredEnvMapGenerator(renderer);

    // 实例化地板
    const floorTex = generateRadialFloorTexture(2048);
    floorPlane = new Mesh(
        new PlaneGeometry(),
        new MeshStandardMaterial({
            map: floorTex,
            transparent: true,
            color: 0x111111,
            roughness: 0.1,
            metalness: 0.0,
            side: DoubleSide,
        })
    );
    floorPlane.scale.setScalar(5);
    floorPlane.rotation.x = -Math.PI / 2;

    // 添加帧数显示器
    stats = new Stats();
    document.body.appendChild(stats.dom);

    // 添加背景贴图
    scene.background = backgroundMap;

    // 设置屏幕划分块数
    ptRenderer.tiles.set(params.tilesX, params.tilesY);

    updateModel();
    updateEnvMap();
    onResize();

    animate();

    window.addEventListener("resize", onResize);
}

// 连续渲染
function animate() {
    requestAnimationFrame(animate);

    stats.update();

    if (loadingModel) {
        return;
    }

    floorPlane.material.color.set(params.floorColor);
    floorPlane.material.roughness = params.floorRoughness;
    floorPlane.material.metalness = params.floorMetalness;
    floorPlane.material.opacity = params.floorOpacity;

    // 光栅化
    if (ptRenderer.samples < 1.0 || !params.enable) {
        renderer.render(scene, perspectiveCamera);
    }

    // 光追
    if (params.enable && delaySamples === 0) {
        const samples = Math.floor(ptRenderer.samples);
        samplesEl.innerText = `samples: ${samples}`;

        // 纹理材质归一化
        ptRenderer.material.materials.updateFrom(
            sceneInfo.materials,
            sceneInfo.textures
        );
        // ptRenderer.material.filterGlossyFactor = params.filterGlossyFactor;
        ptRenderer.material.environmentIntensity = params.environmentIntensity;
        ptRenderer.material.bounces = params.bounces;
        ptRenderer.material.physicalCamera.updateFrom(perspectiveCamera);

        perspectiveCamera.updateMatrixWorld();

        if (!params.pause || ptRenderer.samples < 1) {
            for (let i = 0, l = params.samplesPerFrame; i < l; i++) {
                ptRenderer.update();
            }
        }

        renderer.autoClear = false;
        fsQuad.render(renderer);
        renderer.autoClear = true;
    } else if (delaySamples > 0) {
        delaySamples--;
    }

    samplesEl.innerText = `Samples: ${Math.floor(ptRenderer.samples)}`;
}

function resetRenderer() {
    if (params.tilesX * params.tilesY !== 1.0) {
        delaySamples = 1;
    }

    ptRenderer.reset();
}

// window尺寸变化时，调整渲染器和相机
function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scale = params.resolutionScale;
    const dpr = window.devicePixelRatio;

    ptRenderer.setSize(w * scale * dpr, h * scale * dpr);
    ptRenderer.reset();

    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio * scale);

    const aspect = w / h;
    perspectiveCamera.aspect = aspect;
    perspectiveCamera.updateProjectionMatrix();
}

// 生成gui
function buildGui() {
    if (gui) {
        gui.destroy();
    }

    gui = new GUI({ container: document.getElementById("gui") });

    gui.add(params, "model", Object.keys(models)).onChange(updateModel);

    const pathTracingFolder = gui.addFolder("path tracing");
    pathTracingFolder.add(params, "enable");
    pathTracingFolder.add(params, "pause");
    pathTracingFolder
        .add(params, "multipleImportanceSampling")
        .onChange((v) => {
            ptRenderer.material.setDefine("FEATURE_MIS", Number(v));
            ptRenderer.reset();
        });
    pathTracingFolder.add(params, "acesToneMapping").onChange((v) => {
        renderer.toneMapping = v ? ACESFilmicToneMapping : NoToneMapping;
    });
    pathTracingFolder.add(params, "bounces", 1, 20, 1).onChange(() => {
        ptRenderer.reset();
    });
    // pathTracingFolder.add(params, "filterGlossyFactor", 0, 1).onChange(() => {
    // 	ptRenderer.reset();
    // });

    const resolutionFolder = gui.addFolder("resolution");
    resolutionFolder
        .add(params, "resolutionScale", 0.1, 1.0, 0.01)
        .onChange(() => {
            onResize();
        });
    resolutionFolder.add(params, "samplesPerFrame", 1, 10, 1);
    resolutionFolder.add(params, "tilesX", 1, 10, 1).onChange((v) => {
        ptRenderer.tiles.x = v;
    });
    resolutionFolder.add(params, "tilesY", 1, 10, 1).onChange((v) => {
        ptRenderer.tiles.y = v;
    });
    resolutionFolder.open();

    const environmentFolder = gui.addFolder("environment");
    environmentFolder
        .add(params, "envMap", envMaps)
        .name("map")
        .onChange(updateEnvMap);
    environmentFolder
        .add(params, "environmentBlur", 0.0, 1.0)
        .onChange(() => {
            updateEnvBlur();
            ptRenderer.reset();
        })
        .name("env map blur");
    environmentFolder
        .add(params, "environmentIntensity", 0.0, 10.0)
        .onChange(() => {
            ptRenderer.reset();
        })
        .name("intensity");
    // environmentFolder
    // 	.add(params, "environmentRotation", 0, 2 * Math.PI)
    // 	.onChange((v) => {
    // 		ptRenderer.material.environmentRotation.makeRotationY(v);
    // 		ptRenderer.reset();
    // 	});
    environmentFolder.open();

    const backgroundFolder = gui.addFolder("background");
    backgroundFolder
        .add(params, "backgroundType", ["Environment", "Gradient"])
        .onChange((v) => {
            if (v === "Gradient") {
                scene.background = backgroundMap;
                ptRenderer.material.backgroundMap = backgroundMap;
            } else {
                scene.background = scene.environment;
                ptRenderer.material.backgroundMap = null;
            }

            ptRenderer.reset();
        });
    backgroundFolder.addColor(params, "bgGradientTop").onChange((v) => {
        backgroundMap.topColor.set(v);
        backgroundMap.update();

        ptRenderer.reset();
    });
    backgroundFolder.addColor(params, "bgGradientBottom").onChange((v) => {
        backgroundMap.bottomColor.set(v);
        backgroundMap.update();

        ptRenderer.reset();
    });
    // backgroundFolder.add(params, "backgroundAlpha", 0, 1).onChange((v) => {
    // 	ptRenderer.material.backgroundAlpha = v;
    // 	ptRenderer.reset();
    // });
    // backgroundFolder.add(params, "checkerboardTransparency").onChange((v) => {
    // 	if (v) document.body.classList.add("checkerboard");
    // 	else document.body.classList.remove("checkerboard");
    // });

    const floorFolder = gui.addFolder("floor");
    floorFolder.addColor(params, "floorColor").onChange(() => {
        ptRenderer.reset();
    });
    floorFolder.add(params, "floorRoughness", 0, 1).onChange(() => {
        ptRenderer.reset();
    });
    floorFolder.add(params, "floorMetalness", 0, 1).onChange(() => {
        ptRenderer.reset();
    });
    floorFolder.add(params, "floorOpacity", 0, 1).onChange(() => {
        ptRenderer.reset();
    });
    floorFolder.close();
}

// 更新环境贴图
function updateEnvMap() {
    new RGBELoader().setDataType(FloatType).load(params.envMap, (texture) => {
        if (scene.environment) {
            scene.environment.dispose();
            envMap.dispose();
        }

        envMap = texture;
        updateEnvBlur();
        ptRenderer.reset();
    });
}

function updateEnvBlur() {
    const blurredEnvMap = envMapGenerator.generate(
        envMap,
        params.environmentBlur
    );
    ptRenderer.material.envMapInfo.updateFrom(blurredEnvMap);

    scene.environment = blurredEnvMap;
    if (params.backgroundType !== "Gradient") {
        scene.background = blurredEnvMap;
    }
}

// 将设置有透明度的材质转换为MeshPhysicalMaterial材质
function convertOpacityToTransmission(model, ior) {
    model.traverse((c) => {
        if (c.material) {
            const material = c.material;
            if (material.opacity < 0.65 && material.opacity > 0.2) {
                const newMaterial = new MeshPhysicalMaterial();
                for (const key in material) {
                    if (key in material) {
                        if (material[key] === null) {
                            continue;
                        }

                        if (material[key].isTexture) {
                            newMaterial[key] = material[key];
                        } else if (
                            material[key].copy &&
                            material[key].constructor ===
                                newMaterial[key].constructor
                        ) {
                            newMaterial[key].copy(material[key]);
                        } else if (typeof material[key] === "number") {
                            newMaterial[key] = material[key];
                        }
                    }
                }

                newMaterial.opacity = 1.0;
                newMaterial.transmission = 1.0;
                newMaterial.ior = ior;

                const hsl = { h: 0, s: 0, l: 0 };
                newMaterial.color.getHSL(hsl);
                hsl.l = Math.max(hsl.l, 0.35);
                newMaterial.color.setHSL(hsl.h, hsl.s, hsl.l);

                c.material = newMaterial;
            }
        }
    });
}

// 加载模型，并进行数据初始化，生成gui
export async function updateModel(modelFile?: File | string) {
    return new Promise((resolve, reject) => {
        if (gui) {
            document.body.classList.remove("checkerboard");
            gui.destroy();
            gui = null;
        }

        let model;
        const manager = new LoadingManager();
        const modelInfo = models[params.model];

        loadingModel = true;
        renderer.domElement.style.visibility = "hidden";
        samplesEl.innerText = "--";
        loadingEl.innerText = "Loading";
        loadingEl.style.visibility = "visible";

        // 销毁场景中所有带纹理的物体
        scene.traverse((c) => {
            // @ts-ignore
            if (c.material) {
                // @ts-ignore
                const material = c.material;
                for (const key in material) {
                    if (material[key] && material[key].isTexture) {
                        material[key].dispose();
                    }
                }
            }
        });

        if (sceneInfo) {
            console.log(scene);
            console.log(sceneInfo.scene);
            scene.remove(sceneInfo.scene);
            console.log(scene);
        }

        const onFinish = async () => {
            // 删除自发光材质
            if (modelInfo.removeEmission) {
                model.traverse((c) => {
                    if (c.material) {
                        c.material.emissiveMap = null;
                        c.material.emissiveIntensity = 0;
                    }
                });
            }

            // 将设置有透明度的材质转化为MeshPhysicalMaterial材质
            if (modelInfo.opacityToTransmission) {
                convertOpacityToTransmission(model, modelInfo.ior || 1.5);
            }

            // 为材质设置厚度
            model.traverse((c) => {
                if (c.material) {
                    c.material.thickness = 1.0;
                }
            });

            // 对模型应用后处理操作
            if (modelInfo.postProcess) {
                modelInfo.postProcess(model);
            }

            // 旋转模型
            if (modelInfo.rotation) {
                model.rotation.set(...modelInfo.rotation);
            }

            // 模型居中
            const box = new Box3();
            box.setFromObject(model);
            model.position
                .addScaledVector(box.min, -0.5)
                .addScaledVector(box.max, -0.5);

            const sphere = new Sphere();
            box.getBoundingSphere(sphere);

            model.scale.setScalar(1 / sphere.radius);
            model.position.multiplyScalar(1 / sphere.radius);

            box.setFromObject(model);

            model.updateMatrixWorld();

            // 添加地板
            const group = new Group();
            floorPlane.position.y = box.min.y;
            group.add(model, floorPlane);

            // 将group中的所有material抽离保存在一个数组中，所有的texture抽离保存在一个数组中
            const reducer = new MaterialReducer();
            reducer.process(group);

            // 使用webWork进行空间划分
            const generator = new PathTracingSceneWorker();

            // 空间划分结果result: {scene, materials, textures, lights, bvh}
            const result = await generator.generate(group, {
                onProgress: (v) => {
                    const percent = Math.floor(100 * v);
                    loadingEl.innerText = `Building BVH : ${percent}%`;
                },
            });

            sceneInfo = result;
            scene.add(sceneInfo.scene);

            // 空间划分时，会将场景中的所有材质、纹理和光源提取出来，同时生成空间划分结果
            const { bvh, textures, materials, lights } = result;
            const geometry = bvh.geometry;
            const material = ptRenderer.material;
            // 为PBM设置参数
            material.bvh.updateFrom(bvh); // ？
            material.attributesArray.updateFrom(
                geometry.attributes.normal,
                geometry.attributes.tangent,
                geometry.attributes.uv,
                geometry.attributes.color
            ); // 将geometry的normal、tangent、uv、color以dataTexture的形式存储
            material.materialIndexAttribute.updateFrom(
                geometry.attributes.materialIndex
            ); // 建立每个顶点对材质的索引
            material.textures.setTextures(renderer, 2048, 2048, textures); // 将场景中的所有纹理以2048*2048的格式存储
            material.materials.updateFrom(materials, textures); // 保存材质信息以及材质对应的纹理
            material.lights.updateFrom(lights); // 保存光源信息

            generator.dispose();

            loadingEl.style.visibility = "hidden";

            params.bounces = modelInfo.bounces || 5;
            params.floorColor = modelInfo.floorColor || "#111111";
            params.floorRoughness = modelInfo.floorRoughness || 0.2;
            params.floorMetalness = modelInfo.floorMetalness || 0.2;
            params.bgGradientTop = modelInfo.gradientTop || "#111111";
            params.bgGradientBottom = modelInfo.gradientBot || "#000000";

            backgroundMap.topColor.set(params.bgGradientTop);
            backgroundMap.bottomColor.set(params.bgGradientBottom);
            backgroundMap.update();

            buildGui();

            loadingModel = false;
            renderer.domElement.style.visibility = "visible";
            if (params.checkerboardTransparency) {
                document.body.classList.add("checkerboard");
            }

            ptRenderer.reset();

			resolve(1)
        };

        // 加载模型
        manager.setURLModifier((url) => url);

        let url = modelInfo.url
        if(modelFile instanceof File){
            url = modelFile.name
            manager.setURLModifier((url) => {
                return URL.createObjectURL(modelFile);
            });
        }
        else if(typeof modelFile === 'string'){
            url = modelFile
        }
        
        if (/(gltf|glb)$/i.test(url)) {
            manager.onLoad = onFinish;
            new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder).load(
                url,
                (gltf) => {
                    model = gltf.scene;
                },
                (progress) => {
                    if (
                        progress.total !== 0 &&
                        progress.total >= progress.loaded
                    ) {
                        const percent = Math.floor(
                            (100 * progress.loaded) / progress.total
                        );
                        loadingEl.innerText = `Loading : ${percent}%`;
                    }
                }
            );
        }
    });
}

export function getSnapshot() {
    // 创建一个超链接元素，用来下载保存数据的文件
    // let link = document.createElement("a");
    // 通过超链接herf属性，设置要保存到文件中的数据
    let canvas = renderer.domElement; //获取canvas对象

    return dataURLtoFile(canvas.toDataURL("image/jpeg"), 'snapshot.jpeg')
    // link.href = canvas.to("image/png");
    // link.download = "threejs.png"; //下载文件名
    // link.click(); //js代码触发超链接元素a的鼠标点击事件，开始下载文件到本地
    // document.body.appendChild(link);
}


function dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}