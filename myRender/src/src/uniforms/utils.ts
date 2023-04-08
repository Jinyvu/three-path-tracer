// 保证材质有唯一标识，且是相同的颜色空间
export function getTextureHash(t) {

	return `${t.source.uuid}:${t.encoding}`;

}

// reduce the set of textures to just those with a unique source while retaining
// the order of the textures.
export function reduceTexturesToUniqueSources(textures) {

	const sourceSet = new Set();
	const result = [];
	for (let i = 0, l = textures.length; i < l; i++) {

		const tex = textures[i];
		const hash = getTextureHash(tex);
		if (!sourceSet.has(hash)) {

			sourceSet.add(hash);
			result.push(tex);

		}

	}

	return result;

}
