import { PathTracingSceneGenerator } from '../core/PathTracingSceneGenerator.js';
import { SAH } from 'three-mesh-bvh';
import { GenerateMeshBVHWorker } from 'three-mesh-bvh/src/workers/GenerateMeshBVHWorker.js';

/**
 * 传入场景对象，对场景对象应用BVH空间划分算法，
 * 调用webWork加速，异步生成
 * 会将场景的所有材质合并为一组、所有纹理合并为一组
 */
export class PathTracingSceneWorker extends PathTracingSceneGenerator {

	constructor() {

		super();
		this.bvhGenerator = new GenerateMeshBVHWorker();

	}

	// 对场景应用空间划分
	generate( scene, options = {} ) {

		const { bvhGenerator } = this;
		const { geometry, materials, textures, lights, spotLights } = this.prepScene( scene );

		const bvhOptions = { strategy: SAH, ...options, maxLeafTris: 1 };
		const bvhPromise = bvhGenerator.generate( geometry, bvhOptions );
		return bvhPromise.then( bvh => {

			return {
				scene,
				materials,
				textures,
				lights,
				spotLights,
				bvh,
			};

		} );

	}

	dispose() {

		this.bvhGenerator.dispose();

	}

}
