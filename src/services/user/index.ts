import request from "@/utils/request";

const PATH = "user";

export interface ILoginReq {
    email: string;
    verifyCode: string;
}

export type TLoginReqRes = {
    userName: string;
    userEmail: string;
    userId: string;
    userAvatar: string;
};

const login = (params: ILoginReq) => {
    return request<TLoginReqRes>(`${PATH}/login`, { ...params });
};

export default {
    login,
};
