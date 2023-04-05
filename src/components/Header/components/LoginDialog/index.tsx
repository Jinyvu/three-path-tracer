import style from "./style.module.scss";
import { useState, useEffect, useRef } from "react";
import { Modal, Form, Input, Checkbox, Button, Row, Col } from "antd";
import { setLoginDialog, login } from "@/stores/main/reducer";
import { useAppDispatch } from "@/stores/hooks";
import { userApis } from "@/services";

export default function LoginDialog() {
    const [count, setCount] = useState<number>(0);
    const latestCount = useRef(count); // 定义一个ref，初始值是10
    const [form] = Form.useForm()    

    useEffect(() => {
        latestCount.current = count;
    }, [count]);

    useEffect(() => {
        if(count === 60){
            const timer = setInterval(() => {
                if (latestCount.current <= 0) {
                    clearInterval(timer);
                    return;
                }
                setCount((c) => c - 1);
            }, 1000);
        }
    }, [count]);


    const dispatch = useAppDispatch();

    const handleCancel = () => {
        dispatch(setLoginDialog(false));
    };

    const handleSendVCode = () => {
        setCount(60);
    };

    const handleSubmit = () => {
        const formData = form.getFieldsValue()
        userApis.login({
            email: formData.email,
            verifyCode: formData.vCode,
        }).then(data => {
            dispatch(login(data))
            dispatch(setLoginDialog(false))
        }).catch(err => {
            console.log('登录失败', err);
        })
    }

    return (
        <Modal
            centered
            open={true}
            width={"62.5rem"}
            onCancel={handleCancel}
            footer={null}
            closable={false}
            bodyStyle={{ display: "flex", justifyContent: "center" }}
        >
            <div className={style.loginDialog}>
                <div
                    className={style.cover}
                    style={{
                        backgroundImage:
                            "url(https://tse3-mm.cn.bing.net/th/id/OIP-C.ewcFzK498YFXIIoRpSusmQHaKZ?pid=ImgDet&rs=1)",
                    }}
                ></div>
                <div className={style.right}>
                    <div className={style.title}>路径追踪渲染器</div>
                    <Form
                        name="login"
                        wrapperCol={{ span: 24 }}
                        form={form}
                        className={style.form}
                    >
                        <Form.Item
                            name="email"
                            wrapperCol={{ offset: 0, span: 20 }}
                            rules={[
                                {
                                    required: true,
                                    message: "Please input your eamil",
                                },
                            ]}
                            required
                            className={style.formItem}
                        >
                            <Input placeholder="请输入邮箱" />
                        </Form.Item>
                        <Form.Item
                            name="vCode"
                            wrapperCol={{ offset: 0, span: 20 }}
                            required
                            className={style.formItem}
                        >
                            <Row gutter={8}>
                                <Col span={12}>
                                    <Form.Item
                                        name="vCode"
                                        noStyle
                                        rules={[
                                            {
                                                required: true,
                                                message:
                                                    "Please input the verification code",
                                            },
                                        ]}
                                    >
                                        <Input placeholder="请输入验证码" />
                                    </Form.Item>
                                </Col>
                                <Col span={4}>
                                    <Button
                                        disabled={count !== 0}
                                        onClick={handleSendVCode}
                                    >
                                        {count === 0
                                            ? "发送验证码"
                                            : count}
                                    </Button>
                                </Col>
                            </Row>
                        </Form.Item>
                        <Form.Item
                            name="remember"
                            valuePropName="checked"
                            wrapperCol={{ offset: 0, span: 16 }}
                            className={style.formItem}
                        >
                            <Checkbox>记住我</Checkbox>
                        </Form.Item>

                        <Form.Item wrapperCol={{ offset: 0, span: 20 }} className={style.formItem}>
                            <Button type="primary" htmlType="submit" onClick={handleSubmit} className={style.submit}>
                                登录 / 注册
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </Modal>
    );
}
