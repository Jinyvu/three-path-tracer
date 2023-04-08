import { Matrix4, Vector2 } from "three";
import { MaterialBase } from "../MaterialBase"
import { PhysicalCameraUniform } from "../../uniforms/PhysicalCameraUniform";
import { MeshBVHUniformStruct, UIntVertexAttributeTexture } from "three-mesh-bvh";
import { MaterialsTexture } from "../../../../render/src";
import { pcgGLSL } from "../../shader/rand/pcg.glsl";
import { sobolCommonGLSL, sobolSamplingGLSL } from "../../shader/rand/sobol.glsl";
import { renderStructsGLSL } from './glsl/renderStructs.glsl'
import { cameraUtilsGLSL } from './glsl/cameraUtils.glsl'
import { lightsStructGLSL } from '../../shader/struct/lightsStruct.glsl'
import { lightSamplingGLSL } from '../../shader/sampling/lightSampling.glsl'

export class PhysicalPathTracingMaterial extends MaterialBase {
    constructor(params) {
        super({
            transparent: true,
            depthWrite: false,
            defines: {
                FEATURE_MIS: 1, // MIS采样
                FEATURE_RUSSIAN_ROULETTE: 1,    // 俄罗斯轮盘
                FEATURE_DOF: 1, // 背景虚化
                FEATURE_BACKGROUND_MAP: 0,  // 环境贴图
                CAMERA_TYPE: 0, // 相机类型：0投影、1正交
            },
            uniforms: {
                resolution: { value: new Vector2() },
                bounces: { value: 10 }, // 最大弹射次数
                transmissiveBounces: { value: 10 }, // 最大投射弹射次数
                physicalCamera: { value: new PhysicalCameraUniform() },
                bvh: { value: new MeshBVHUniformStruct() },
                // attributesArray: { value: new AttributesTextureArray() },
                materialIndexAttribute: { value: new UIntVertexAttributeTexture() }, // 材质顶点索引
                materials: { value: new MaterialsTexture },
                environmentIntensity: { value: 1.0 }, // 环境光强度
                environmentRotation: { value: new Matrix4() },    // 环境贴图旋转矩阵
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    vUv = uv;
                }
            `,
            fragmentShader: `
                #define INFINITY 1e20

                // bvh

                // random

                // utils

                // sampling

                // uniforms

                // light
                uniform sampler2DArray 
            `
        })

        this.setValues(params)
    }

    onBeforeRender() {
        // 背景虚化
        this.setDefine('FEATURE_DOF', this.physicalCamera.bokehSize === 0 ? 0 : 1);
        // 环境贴图
        this.setDefine('FEATURE_BACKGROUND_MAP', this.backgroundMap ? 1 : 0);
    }
}