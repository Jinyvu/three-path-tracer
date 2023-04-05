import { MeshPhysicalMaterial, Color, DoubleSide } from 'three';

export const modelList = {
    'M2020 Rover': {
        url: 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/main/models/nasa-m2020/Perseverance.glb',
        credit: 'Model credit NASA / JPL-Caltech',
    },
    'M2020 Helicopter': {
        url: 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/main/models/nasa-m2020/Ingenuity.glb',
        credit: 'Model credit NASA / JPL-Caltech',
    },
    'Gelatinous Cube': {
        url: 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/main/models/gelatinous-cube/scene.gltf',
        credit: 'Model by "glenatron" on Sketchfab.',
        rotation: [ 0, - Math.PI / 8, 0.0 ],
        opacityToTransmission: true,
        bounces: 8,
        postProcess( model ) {

            const toRemove = [];
            model.traverse( c => {

                if ( c.material ) {

                    if ( c.material instanceof MeshPhysicalMaterial ) {

                        const material = c.material;
                        material.metalness = 0.0;
                        material.ior = 1.2;
                        material.map = null;

                        c.geometry.computeVertexNormals();

                    } else if ( c.material.opacity < 1.0 ) {

                        toRemove.push( c );

                    }

                }

            } );

            toRemove.forEach( c => {

                c.parent.remove( c );

            } );

        }
    },
    'Octopus Tea': {
        url: 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/main/models/octopus-tea/scene.gltf',
        credit: 'Model by "AzTiZ" on Sketchfab.',
        opacityToTransmission: true,
        bounces: 8,
        postProcess( model ) {

            const toRemove = [];
            model.traverse( c => {

                if ( c.material ) {

                    if ( c.material instanceof MeshPhysicalMaterial ) {

                        const material = c.material;
                        material.metalness = 0.0;
                        if ( material.transmission === 1.0 ) {

                            material.roughness = 0.0;
                            material.metalness = 0.0;

                            // 29 === glass
                            // 27 === liquid top
                            // 23 === liquid
                            if ( c.name.includes( '29' ) ) {

                                c.geometry.index.array.reverse();
                                material.ior = 1.52;
                                material.color.set( 0xffffff );

                            } else {

                                material.ior = 1.2;

                            }

                        }

                    } else if ( c.material.opacity < 1.0 ) {

                        toRemove.push( c );

                    }

                }

            } );

            toRemove.forEach( c => {

                c.parent.remove( c );

            } );

        }
    },
    'Scifi Toad': {
        url: 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/main/models/scifi-toad/scene.gltf',
        credit: 'Model by "YuryTheCreator" on Sketchfab.',
        opacityToTransmission: true,
        bounces: 8,
        postProcess( model ) {

            model.traverse( c => {

                if ( c.material && c.material instanceof MeshPhysicalMaterial ) {

                    const material = c.material;
                    material.metalness = 0.0;
                    material.ior = 1.645;
                    material.color.lerp( new Color( 0xffffff ), 0.65 );

                }

            } );

        }
    },
    'Halo Twist Ring': {
        url: 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/main/models/ring-twist-halo/scene.glb',
        credit: 'Model credit NASA / JPL-Caltech',
        opacityToTransmission: true,
        bounces: 15,
        postProcess( model ) {

            model.traverse( c => {

                if ( c.material ) {

                    if ( c.material instanceof MeshPhysicalMaterial ) {

                        if ( c.material.transmission === 1.0 ) {

                            const material = c.material;
                            material.metalness = 0.0;
                            material.ior = 1.8;
                            material.color.set( 0xffffff );

                        }

                    }

                }

            } );

        }
    },
    // 'Vino Bike': {
    // 	url: 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/main/models/vino-bike/scene.gltf',
    // 	credit: 'glTF Sample Model.',
    // 	postProcess( model ) {

    // 		model.traverse( c => {
    // 			console.log(c.name);
    // 			if ( c.name === 'mesh_0') {

    // 				// TODO: remove this
    // 				c.material.clearcoatRoughness = 0;
    // 				c.material.clearcoatMap = null;
    // 				c.material.clearcoatNormalMap = null;
    // 				c.material.clearcoatNormalScale.setScalar( 1. );

    // 			}
    // 		})

    // 	}
    // },
    'Damaged Helmet': {
        url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF/DamagedHelmet.gltf',
        credit: 'glTF Sample Model.',
    },
    'Flight Helmet': {
        url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF/FlightHelmet.gltf',
        credit: 'glTF Sample Model.',
    },
    'Statue': {
        url: 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/main/models/threedscans/Le_Transi_De_Rene_De_Chalon.glb',
        credit: 'Model courtesy of threedscans.com.',
    },
    'Crab Sculpture': {
        url: 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/main/models/threedscans/Crab.glb',
        rotation: [ - 2 * Math.PI / 4, 0, 0 ],
        credit: 'Model courtesy of threedscans.com.',

        bounces: 15,
        floorColor: '#eeeeee',
        floorRoughness: 1.0,
        floorMetalness: 0.0,
        gradientTop: '#eeeeee',
        gradientBot: '#eeeeee',

        postProcess( model ) {

            let mat = new MeshPhysicalMaterial( {
                roughness: 0.05,
                transmission: 1,
                ior: 1.2,
                attenuationDistance: 0.06,
                attenuationColor: 0x46dfea
            } ) ;

            model.traverse( c => {

                if ( c.material ) c.material = mat;

            } );

        }
    },
    'Elbow Crab Sculpture': {
        url: 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/main/models/threedscans/Elbow_Crab.glb',
        rotation: [ 2.5 * Math.PI / 4, Math.PI, 0 ],
        credit: 'Model courtesy of threedscans.com.',

        bounces: 15,
        floorColor: '#eeeeee',
        floorRoughness: 1.0,
        floorMetalness: 0.0,
        gradientTop: '#eeeeee',
        gradientBot: '#eeeeee',

        postProcess( model ) {

            let mat = new MeshPhysicalMaterial( {
                color: 0xcc8888,
                roughness: 0.25,
                transmission: 1,
                ior: 1.5,
                side: DoubleSide,
            } ) ;

            model.traverse( c => {

                if ( c.material ) c.material = mat;

            } );

        }
    },
    'Japanese Bridge Garden': {
        url: 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/main/models/japanese-bridge-garden/scene.glb',
        credit: 'Model by "kristenlee" on Sketchfab.',
    },
    'Imaginary Friend Room': {
        url: 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/main/models/imaginary-friend-room/scene.glb',
        credit: 'Model by "Iman Aliakbar" on Sketchfab.',
    },
    'Botanists Study': {
        url: 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/main/models/botanists-study/scene.gltf',
        credit: 'Model by "riikkakilpelainen" on Sketchfab.',
    },
    'Botanists Greenhouse': {
        url: 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/main/models/botanists-greenhouse/scene.gltf',
        credit: 'Model by "riikkakilpelainen" on Sketchfab.',
    },
    'Low Poly Rocket': {
        url: 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/main/models/lowpoly-space/space_exploration.glb',
        credit: 'Model by "The Sinking Sun" on Sketchfab',
        rotation: [ 0, - Math.PI / 3, 0.0 ],
    },
    'Astraia': {
        url: 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/main/models/astraia/scene.gltf',
        credit: 'Model by "Quentin Otani" on Sketchfab',
        removeEmission: true,
        postProcess( model ) {

            const toRemove = [];
            model.traverse( c => {

                if ( c.name.includes( 'ROND' ) ) {

                    toRemove.push( c );

                }

            } );

            toRemove.forEach( c => {

                c.parent.remove( c );

            } );

        }
    },
}

export const envMaps = {
	'Royal Esplanade': 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/equirectangular/royal_esplanade_1k.hdr',
	'Moonless Golf': 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/equirectangular/moonless_golf_1k.hdr',
	'Overpass': 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/equirectangular/pedestrian_overpass_1k.hdr',
	'Venice Sunset': 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/equirectangular/venice_sunset_1k.hdr',
	'Small Studio': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/studio_small_05_1k.hdr',
	'Pfalzer Forest': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/phalzer_forest_01_1k.hdr',
	'Leadenhall Market': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/leadenhall_market_1k.hdr',
	'Kloppenheim': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/kloppenheim_05_1k.hdr',
	'Hilly Terrain': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/hilly_terrain_01_1k.hdr',
	'Circus Arena': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/circus_arena_1k.hdr',
	'Chinese Garden': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/chinese_garden_1k.hdr',
	'Autoshop': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/autoshop_01_1k.hdr',

	'Measuring Lab': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/vintage_measuring_lab_2k.hdr',
	'Whale Skeleton': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/whale_skeleton_2k.hdr',
	'Hall of Mammals': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/hall_of_mammals_2k.hdr',

	'Drachenfels Cellar': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/drachenfels_cellar_2k.hdr',
	'Adams Place Bridge': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/adams_place_bridge_2k.hdr',
	'Sepulchral Chapel Rotunda': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/sepulchral_chapel_rotunda_2k.hdr',
	'Peppermint Powerplant': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/peppermint_powerplant_2k.hdr',
	'Noon Grass': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/noon_grass_2k.hdr',
	'Narrow Moonlit Road': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/narrow_moonlit_road_2k.hdr',
	'St Peters Square Night': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/st_peters_square_night_2k.hdr',
	'Brown Photostudio 01': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/brown_photostudio_01_2k.hdr',
	'Rainforest Trail': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/rainforest_trail_2k.hdr',
	'Brown Photostudio 07': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/brown_photostudio_07_2k.hdr',
	'Brown Photostudio 06': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/brown_photostudio_06_2k.hdr',
	'Dancing Hall': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/dancing_hall_2k.hdr',
	'Aristea Wreck Puresky': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/aristea_wreck_puresky_2k.hdr',
	'Modern Buildings 2': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/modern_buildings_2_2k.hdr',
	'Thatch Chapel': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/thatch_chapel_2k.hdr',
	'Vestibule': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/vestibule_2k.hdr',
	'Blocky Photo Studio': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/blocky_photo_studio_1k.hdr',
	'Christmas Photo Studio 07': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/christmas_photo_studio_07_2k.hdr',
	'Aerodynamics Workshop': 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/master/hdri/aerodynamics_workshop_1k.hdr',

};