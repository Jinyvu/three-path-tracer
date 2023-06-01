import style from "./style.module.scss";
import { useState, useEffect, useRef } from "react";
import {
    Modal,
    Form,
    Input,
    Checkbox,
    Button,
    Row,
    Col,
    Menu,
    message,
} from "antd";
import { setLoginDialog, login } from "@/stores/main/reducer";
import { useAppDispatch } from "@/stores/hooks";
import { userApis } from "@/services";
import Cookies from "js-cookie";

export default function LoginDialog() {
    const [count, setCount] = useState<number>(0);
    const [mode, setMode] = useState<"login" | "register">("login"); // 0是注册，1是登录
    const [verifyCode, setVerifyCode] = useState<string>("");
    const latestCount = useRef(count); // 定义一个ref，初始值是10
    const [form] = Form.useForm();

    useEffect(() => {
        latestCount.current = count;
    }, [count]);

    useEffect(() => {
        if (count === 60) {
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

    const handleSendVCode = async () => {
        const formData = form.getFieldsValue();
        console.log(formData);
        if (!formData.email) {
            message.warning("请输入邮箱！");
            return;
        }
        setCount(60);
        const { code } = await userApis.getVerifyCode({
            email: formData.email,
        });
        console.log(code);
        setVerifyCode(code);
    };

    const handleSubmit = () => {
        const formData = form.getFieldsValue();
        console.log(formData);
        if (mode === "register") {
            if (formData.vCode !== verifyCode) {
                message.warning("验证码错误！");
                return;
            }
            if (formData.password !== formData.passwordRepeat) {
                message.warning("两次输入的密码不一致！");
                return;
            }
            userApis
                .register({
                    email: formData.email,
                    userName: formData.userName,
                    password: formData.password,
                })
                .then((data) => {
                    dispatch(login(data));
                    dispatch(setLoginDialog(false));
                    Cookies.set("userEmail", data.userEmail);
                    Cookies.set("userId", data.userId);
                    Cookies.set("userName", data.userName);
                })
                .catch((err) => {
                    console.log("登录失败", err);
                });
        } else if (mode === "login") {
            userApis
                .login({
                    userName: formData.userName,
                    password: formData.password,
                })
                .then((data) => {
                    dispatch(login(data));
                    dispatch(setLoginDialog(false));
                    Cookies.set("userEmail", data.userEmail);
                    Cookies.set("userId", data.userId);
                    Cookies.set("userName", data.userName);
                });
        }
    };

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
                        backgroundImage: "url(/images/cover.png)",
                    }}
                ></div>
                <div className={style.right}>
                    <div className={style.title}>路径追踪渲染器</div>
                    <Menu
                        onClick={(item) => {
                            setMode(item.key as "login" | "register");
                        }}
                        selectedKeys={[mode]}
                        mode="horizontal"
                        items={[
                            {
                                label: "登录",
                                key: "login",
                            },
                            {
                                label: "注册",
                                key: "register",
                            },
                        ]}
                    />
                    <Form
                        name="form"
                        wrapperCol={{ span: 24 }}
                        form={form}
                        className={style.form}
                    >
                        {mode === "register" && (
                            <Form.Item
                                name="email"
                                wrapperCol={{ offset: 0, span: 20 }}
                                rules={[
                                    {
                                        required: true,
                                        message: "Please input your email",
                                    },
                                ]}
                                required
                                className={style.formItem}
                            >
                                <Input placeholder="请输入邮箱" />
                            </Form.Item>
                        )}
                        {mode === "register" && (
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
                                            {count === 0 ? "发送验证码" : count}
                                        </Button>
                                    </Col>
                                </Row>
                            </Form.Item>
                        )}

                        <Form.Item
                            name="userName"
                            wrapperCol={{ offset: 0, span: 20 }}
                            rules={[
                                {
                                    required: true,
                                    message: "Please input your name",
                                },
                            ]}
                            required
                            className={style.formItem}
                        >
                            <Input placeholder="请输入用户名" />
                        </Form.Item>
                        <Form.Item
                            name="password"
                            wrapperCol={{ offset: 0, span: 20 }}
                            rules={[
                                {
                                    required: true,
                                    message: "Please input your password",
                                },
                            ]}
                            required
                            className={style.formItem}
                        >
                            <Input.Password placeholder="请输入密码" />
                        </Form.Item>
                        {mode === "register" && (
                            <Form.Item
                                name="passwordRepeat"
                                wrapperCol={{ offset: 0, span: 20 }}
                                rules={[
                                    {
                                        required: true,
                                        message:
                                            "Please input your password again",
                                    },
                                ]}
                                required
                                className={style.formItem}
                            >
                                <Input.Password placeholder="请再次输入密码" />
                            </Form.Item>
                        )}

                        <Form.Item
                            name="remember"
                            valuePropName="checked"
                            wrapperCol={{ offset: 0, span: 16 }}
                            className={style.formItem}
                        >
                            <Checkbox>记住我</Checkbox>
                        </Form.Item>

                        <Form.Item
                            wrapperCol={{ offset: 0, span: 20 }}
                            className={style.formItem}
                        >
                            <Button
                                type="primary"
                                htmlType="submit"
                                onClick={handleSubmit}
                                className={style.submit}
                            >
                                {mode === "login" ? "登录" : "注册"}
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </Modal>
    );
}
