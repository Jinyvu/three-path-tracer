import { useState } from "react";
import style from "./style.module.scss";
import { useAppDispatch } from "@/stores/hooks";
import { setCurModel } from "@/stores/main/reducer";
import { assetApis } from "@/services";
import { updateModel } from "@/myRender";

const BACKEND_HOST = process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:7001' : ''

interface IAssetImg {
    assetId: string;
    assetUrl: string;
    snapshotId: string;
    snapshotUrl: string;
    userId: number;
}

export default function AssetImg({
    assetId,
    assetUrl,
    snapshotId,
    snapshotUrl,
    userId,
}: IAssetImg) {
    const [showOper, setShowOper] = useState<boolean>(false);

    const dispatch = useAppDispatch()

    const handleLoad = () => {
        dispatch(setCurModel({fileId: assetId, fileUrl: assetUrl}))
        updateModel(`${BACKEND_HOST}${assetUrl}/${assetId}`)
    }

    const handleDelete = () => {
        assetApis.deleteAsset({assetId, userId}).then(res => {
            console.log('删除文件成功');
        })
        .catch(err => {
            console.log('删除文件失败', err);
        })
    }

    return (
        <div
            className={style.container}
            onMouseEnter={() => setShowOper(true)}
            onMouseLeave={() => setShowOper(false)}
        >
            <img className={style.img} src={`${BACKEND_HOST}${snapshotUrl}/${snapshotId}`} alt=""></img>
            <div
                className={`${style.oper} ${showOper ? style.operActive : ""}`}
            >
                <div className={style.download} onClick={handleLoad}>加载</div>
                <div className={style.delete} onClick={handleDelete}>删除</div>
            </div>
            {/* <label className={style.fileName}>{fileName}</label> */}
        </div>
    );
}
