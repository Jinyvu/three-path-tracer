import { Switch } from 'antd'
import style from './style.module.scss'
import { setAssetsVisble } from "@/stores/main/reducer";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";

export default function HoverBtns({className = ''}) {
    const { userInfo, assetsVisbile } = useAppSelector(
        (state) => state.main
    );
    const dispatch = useAppDispatch()

    const handleChange = () => {
        dispatch(setAssetsVisble())
    }

    return (
        <div className={`${className} ${style.container}`}>
            <Switch unCheckedChildren='资产显示' checkedChildren="资产隐藏" defaultChecked checked={assetsVisbile} onChange={handleChange} />
        </div>
    )
}