import {
    IDeleteAsset,
    IFetchAssets,
    IUploadAsset,
    TDeleteAssetRes,
    TFetchAssetsRes,
    TUploadAssetRes,
} from ".";

const fetchAssets = (params: IFetchAssets): Promise<TFetchAssetsRes> => {
    return Promise.resolve([
        {
            imgUrl: "https://ts1.cn.mm.bing.net/th/id/R-C.6def661b51e553a53b977a602c6a2021?rik=FDdH4BO%2bUYI8eA&riu=http%3a%2f%2fbpic.588ku.com%2felement_pic%2f01%2f88%2f76%2f6057555a64bff31.jpg&ehk=rtTy0ZX6C%2bYArmmRMVLe0AkVaZhFcZjsBeiRVchL6w0%3d&risl=&pid=ImgRaw&r=0",
            assetUrl: "",
            fileName: "testName1",
            fileId: "sodihadoh",
        },
        {
            imgUrl: "https://ts1.cn.mm.bing.net/th/id/R-C.987f582c510be58755c4933cda68d525?rik=C0D21hJDYvXosw&riu=http%3a%2f%2fimg.pconline.com.cn%2fimages%2fupload%2fupc%2ftx%2fwallpaper%2f1305%2f16%2fc4%2f20990657_1368686545122.jpg&ehk=netN2qzcCVS4ALUQfDOwxAwFcy41oxC%2b0xTFvOYy5ds%3d&risl=&pid=ImgRaw&r=0",
            assetUrl: "",
            fileName: "testName1",
            fileId: "sodihadoh",
        },
        {
            imgUrl: "https://ts1.cn.mm.bing.net/th/id/R-C.6def661b51e553a53b977a602c6a2021?rik=FDdH4BO%2bUYI8eA&riu=http%3a%2f%2fbpic.588ku.com%2felement_pic%2f01%2f88%2f76%2f6057555a64bff31.jpg&ehk=rtTy0ZX6C%2bYArmmRMVLe0AkVaZhFcZjsBeiRVchL6w0%3d&risl=&pid=ImgRaw&r=0",
            assetUrl: "",
            fileName: "testName2",
            fileId: "asdasdad",
        },
        {
            imgUrl: "https://ts1.cn.mm.bing.net/th/id/R-C.6def661b51e553a53b977a602c6a2021?rik=FDdH4BO%2bUYI8eA&riu=http%3a%2f%2fbpic.588ku.com%2felement_pic%2f01%2f88%2f76%2f6057555a64bff31.jpg&ehk=rtTy0ZX6C%2bYArmmRMVLe0AkVaZhFcZjsBeiRVchL6w0%3d&risl=&pid=ImgRaw&r=0",
            assetUrl: "",
            fileName: "testName3",
            fileId: "asdasdfdvc",
        },
        {
            imgUrl: "https://ts1.cn.mm.bing.net/th/id/R-C.6def661b51e553a53b977a602c6a2021?rik=FDdH4BO%2bUYI8eA&riu=http%3a%2f%2fbpic.588ku.com%2felement_pic%2f01%2f88%2f76%2f6057555a64bff31.jpg&ehk=rtTy0ZX6C%2bYArmmRMVLe0AkVaZhFcZjsBeiRVchL6w0%3d&risl=&pid=ImgRaw&r=0",
            assetUrl: "",
            fileName: "testName4",
            fileId: "asdasdad",
        },
        {
            imgUrl: "https://ts1.cn.mm.bing.net/th/id/R-C.6def661b51e553a53b977a602c6a2021?rik=FDdH4BO%2bUYI8eA&riu=http%3a%2f%2fbpic.588ku.com%2felement_pic%2f01%2f88%2f76%2f6057555a64bff31.jpg&ehk=rtTy0ZX6C%2bYArmmRMVLe0AkVaZhFcZjsBeiRVchL6w0%3d&risl=&pid=ImgRaw&r=0",
            assetUrl: "",
            fileName: "testName5",
            fileId: "asdaswergfvdad",
        },
        {
            imgUrl: "https://ts1.cn.mm.bing.net/th/id/R-C.6def661b51e553a53b977a602c6a2021?rik=FDdH4BO%2bUYI8eA&riu=http%3a%2f%2fbpic.588ku.com%2felement_pic%2f01%2f88%2f76%2f6057555a64bff31.jpg&ehk=rtTy0ZX6C%2bYArmmRMVLe0AkVaZhFcZjsBeiRVchL6w0%3d&risl=&pid=ImgRaw&r=0",
            assetUrl: "",
            fileName: "testName6",
            fileId: "dfsdfdsfsd",
        },
    ]);
};

const deleteAsset = (params: IDeleteAsset): Promise<TDeleteAssetRes> => {
    return Promise.resolve(true);
};

const uploadAsset = (params: IUploadAsset): Promise<TUploadAssetRes> => {
    return Promise.resolve({
        imgUrl: "https://ts1.cn.mm.bing.net/th/id/R-C.987f582c510be58755c4933cda68d525?rik=C0D21hJDYvXosw&riu=http%3a%2f%2fimg.pconline.com.cn%2fimages%2fupload%2fupc%2ftx%2fwallpaper%2f1305%2f16%2fc4%2f20990657_1368686545122.jpg&ehk=netN2qzcCVS4ALUQfDOwxAwFcy41oxC%2b0xTFvOYy5ds%3d&risl=&pid=ImgRaw&r=0",
        assetUrl: "",
        fileName: "testName1",
        fileId: "sodihadoh",
    });
};

export default {
    fetchAssets,
    deleteAsset,
    uploadAsset,
};
