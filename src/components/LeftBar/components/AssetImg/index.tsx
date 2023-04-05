import { useState } from "react";
import style from "./style.module.scss";
import { useAppDispatch } from "@/stores/hooks";
import { setCurModel } from "@/stores/main/reducer";
import { assetApis } from "@/services";

interface IAssetImg {
    imgUrl: string;
    assetUrl: string;
    fileName: string;
    fileId: string;
}

export default function AssetImg({
    imgUrl,
    assetUrl,
    fileName,
    fileId,
}: IAssetImg) {
    const [showOper, setShowOper] = useState<boolean>(false);

    const dispatch = useAppDispatch()

    const handleLoad = () => {
        dispatch(setCurModel({fileId, fileUrl: assetUrl}))
    }

    const handleDelete = () => {
        assetApis.deleteAsset({fileId}).then(res => {
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
            <img className={style.img} src={imgUrl} alt=""></img>
            <div
                className={`${style.oper} ${showOper ? style.operActive : ""}`}
            >
                <div className={style.download} onClick={handleLoad}>加载</div>
                <div className={style.delete} onClick={handleDelete}>删除</div>
            </div>
            <label className={style.fileName}>{fileName}</label>
        </div>
    );
}
