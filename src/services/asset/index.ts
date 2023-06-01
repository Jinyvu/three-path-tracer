import request, {requestFile} from "@/utils/request"

const PATH = 'assets'

export interface IFetchAssets {
    userId: number;
}

export type TFetchAssetsRes = {
    assetId: string;
    assetUrl: string;
    snapshotId: string;
    snapshotUrl: string;
}[]

const fetchAssets = (params: IFetchAssets) => {
    return request<TFetchAssetsRes>(`${PATH}/fetch`, {...params})
}

export interface IDeleteAsset {
    assetId: string
    userId: number
}

export type TDeleteAssetRes = boolean

const deleteAsset = (params: IDeleteAsset) => {
    return request<TDeleteAssetRes>(`${PATH}/delete`, {...params})
}

export interface IUploadAsset {
    asset: File;
    snapshot: File;
    userId: number;
}

export type TUploadAssetRes = {
    assetId: string;
    assetUrl: string;
    snapshotId: string;
    snapshotUrl: string;
}

const uploadAsset = (params: IUploadAsset) => {
    return requestFile<TUploadAssetRes>(`${PATH}/upload`, {...params})
}

export default {
    fetchAssets,
    deleteAsset,
    uploadAsset,
}