import style from "./style.module.scss";
import { Provider } from "react-redux";
import store from "@/stores/store";
import { ConfigProvider } from "antd";
import Header from "@/components/Header";
import HoverBtns from "@/components/HoverBtns";
import LeftBar from "@/components/LeftBar";
import RenderContainer from "@/components/RenderContainer";

export default function Home() {
    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: "#2f54eb",
                },
            }}
        >
            <Provider store={store}>
                <div className={style.main}>
                    <Header />
                    <LeftBar />
                    <HoverBtns className={style.hoverBtns} />
                    <RenderContainer />
                </div>
            </Provider>
        </ConfigProvider>
    );
}
