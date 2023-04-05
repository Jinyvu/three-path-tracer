import { TLoginReqRes, ILoginReq } from "@/services/user";

const login = (params: ILoginReq): Promise<TLoginReqRes> => {
    return Promise.resolve({
        userName: "userName",
        userEmail: "userEmail",
        userId: "userId",
        userAvatar:
            "https://ts1.cn.mm.bing.net/th/id/R-C.6def661b51e553a53b977a602c6a2021?rik=FDdH4BO%2bUYI8eA&riu=http%3a%2f%2fbpic.588ku.com%2felement_pic%2f01%2f88%2f76%2f6057555a64bff31.jpg&ehk=rtTy0ZX6C%2bYArmmRMVLe0AkVaZhFcZjsBeiRVchL6w0%3d&risl=&pid=ImgRaw&r=0",
    });
};

export default {
    login,
};
