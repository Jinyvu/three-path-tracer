import { BufferAttribute } from 'three';
import { mergeBufferGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// 返回一个数组，数组第i项为geometry的第i个顶点对应的材质在allMaterials中的索引
export function getGroupMaterialIndicesAttribute( geometry, materials, allMaterials ) {

	const indexAttr = geometry.index;
	const posAttr = geometry.attributes.position;
	const vertCount = posAttr.count;
	const totalCount = indexAttr ? indexAttr.count : vertCount;
	let groups = geometry.groups;
	if ( groups.length === 0 ) {

		groups = [ { count: totalCount, start: 0, materialIndex: 0 } ];

	}

	// use an array with the minimum precision required to store all material id references.
	let materialArray;
	if ( allMaterials.length <= 255 ) {

		materialArray = new Uint8Array( vertCount );

	} else {

		materialArray = new Uint16Array( vertCount );

	}

	for ( let i = 0; i < groups.length; i ++ ) {

		const group = groups[ i ];
		const start = group.start;
		const count = group.count;
		const endCount = Math.min( count, totalCount - start );

		const mat = Array.isArray( materials ) ? materials[ group.materialIndex ] : materials;
		const materialIndex = allMaterials.indexOf( mat );

		for ( let j = 0; j < endCount; j ++ ) {

			let index = start + j;
			if ( indexAttr ) {

				index = indexAttr.getX( index );

			}

			materialArray[ index ] = materialIndex;

		}

	}

	return new BufferAttribute( materialArray, 1, false );

}

// 将geometry中不包含在attributes中的attribute剔除
export function trimToAttributes( geometry, attributes ) {

	// trim any unneeded attributes
	if ( attributes ) {

		for ( const key in geometry.attributes ) {

			if ( ! attributes.includes( key ) ) {

				geometry.deleteAttribute( key );

			}

		}

	}

}

// 补全geometry.attributes在options.attributes缺失的属性，同时设置geometry的顶点索引（用于被三角形引用）
export function setCommonAttributes( geometry, options ) {

	const { attributes = [], normalMapRequired = false } = options;

	// 若options.attributes中包含normal选项，计算顶点法向量
	if ( ! geometry.attributes.normal && ( attributes && attributes.includes( 'normal' ) ) ) {

		geometry.computeVertexNormals();

	}

	// 若options.attributes中包含uv选项，初始化geometry.attributes中的uv（可能不是真正的uv）
	if ( ! geometry.attributes.uv && ( attributes && attributes.includes( 'uv' ) ) ) {

		const vertCount = geometry.attributes.position.count;
		geometry.setAttribute( 'uv', new BufferAttribute( new Float32Array( vertCount * 2 ), 2, false ) );

	}

	// 若options.attributes中包含tangent选项，计算顶点切线
	if ( ! geometry.attributes.tangent && ( attributes && attributes.includes( 'tangent' ) ) ) {

		if ( normalMapRequired ) {

			// computeTangents requires an index buffer
			if ( geometry.index === null ) {
				// 顶点去重
				geometry = mergeVertices( geometry );

			}

			geometry.computeTangents();

		} else {

			const vertCount = geometry.attributes.position.count;
			geometry.setAttribute( 'tangent', new BufferAttribute( new Float32Array( vertCount * 4 ), 4, false ) );

		}

	}

	// 若options.attributes中包含color选项，计算几何体颜色
	if ( ! geometry.attributes.color && ( attributes && attributes.includes( 'color' ) ) ) {

		const vertCount = geometry.attributes.position.count;
		const array = new Float32Array( vertCount * 4 );
		array.fill( 1.0 );
		geometry.setAttribute( 'color', new BufferAttribute( array, 4 ) );

	}

	// 设置几何体的顶点索引
	if ( ! geometry.index ) {

		// TODO: compute a typed array
		const indexCount = geometry.attributes.position.count;
		const array = new Array( indexCount );
		for ( let i = 0; i < indexCount; i ++ ) {

			array[ i ] = i;

		}

		geometry.setIndex( array );

	}

}

// 将传入的meshes融合为一个几何体，并把meshes中的所有material融合为一个数组、所有texture融合为一个数组
export function mergeMeshes( meshes, options = {} ) {

	options = { attributes: null, cloneGeometry: true, ...options };

	const transformedGeometry = [];
	// 将meshes中所有meshes统一到materialSet中
	const materialSet = new Set();
	for ( let i = 0, l = meshes.length; i < l; i ++ ) {

		// save any materials
		const mesh = meshes[ i ];
		if ( mesh.visible === false ) continue;

		if ( Array.isArray( mesh.material ) ) {

			mesh.material.forEach( m => materialSet.add( m ) );

		} else {

			materialSet.add( mesh.material );

		}

	}

	// 更新几何体位置；调整几何体的attributes与options.attributes保持一致；为几何体中每个顶点标注顶点对应的材质
	const materials = Array.from( materialSet );
	for ( let i = 0, l = meshes.length; i < l; i ++ ) {

		// ensure the matrix world is up to date
		const mesh = meshes[ i ];
		if ( mesh.visible === false ) continue;

		mesh.updateMatrixWorld();

		// apply the matrix world to the geometry
		const originalGeometry = meshes[ i ].geometry;
		const geometry = options.cloneGeometry ? originalGeometry.clone() : originalGeometry;
		geometry.applyMatrix4( mesh.matrixWorld );

		// ensure our geometry has common attributes
		setCommonAttributes( geometry, {
			attributes: options.attributes,
			normalMapRequired: ! ! mesh.material.normalMap,
		} );
		trimToAttributes( geometry, options.attributes );

		// create the material index attribute
		const materialIndexAttribute = getGroupMaterialIndicesAttribute( geometry, mesh.material, materials );
		geometry.setAttribute( 'materialIndex', materialIndexAttribute );

		transformedGeometry.push( geometry );

	}

	const textureSet = new Set();
	materials.forEach( material => {

		for ( const key in material ) {

			const value = material[ key ];
			if ( value && value.isTexture ) {

				textureSet.add( value );

			}

		}

	} );

	const geometry = mergeBufferGeometries( transformedGeometry, false );
	const textures = Array.from( textureSet );
	return { geometry, materials, textures };

}
