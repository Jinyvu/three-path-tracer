import request, {requestFile} from "@/utils/request"

const PATH = 'asset'

export interface IFetchAssets {
    userId: string;
}

export type TFetchAssetsRes = {
    imgUrl: string;
    assetUrl: string;
    fileName: string;
    fileId: string;
}[]

const fetchAssets = (params: IFetchAssets) => {
    return request<TFetchAssetsRes>(`${PATH}/login`, {...params})
}

export interface IDeleteAsset {
    fileId: string
}

export type TDeleteAssetRes = boolean

const deleteAsset = (params: IDeleteAsset) => {
    return request<TDeleteAssetRes>(`${PATH}/delete`, {...params})
}

export interface IUploadAsset {
    files: File[];
}

export type TUploadAssetRes = {
    imgUrl: string;
    assetUrl: string;
    fileName: string;
    fileId: string;
}

const uploadAsset = (params: IUploadAsset) => {
    return requestFile<TUploadAssetRes>(`${PATH}/upload`, {...params})
}

export default {
    fetchAssets,
    deleteAsset,
    uploadAsset,
}