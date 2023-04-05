import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ILoginReq } from "@/services/user";
import { userApis } from "@/services";

type UserInfo = {
    userName?: string;
    userAvatar?: string;
    userId?: string;
    userEmail?: string;
};

type CurModel = {
    fileId: string;
    fileUrl: string;
};

interface IMainState {
    userInfo: UserInfo;
    loginDialogVisible: boolean;
    assetsVisbile: boolean;
    curModel: CurModel | null;
}

const initialState: IMainState = {
    userInfo: {},
    loginDialogVisible: false,
    assetsVisbile: false,
    curModel: null,
};

export const counterSlice = createSlice({
    name: "main",
    initialState,
    reducers: {
        login: (state, action: PayloadAction<UserInfo>) => {
            state.userInfo = Object.assign({}, action.payload);
        },
        loginOut: (state) => {
            state.userInfo = {};
        },
        setLoginDialog: (state, action: PayloadAction<boolean>) => {
            state.loginDialogVisible = action.payload;
        },
        setAssetsVisble: (state) => {
            state.assetsVisbile = !state.assetsVisbile;
        },
        setCurModel: (state, action: PayloadAction<CurModel>) => {
            state.curModel = Object.assign(action.payload)
        },
    },
});
// 每个 case reducer 函数会生成对应的 Action creators
export const { login, loginOut, setLoginDialog, setAssetsVisble, setCurModel } =
    counterSlice.actions;

export default counterSlice.reducer;
