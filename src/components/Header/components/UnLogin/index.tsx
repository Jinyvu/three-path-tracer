import { Button } from "antd";
import style from "./style.module.scss";
import { setLoginDialog } from "@/stores/main/reducer";
import { useAppDispatch } from "@/stores/hooks";


export default function UnLogin() {
    const dispatch = useAppDispatch()

    const handleSignIn = () => {
        dispatch(setLoginDialog(true))
    }

    return (
        <div className={style.unLogin}>
            <Button type="primary" onClick={handleSignIn}>Sign in / Sign up</Button>
        </div>
    );
}
