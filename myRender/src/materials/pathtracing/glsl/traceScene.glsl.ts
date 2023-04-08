export const traceSceneGLSL = /* glsl */`

	#define NO_HIT 0
	#define SURFACE_HIT 1
	#define LIGHT_HIT 2
	#define FOG_HIT 3

	int traceScene(

		Ray ray, BVH bvh, LightsInfo lights, Material fogMaterial,
		out SurfaceHit surfaceHit, out LightRecord lightRec

	) {

		bool hit = bvhIntersectFirstHit( bvh, ray.origin, ray.direction, surfaceHit.faceIndices, surfaceHit.faceNormal, surfaceHit.barycoord, surfaceHit.side, surfaceHit.dist );
		bool lightHit = lightsClosestHit( lights.tex, lights.count, ray.origin, ray.direction, lightRec );

		if ( lightHit && ( lightRec.dist < surfaceHit.dist || ! hit ) ) {

			return LIGHT_HIT;

		}

		if ( hit ) {

			return SURFACE_HIT;

		}

		return NO_HIT;

	}

`;
