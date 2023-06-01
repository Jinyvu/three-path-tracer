import style from "./style.module.scss";
import { useEffect } from "react";
import Login from "./components/Login";
import UnLogin from "./components/UnLogin";
import LoginDialog from "./components/LoginDialog";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { login } from "@/stores/main/reducer";
import Cookies from "js-cookie";

export default function Header() {
    const { userInfo, loginDialogVisible } = useAppSelector(
        (state) => state.main
    );
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (Cookies.get("userId")) {
            dispatch(
                login({
                    userName: Cookies.get("userName"),
                    userEmail: Cookies.get("userEmail"),
                    userId: Cookies.get("userId"),
                })
            );
        }
    }, []);

    return (
        <div className={style.header} id="header">
            <div className={style.logo}>路径追踪渲染平台</div>
            <div className={style.right}>
                {userInfo.userId ? <Login /> : <UnLogin />}
            </div>
            {loginDialogVisible && <LoginDialog />}
        </div>
    );
}
