import { Color, FloatType, NormalBlending, PerspectiveCamera, RGBAFormat, Vector2, Vector4, WebGLRenderTarget, WebGLRenderer } from "three"
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass";
import { SobolNumberMapGenerator } from "../utils/SobolNumberMapGenerator"
import { PhysicalPathTracingMaterial } from "../materials/pathtracing/PhysicalPathTracingMaterial";

const originClearColor = new Color()
const _scissor = new Vector4()
const _viewport = new Vector4()

export class PathTracingRenderer {
    public camera: PerspectiveCamera | null = null;
    public samples: number = 0;
    public tiles: Vector2 = new Vector2(1, 1);

    #renderer: WebGLRenderer;
    #task: Generator<undefined, void, unknown> | null = null;
    #primaryTarget: WebGLRenderTarget = new WebGLRenderTarget(1, 1, {
        format: RGBAFormat,
        type: FloatType,
    });
    #fsQuad: FullScreenQuad = new FullScreenQuad();
    #subFrame: Vector4 = new Vector4(0, 0, 1, 1)
    #sobolTarget: WebGLRenderTarget;
    #opacityFactor: number = 1.0;
    #curTile: number = 0;

    get material() {
        return this.#fsQuad.material as any
    }

    set material(value) {
        this.#fsQuad.material = value
    }

    get target() {
        return this.#primaryTarget
    }

    constructor(renderer: WebGLRenderer) {
        this.#renderer = renderer
        this.#sobolTarget = new SobolNumberMapGenerator().generate(this.#renderer)
    }

    setSize(w, h) {
        const wp = Math.ceil(w);
        const hp = Math.ceil(h);

        if (this.#primaryTarget.width === wp && this.#primaryTarget.height === hp) {
            return;
        }

        this.#primaryTarget.setSize(wp, hp);
        this.reset();
    }

    dispose() {
        this.#primaryTarget.dispose();
        this.#task = null;
        this.#fsQuad.dispose()
        this.#sobolTarget.dispose()
    }

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

        this.samples = 0;
        this.#task = null;
    }

    *renderTask() {
        const { material } = this

        const originScissor = new Vector4();
        const originViewport = new Vector4();

        while (true) {
            material.opacity = this.#opacityFactor / (this.samples + 1)
            material.blending = NormalBlending

            const subX = this.#subFrame[0]
            const subY = this.#subFrame[1]
            const subW = this.#subFrame[2]
            const subH = this.#subFrame[3]

            const w = this.#primaryTarget.width
            const h = this.#primaryTarget.height
            material.resolution.set(w * subW, h * subH)
            material.sobolTexture = this.#sobolTarget.texture
            material.seed++

            const tilesX = this.tiles.x ?? 1
            const tilesY = this.tiles.y ?? 1
            const totalTiles = tilesX * tilesY
            const invPixelRatio = 1 / this.#renderer.getPixelRatio()

            // 分块渲染
            for (let y = 0; y < tilesY; y++) {
                for (let x = 0; x < tilesX; x++) {
                    material.cameraWorldMatrix.copy(this.camera?.matrixWorld)
                    material.invProjectMatrix.copy(this.camera?.projectionMatrixInverse)

                    // 设置相机类型为投影相机
                    material.setDefine('CAMERA_TYPE', 1);

                    // 计算当前渲染的块
                    let tx = x
                    let ty = y
                    const tileIdx = this.#curTile % (tilesX * tilesY)
                    tx = tileIdx % tilesX
                    ty = ~~(tileIdx / tilesX)
                    this.#curTile = tileIdx + 1

                    // 暂存之前的渲染结果
                    const originRenderTarget = this.#renderer.getRenderTarget()
                    const originAutoClear = this.#renderer.autoClear
                    const originScissorTest = this.#renderer.getScissorTest()
                    this.#renderer.getScissor(originScissor)
                    this.#renderer.getViewport(originViewport)

                    // 应用主画布
                    this.#renderer.setRenderTarget(this.#primaryTarget)
                    this.#renderer.setScissorTest(true)

                    _scissor.x = (tx * w) / tilesX
                    _scissor.y = ((tilesY - ty - 1) * h) / tilesY
                    _scissor.z = w / tilesX
                    _scissor.w = h / tilesY

                    _scissor.x = subX * w + subW * _scissor.x
                    _scissor.y = subY * h + subH * _scissor.y
                    _scissor.z = subW * _scissor.z
                    _scissor.w = subH * _scissor.w

                    _scissor.multiplyScalar(invPixelRatio).ceil()

                    _viewport.x = subX * w
                    _viewport.y = subY * h
                    _viewport.z = subW * w
                    _viewport.w = subH * h
                    _viewport.multiplyScalar(invPixelRatio).ceil()

                    this.#renderer.setScissor(_scissor)
                    this.#renderer.setViewport(_viewport)
                    this.#renderer.autoClear = false

                    // 渲染
                    this.#fsQuad.render(this.#renderer)

                    // 恢复之前的画布状态
                    this.#renderer.setViewport(originViewport)
                    this.#renderer.setScissor(originScissor)
                    this.#renderer.setScissorTest(originScissorTest)
                    this.#renderer.setRenderTarget(originRenderTarget)
                    this.#renderer.autoClear = originAutoClear

                    this.samples += 1 / totalTiles

                    // 计算完所有块后将四舍五入采样次数
                    if (x === tilesX - 1 && y === tilesY - 1) {
                        this.samples = Math.round(this.samples)
                    }

                    yield
                }
            }
        }
    }

    update() {
        if (!this.#task) {
            this.#task = this.renderTask()
        }
        this.#task.next()
    }
}