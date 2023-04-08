import { ShaderMaterial } from "three";

// 基础材质类
export class MaterialBase extends ShaderMaterial {
    constructor(shader?) {
        super(shader);

        // 直接暴露uniforms上的属性
        for (const key in this.uniforms) {
            Object.defineProperty(this, key, {
                get() {
                    return this.uniforms[key].value;
                },

                set(v) {
                    this.uniforms[key].value = v;
                },
            });
        }
    }

    // 设置shader中的define数据
    setDefine(name, value = undefined) {
        if (value === undefined || value === null) {
            if (name in this.defines) {
                delete this.defines[name];
                this.needsUpdate = true;
            }
        } else {
            if (this.defines[name] !== value) {
                this.defines[name] = value;
                this.needsUpdate = true;
            }
        }
    }
}