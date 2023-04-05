import style from "./style.module.scss";
import { useEffect } from "react";
import Login from "./components/Login";
import UnLogin from "./components/UnLogin";
import LoginDialog from "./components/LoginDialog";
import { useAppSelector } from "@/stores/hooks";

export default function Header() {
    const { userInfo, loginDialogVisible } = useAppSelector(
        (state) => state.main
    );

    return (
        <div className={style.header}>
            <div className={style.logo}>logo</div>
            <div className={style.right}>
                {userInfo.userId ? <Login /> : <UnLogin />}
            </div>
            {loginDialogVisible && <LoginDialog />}
        </div>
    );
}
