import { Mesh } from 'three';
import { SAH, MeshBVH, StaticGeometryGenerator } from 'three-mesh-bvh';
import { mergeMeshes } from '../utils/GeometryPreparationUtils.js';

// 对传入的场景应用BVH操作，返回操作之后的场景
export class PathTracingSceneGenerator {

	/**
	 * 将场景中的所有mesh合并为一组
	 * （包括所有mehses生成的一个geometry，meshes中所有material合成的数组materials，mehses中所有材质合成的数组textures），
	 * 用于之后的BVH操作；
	 * 所有的light合并为一组
	 */
	prepScene( scene ) {

		scene = Array.isArray( scene ) ? scene : [ scene ];

		const meshes = [];
		const lights = [];

		for ( let i = 0, l = scene.length; i < l; i ++ ) {

			scene[ i ].traverseVisible( c => {

				if ( c.isSkinnedMesh || c.isMesh && c.morphTargetInfluences ) {

					// 将传入的各种mesh统一起来，生成一个静态的geometry，用于之后的BVH
					const generator = new StaticGeometryGenerator( c );
					generator.attributes = [ 'position', 'color', 'normal', 'tangent', 'uv', 'uv2' ];
					generator.applyWorldTransforms = false;
					const mesh = new Mesh(
						generator.generate(),
						c.material,
					);
					mesh.matrixWorld.copy( c.matrixWorld );
					mesh.matrix.copy( c.matrixWorld );
					mesh.matrix.decompose( mesh.position, mesh.quaternion, mesh.scale );
					meshes.push( mesh );

				} else if ( c.isMesh ) {

					meshes.push( c );

				} else if ( c.isRectAreaLight || c.isSpotLight || c.isDirectionalLight || c.isPointLight ) {

					lights.push( c );

				}

			} );

		}

		return {
			...mergeMeshes( meshes, {
				attributes: [ 'position', 'normal', 'tangent', 'uv', 'color' ],
			} ),
			lights,
		};

	}

	// 对场景进行BVH操作
	generate( scene, options = {} ) {

		const { materials, textures, geometry, lights } = this.prepScene( scene );
		const bvhOptions = { strategy: SAH, ...options, maxLeafTris: 1 };
		return {
			scene,
			materials,
			textures,
			lights,
			bvh: new MeshBVH( geometry, bvhOptions ),
		};

	}

}
