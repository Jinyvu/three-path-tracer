#define INFINITY 1e20

varying vec2 vUv

// bvh

// random
${pcgGLSL}
${sobolCommonGLSL}
${sobolSamplingGLSL}

// utils

// sampling
${lightSamplingGLSL}

// struct
${lightsStructGLSL}

// environment
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

${renderStructsGLSL}
${cameraUtilsGLSL}

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
    
}