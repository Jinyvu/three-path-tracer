import style from "./style.module.scss";
import { Avatar } from "antd";
import { useAppSelector } from "@/stores/hooks";

export default function Login() {
    const { userInfo } = useAppSelector((state) => state.main);

    return (
        <div className={style.login}>
            {userInfo.userAvatar ? (
                <Avatar src={userInfo.userAvatar} className={style.avatar} />
            ) : (
                <div className={style.avatar}>{userInfo.userName.slice(0, 1)}</div>
            )}

            <div className={style.name}>{userInfo.userName}</div>
        </div>
    );
}
