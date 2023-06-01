import request from "@/utils/request";

const PATH = "user";

export interface IRegisterReq {
    email: string;
    userName: string;
    password: string;
}

export type TRegisterReqRes = {
    userName: string;
    userEmail: string;
    userId: string;
};

const register = (params: IRegisterReq) => {
    return request<TRegisterReqRes>(`${PATH}/register`, { ...params });
};

export interface ILoginReq {
    email?: string;
    userName?: string;
    password: string;
}

export type TLoginReqRes = {
    userName: string;
    userEmail: string;
    userId: string;
};

const login = (params: ILoginReq) => {
    return request<TLoginReqRes>(`${PATH}/login`, { ...params });
};


export type TGetVerifyCode = {
    code: string,
} 

const getVerifyCode = (params: {}) => {
    return request<TGetVerifyCode>(`${PATH}/get_verifyCode`, params)
}

export default {
    login,
    register,
    getVerifyCode,
};
