import {
    Color,
    FloatType,
    NormalBlending,
    PerspectiveCamera,
    RGBAFormat,
    Vector2,
    Vector4,
    WebGLRenderTarget,
    WebGLRenderer,
} from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass";
import { SobolNumberMapGenerator } from "../utils/SobolNumberMapGenerator";

const originClearColor = new Color();
// 屏幕划分裁剪区域
const _scissor = new Vector4();
// 渲染区域
const _viewport = new Vector4();

export class PathTracingRenderer {
    public camera: PerspectiveCamera | null = null; // 相机
    public tiles: Vector2 = new Vector2(1, 1);  // 屏幕划分的块数
    public stableTiles: boolean = true;
    public stableNoise = false  // 每次重置画布时，是否也把采样噪声重置

    #samples: number = 0;   // 采样次数
    #renderer: WebGLRenderer;   // 渲染器
    #task: Generator<undefined, void, unknown> | null = null;   // 渲染任务
    #primaryTarget: WebGLRenderTarget = new WebGLRenderTarget(1, 1, {   // 主画布
        format: RGBAFormat,
        type: FloatType,
    });
    #fsQuad: FullScreenQuad = new FullScreenQuad(null); // 屏幕划分对象
    #subFrame: Vector4 = new Vector4(0, 0, 1, 1);   // 用于控制渲染的画面呈现在整个画布的哪块区域，默认是占满整张画布
    #sobolTarget: WebGLRenderTarget;    // sobol纹理，噪声纹理，用于保证采样的随机性
    #opacityFactor: number = 1.0;   // 透明度
    #curTile: number = 0;   // 当前渲染的屏幕块

    get material() {
        return this.#fsQuad.material as any;
    }

    set material(value) {
        this.#fsQuad.material = value;
    }

    get target() {
        return this.#primaryTarget;
    }

    get samples() {
        return this.#samples
    }

    constructor(renderer: WebGLRenderer) {
        this.#renderer = renderer;
        this.#sobolTarget = new SobolNumberMapGenerator().generate(
            this.#renderer
        );
    }

    /**
     * 设置主画布尺寸
     * @param w 宽
     * @param h 高
     * @returns 
     */
    setSize(w, h) {
        const wp = Math.ceil(w);
        const hp = Math.ceil(h);

        if (
            this.#primaryTarget.width === wp &&
            this.#primaryTarget.height === hp
        ) {
            return;
        }

        this.#primaryTarget.setSize(wp, hp);
        this.reset();
    }

    /**
     * 析构函数
     */
    dispose() {
        this.#primaryTarget.dispose();
        this.#sobolTarget.dispose();
        this.#fsQuad.dispose();
        this.#task = null;
    }

    /**
     * 重置主画布
     */
    reset() {
        // 暂存当前画布
        const originRenderTarget = this.#renderer.getRenderTarget();
        const originClearAlpha = this.#renderer.getClearAlpha();
        this.#renderer.getClearColor(originClearColor);

        // 清空主画布
        this.#renderer.setRenderTarget(this.#primaryTarget);
        this.#renderer.setClearColor(0, 0);
        this.#renderer.clearColor();

        // 恢复当前画布
        this.#renderer.setClearColor(originClearColor, originClearAlpha);
        this.#renderer.setRenderTarget(originRenderTarget);

        this.#samples = 0;
        this.#task = null;

        if (this.stableNoise) {
            this.material.seed = 0;
        }
    }

    /**
     * 渲染任务生成器
     */
    *renderTask() {
        const { material } = this;

        // 用于存储原始画布的裁剪数据
        const originScissor = new Vector4();
        // 用于存储原始画布的视窗数据
        const originViewport = new Vector4();

        while (true) {
            // 设置材质透明度，与采样次数相关，用于体现本次采样结果对于最终结果的权重
            material.opacity = this.#opacityFactor / (this.samples + 1);
            material.blending = NormalBlending;

            // 获取控制渲染区域的参数
            const subX = this.#subFrame[0];
            const subY = this.#subFrame[1];
            const subW = this.#subFrame[2];
            const subH = this.#subFrame[3];

            // 主画布宽高
            const w = this.#primaryTarget.width;
            const h = this.#primaryTarget.height;
            // 设置材质解析率
            material.resolution.set(w * subW, h * subH);
            // 设置材质sobol纹理
            material.sobolTexture = this.#sobolTarget.texture;
            // 采样相关，sobol纹理对应的seed参数
            material.seed++;

            const tilesX = this.tiles.x || 1;
            const tilesY = this.tiles.y || 1;
            const totalTiles = tilesX * tilesY;
            const invPixelRatio = 1 / this.#renderer.getPixelRatio();

            // 分块渲染
            for (let y = 0; y < tilesY; y++) {
                for (let x = 0; x < tilesX; x++) {
                    material.cameraWorldMatrix.copy(this.camera?.matrixWorld);
                    material.invProjectionMatrix.copy(
                        this.camera?.projectionMatrixInverse
                    );

                    // 设置相机类型为投影相机
                    material.setDefine("CAMERA_TYPE", 0);

                    // 暂存之前的渲染结果
                    const originRenderTarget = this.#renderer.getRenderTarget();
                    const originAutoClear = this.#renderer.autoClear;
                    const originScissorTest = this.#renderer.getScissorTest();
                    this.#renderer.getScissor(originScissor);
                    this.#renderer.getViewport(originViewport);

                    // 计算当前渲染的块
                    let tx = x;
                    let ty = y;
                    if (!this.stableTiles) {
                        const tileIdx = this.#curTile % (tilesX * tilesY);
                        tx = tileIdx % tilesX;
                        ty = ~~(tileIdx / tilesX);
                        this.#curTile = tileIdx + 1;
                    }

                    // 应用主画布
                    this.#renderer.setRenderTarget(this.#primaryTarget);
                    this.#renderer.setScissorTest(true);

                    // 计算当前划分区域的起始位置和长宽
                    _scissor.x = (tx * w) / tilesX;
                    _scissor.y = ((tilesY - ty - 1) * h) / tilesY;
                    _scissor.z = w / tilesX;
                    _scissor.w = h / tilesY;

                    _scissor.x = subX * w + subW * _scissor.x;
                    _scissor.y = subY * h + subH * _scissor.y;
                    _scissor.z = subW * _scissor.z;
                    _scissor.w = subH * _scissor.w;

                    _scissor.x = _scissor.x;
                    _scissor.y = _scissor.y;
                    _scissor.z = _scissor.z;
                    _scissor.w = _scissor.w;

                    // 屏幕上的一像素可能是由多个实际像素表示的，控制区域的像素个数与屏幕像素一致，可以减少计算或保证分辨率
                    _scissor.multiplyScalar(invPixelRatio).ceil();

                    // 设置渲染区域（会把图像渲染到画布的哪块区域）
                    _viewport.x = subX * w;
                    _viewport.y = subY * h;
                    _viewport.z = subW * w;
                    _viewport.w = subH * h;
                    _viewport.multiplyScalar(invPixelRatio).ceil();

                    this.#renderer.setScissor(_scissor);
                    this.#renderer.setViewport(_viewport);
                    this.#renderer.autoClear = false;

                    // 渲染
                    this.#fsQuad.render(this.#renderer);

                    // 恢复之前的画布状态
                    this.#renderer.setViewport(originViewport);
                    this.#renderer.setScissor(originScissor);
                    this.#renderer.setScissorTest(originScissorTest);
                    this.#renderer.setRenderTarget(originRenderTarget);
                    this.#renderer.autoClear = originAutoClear;

                    this.#samples += 1 / totalTiles;

                    // 计算完所有块后将四舍五入采样次数
                    if (x === tilesX - 1 && y === tilesY - 1) {
                        this.#samples = Math.round(this.#samples);
                    }

                    yield;
                }
            }
        }
    }

    /**
     * 添加渲染任务
     */
    update() {
        if (!this.#task) {
            this.#task = this.renderTask();
        }
        this.#task.next();
    }
}
