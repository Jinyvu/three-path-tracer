import React, { useEffect, useState } from "react";
import style from "./style.module.scss";
import { Button, List, Upload } from "antd";
import AssetImg from "./components/AssetImg";
import { TAsset } from "./config";
import { assetApis } from "@/services";
import { setCurModel } from "@/stores/main/reducer";
import { useAppSelector, useAppDispatch} from "@/stores/hooks";

export default function LeftBar() {
    const [assets, setAssets] = useState<TAsset[]>([]);

    const { userInfo, assetsVisbile } = useAppSelector((state) => state.main);
    const dispatch = useAppDispatch()

    console.log(assets);

    const loadMoreData = () => {
        if (!userInfo.userId) {
            return;
        }
        assetApis
            .fetchAssets({
                userId: userInfo.userId,
            })
            .then((data) => {
                setAssets(data);
            })
            .catch((err) => {
                console.log("加载资产失败", err);
            });
    };

    useEffect(() => {
        loadMoreData();
    }, [userInfo]);

    const handleUpload = (info: any) => {
        console.log(info);
        assetApis.uploadAsset({files: [info.file]}).then(res => {
            dispatch(setCurModel({
                fileId: res.fileId,
                fileUrl: res.assetUrl,
            }))
        }).catch(err => {
            console.log('上传文件失败', err);
        })
    };

    return (
        <div className={`${style.wrapper} ${assetsVisbile ? style.wrapperActive : ''}`}>
            <div className={style.container}>
                {userInfo.userId ? (
                    <>
                        <List
                            dataSource={assets}
                            renderItem={(item, idx) => (
                                <List.Item key={idx}>
                                    <AssetImg {...item} />
                                </List.Item>
                            )}
                        />
                        <Upload onChange={handleUpload} showUploadList={false}>
                            <Button className={style.upload} type="text">
                                资产上传
                            </Button>
                        </Upload>
                    </>
                ) : (
                    <div className={style.unlogin}>请先登录</div>
                )}
            </div>
        </div>
    );
}
