#define INFINITY 1e20

precision highp isampler2D;
precision highp usampler2D;
precision highp sampler2DArray;

#include<common>

varying vec2 vUv

// bvh

// random
${pcgGLSL}
${sobolCommonGLSL}
${sobolSamplingGLSL}

// common
${arraySamplerTexelFetchGLSL}
${fresnelGLSL}
${utilsGLSL}
${mathGLSL}
${intersectShapesGLSL}

// sampling
${lightSamplingGLSL}
${shapeSamplingGLSL}
${equirectSamplingGLSL}

// struct
${lightsStructGLSL}
${equirectStructGLSL}

// environment
uniform EquirectHdrInfo envMapInfo;
uniform mat4 environmentRotation;
uniform float environmentIntensity;

// light
uniform sampler2DArray iesProfiles;
uniform LightsInfo lights;

// background
uniform float backgroundBlur;
uniform float backgroundAlpha;

#if FEATURE_BACKGROUND_MAP
uniform sampler2D backgroundMap;
#endif

// camera
uniform mat4 cameraWorldMatrix;
uniform mat4 invProjectionMatrix;

// geometry
uniform sampler2DArray attributesArray;
uniform usampler2D materialIndexAttribute;

// path tracer
uniform int bounces;
uniform int transmissiveBounces;
uniform int seed;

// image
uniform vec2 resolution;
uniform float opacity;

// rotation
mat3 envRotation;
mat3 invEnvRotation;

// global
float lightsDenom;

// 采样环境贴图
vec3 sampleBackground(vec3 direction,vec2 uv){
    vec3 sampleDir=normalize(direction+sampleHemisphere(direction,uv)*.5*backgroundBlur);
    #if FEATURE_BACKGROUND_MAP
    return sampleEquirectColor(backgroundMap,sampleDir);
    #else
    return environmentIntensity*sampleEquirectColor(envMapInfo.map,sampleDir);
    #endif
    
}

${renderStructsGLSL}
${cameraUtilsGLSL}
${traceSceneGLSL}
${getSurfaceRecordGLSL}
${directLightContributionGLSL}

void main(){
    // init random
    rng_initialize(gl_FragCoord.xy,seed);
    sobolPixelIndex=(uint(gl_FragCoord.x)<<16)|uint(gl_FragCoord.y);
    sobolPathIndex=uint(seed);
    
    // ray from camera
    Ray ray=getCameraRay();
    
    // rotate environment
    envRotation=mat3(environmentRotation);
    invEnvRotation=inverse(envRotation);
    lightsDenom=environmentIntensity==0.&&lights.count!=0u?float(lights.count):float(lights.count+1u);
    
    gl_FragColor=vec4(0,0,0,1);
    
    // surface
    SurfaceHit surfaceHit;
    LightRecord lightRec;
    ScatterRecord scatterRec;
    
    // path tracing state
    RenderState state=initRenderState();
    state.transmissiveTraversals=transmissiveBounces;
    
    // main process
    for(int i=0;i<bounces;i++){
        // sobolBounceIndex++;
        
        state.depth++;
        state.traversals=bounces-i;
        state.firstRay=i==0&&state.transmissiveTraversals==transmissiveBounces;
        
        // 光线求交
        int hitType=traceScene(ray,bvh,lights,state.fogMaterial,surfaceHit,lightRec);
        
        // 命中光源
        if(hitType==LIGHT_HIT){
            // 透射
            if(state.firstRay||state.transmissiveRay){
                gl_FragColor.rgb+=lightRec.emission*state.throughputColor;
            }
            else{
                #if FEATURE_MIS
                // 对于精确光源，不使用MIS
                if(lightRec.type==SPOT_LIGHT_TYPE||lightRec.type==DIR_LIGHT_TYPE||lightRec.type==POINT_LIGHT_TYPE){
                    gl_FragColor.rgb+=lightRec.emission*state.throughputColor;
                }else{
                    float misWeight=misHeuristic(scatterRec.pdf,lightRec.pdf/lightsDenom);
                    gl_FragColor.rgb+=lightRec.emission*state.throughputColor*misWeight;
                }
                #else
                gl_FragColor.rgb+=lightRec.emission*state.throughputColor;
                #endif
            }
            break;
        }
        // 没命中（命中背景）
        else if(hitType==NO_HIT){
            if(state.firstRay||state.transmissiveRay){
                gl_FragColor.rgb+=sampleBackground(envRotation*ray.direction,sobol2(2))*state.throughputColor;
                gl_FragColor.a=backgroundAlpha;
            }
            else{
                #if FEATURE_MIS
                // 获取环境的pdf
                vec3 envColor;
                float envPdf=sampleEquirect(envMapInfo,envRotation*ray.direction,envColor);
                envPdf/=lightsDenom;
                
                float misWeight=misHeuristic(scatterRec.pdf,envPdf);
                gl_FragColor.rgb+=environmentIntensity*envColor*state.throughputColor*misWeight;
                #else
                gl_FragColor.rgb+=environmentIntensity*sampleEquirectColor(envMapInfo.map,envRotation*ray.direction)*state.throughputColor;
                #endif
            }
            break;
        }
        
        // 获取交点材质
        uint materialIndex=uTexelFetch1D(materialIndexAttribute,surfaceHit.faceIndices.x).r;
        Material material=readMaterialInfo(materials,materialIndex);
        
        // 哑光材质
        if(material.matte&&state.firstRay){
            gl_FragColor=vec4(0.);
            break;
        }
        
        // 阴影射线命中不会产生阴影的材质
        if(!material.castShadow&&state.isShadowRay){
            ray.origin=stepRayOrigin(ray.origin,ray.direction,-surfaceHit.faceNormal,surfaceHit.dist);
            continue;
        }
        
        SurfaceRecord surf;
        
        // 透明材质,防止无限弹射
        if(getSurfaceRecord(material,surfaceHit,attributesArray,state.accumulatedRoughness,surf)==SKIP_SURFACE){
            i-=sign(state.transmissiveTraversals);
            state.transmissiveTraversals-=sign(state.transmissiveTraversals);
            
            ray.origin=stepRayOrigin(ray.origin,ray.direction,-surfaceHit.faceNormal,surfaceHit.dist);
            continue;
        }
        
        scatterRec=bsdfSample(-ray.direction,surf);
        state.isShadowRay=scatterRec.specularPdf<sobol(4);
        
        bool isBelowSurface=!surf.volumeParticle&&dot(scatterRec.direction,surf.faceNormal)<0.;
        vec3 hitPoint=stepRayOrigin(ray.origin,ray.direction,isBelowSurface?-surf.faceNormal:surf.faceNormal,surfaceHit.dist);
        
        #if FEATURE_MIS
        gl_FragColor.rgb+=directLightContribution(-ray.direction,surf,state,hitPoint);
        #endif
        
        // 随着光线反射次数增多，其贡献越小
        if(!surf.volumeParticle&&!isBelowSurface){
            vec3 halfVector=normalize(-ray.direction+scatterRec.direction);
            state.accumulatedRoughness+=max(
                sin(acosApprox(dot(halfVector,surf.normal))),
                sin(acosApprox(dot(halfVector,surf.clearcoatNormal)))
            );
            state.transmissiveRay=false
        }
        
        // 颜色累加
        gl_FragColor.rgb+=(surf.emission*state.throughputColor);
        
        // 剪枝
        if(scatterRec.pdf<=0.||!isDirectionValid(scatterRec.direction,surf.normal,surf.faceNormal)){
            break;
        }
        
        // 透射
        bool isTransmissiveRay=!surf.volumeParticle&&dot(scatterRec.direction,surf.faceNormal*surfaceHit.side)<0.;
        if((isTransmissiveRay||isBelowSurface)&&stae.transmissiveTraversals>0){
            state.transmissiveTraversals--;
            i--;
        }
        
        // 颜色衰减
        if(!surf.frontFace){
            state.throughputColor*=transmissionAttenuation(surfaceHit.dist,surf.attenuationColor,surf.attenuationDistance);
        }
        
        // 俄罗斯轮盘赌
        #if FEATURE_RUSSIAN_ROULETTE
        uint minBounces=3u;
        float depthProb=float(state.depth<minBounces);
        
        float rrProb=luminance(state.throughputColor*scatterRec.color/scatterRec.pdf);
        rrProb/=luminance(state.throughputColor);
        rrProb=sqrt(rrProb);
        rrProb=max(rrProb,depthProb);
        rrProb=min(rrProb,1.);
        if(sobol(8)>rrProb){
            break;
        }
        state.throughputColor*=min(1./rrProb,20.);
        #endif
        
        // 影响颜色
        state.throughputColor*=scatterRec.color/scatterRec.pdf;
        
        // 判断颜色是否合法，（运算过程中可能出现NaN和Infinity）
        if(any(isnan(state.throughputColor))||any(isinf(state.throughputColor))){
            break;
        }
        
        // 下一次反射
        ray.direction=scatterRec.direction;
        ray.origin=hitPoint;
    }
    
    gl_FragColor.a*=opacity;
}