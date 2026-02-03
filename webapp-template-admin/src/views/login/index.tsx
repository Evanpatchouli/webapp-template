import React, { useState } from 'react';
import { Form, Input, Button, Card, Row, Col, Typography, message, QRCode } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined, QrcodeOutlined, DesktopOutlined } from '@ant-design/icons';
import { APP_NAME, CaptchaWay, SYSTEM_NAME } from '@/constants';
import Captcha from '@/components/captcha';
import * as UserAPI from "@/api/user.api"
import type { AccountLoginForm } from '@/types/user';
import { useEmit } from '@/hooks/useEmitter';
import { UserLoginEvent } from '@/events/user.event';
import { useNavigate } from 'react-router';
import { useLoginStore } from '@/auth/store';

const { Title, Text } = Typography;

// 登录模式枚举
enum LoginMode {
  ACCOUNT = 'account',
  QRCODE = 'qrcode',
  PHONE = 'phone',
}

enum AccountMode {
  LOGIN = 'login',
  REGISTER = 'register',
}

const LoginView: React.FC = () => {
  const nav = useNavigate();
  const emitter = useEmit();
  const [form] = Form.useForm();
  const [loginMode, setLoginMode] = useState<LoginMode>(LoginMode.ACCOUNT);
  const [accountMode, setAccountMode] = useState<AccountMode>(AccountMode.LOGIN);
  const [loginBtnLoading, setLoginBtnLoading] = useState<boolean>(false);
  const [loginBtnDisabled, setLoginBtnDisabled] = useState<boolean>(false);
  const { isLogin } = useLoginStore();

  const accountLoginApi = accountMode === AccountMode.LOGIN ? UserAPI.accountLogin : UserAPI.accountRegister;

  const onFinish = async (values: AccountLoginForm) => {
    if (loginBtnDisabled) return;
    try {
      setLoginBtnLoading(true);
      setLoginBtnDisabled(true);
      const res = await accountLoginApi(values);
      if (res.code == "SUCCESS") {
        emitter.emit('user.login', new UserLoginEvent(res.data!))
        message.success(accountMode === AccountMode.LOGIN ? '登录成功，即将跳转' : '注册成功，自动登录');
        setTimeout(() => {
          nav("/")
        }, 3000);
      } else {
        message.error(res.message);
        setLoginBtnDisabled(false);
      }
    } catch (error) {
      message.error('登录失败');
      setLoginBtnDisabled(false);
    } finally {
      setLoginBtnLoading(false);
    }
  };

  const switchAccountMode = () => {
    setAccountMode(pre => pre === AccountMode.LOGIN ? AccountMode.REGISTER : AccountMode.LOGIN)
  }

  return (
    <div style={styles.container}>
      <Card styles={{ body: { padding: 0, display: 'flex' } }} style={styles.loginCard} variant={"borderless"}>

        {/* 右上角折角切换按钮 */}
        <div
          style={styles.cornerToggle}
          onClick={() => setLoginMode(loginMode === LoginMode.ACCOUNT ? LoginMode.QRCODE : LoginMode.ACCOUNT)}
          title={loginMode === LoginMode.ACCOUNT ? "切换扫码登录" : "切换账号登录"}
        >
          {/* 折角三角形背景 */}
          <div style={styles.cornerRibbon}></div>
          {/* 图标覆盖在折角上 */}
          <div style={styles.cornerIcon}>
            {loginMode === LoginMode.ACCOUNT ? <QrcodeOutlined /> : <DesktopOutlined />}
          </div>
        </div>

        <Row style={{ height: '100%', flex: 1 }}>
          {/* 左侧蓝色区域 */}
          <Col span={7} style={styles.leftSide}>
            <div>
              <Title level={3} style={{ color: '#fff', margin: 0 }}>{APP_NAME}</Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>{SYSTEM_NAME}</Text>
            </div>
          </Col>

          {/* 右侧区域 */}
          <Col span={17} style={styles.rightSide}>
            <div style={styles.formWrapper}>
              {loginMode === LoginMode.ACCOUNT ? (
                /* 账号登录表单 */
                <>
                  <div style={{ marginBottom: 32 }}>
                    <Title level={2}>{accountMode === AccountMode.LOGIN ? (isLogin ? '切换账号' : '欢迎登录') : '账号注册'}</Title>
                    <Text type="secondary" style={styles.registerRightNow} onClick={switchAccountMode}>
                      {accountMode === AccountMode.LOGIN ? isLogin ? '再注册一个新账号？' : '没有账号？立即注册' : '已有账号，前往登录'}
                    </Text>
                  </div>
                  <Form form={form} name="login_form" onFinish={onFinish} layout="vertical" size="large">
                    <Form.Item name="username" rules={[{ required: true, message: '请输入账号' }]}>
                      <Input prefix={<UserOutlined style={styles.inputIcon} />} placeholder="账号" allowClear />
                    </Form.Item>
                    <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                      <Input.Password prefix={<LockOutlined style={styles.inputIcon} />} placeholder="密码" allowClear />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0 }}>
                      <Row gutter={8}>
                        <Col span={16}>
                          <Form.Item name="captcha" rules={[{ required: true, message: '请输入验证码' }]}>
                            <Input prefix={<SafetyCertificateOutlined style={styles.inputIcon} />} maxLength={4} placeholder="4位验证码" allowClear />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <div style={styles.captchaBox}>
                            <Captcha way={CaptchaWay.LOGIN} />
                          </div>
                        </Col>
                      </Row>
                    </Form.Item>
                    <Form.Item style={{ marginTop: 12 }}>
                      <Button type="primary" htmlType="submit" loading={loginBtnLoading} block>立即登录</Button>
                    </Form.Item>
                  </Form>
                </>
              ) : (
                /* 微信扫码登录 */
                <div style={styles.qrCodeWrapper}>
                  <Title level={2} style={{ marginBottom: 8 }}>微信登录</Title>
                  <Text type="secondary">打开微信 - 扫一扫登录</Text>
                  <div style={styles.qrContainer}>
                    <QRCode value="https://ant.design/" status="active" size={200} />
                  </div>
                  <Text type="secondary">扫描二维码安全登录</Text>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default LoginView;

// 样式定义
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  loginCard: {
    width: 650,
    position: 'relative', // 必须
    overflow: 'hidden',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    borderRadius: 12,
  } as React.CSSProperties,

  // 折角触发区域
  cornerToggle: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60,
    height: 60,
    cursor: 'pointer',
    zIndex: 10,
    transition: 'opacity 0.3s',
  } as React.CSSProperties,

  // 折角蓝色三角形
  cornerRibbon: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderWidth: '0 68px 68px 0',
    borderColor: `transparent #1677ffac transparent transparent`,
    position: 'absolute',
    top: 0,
    right: 0,
  } as React.CSSProperties,

  // 折角图标
  cornerIcon: {
    position: 'absolute',
    top: 0 + 6,
    right: 8 + 6,
    color: '#fff',
    fontSize: 32,
  } as React.CSSProperties,

  registerRightNow: {
    textDecoration: 'underline',
    color: '#1677ff80',
    cursor: 'pointer',
  } as React.CSSProperties,

  // 扫码居中容器
  qrCodeWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  } as React.CSSProperties,

  qrContainer: {
    padding: 16,
    background: '#fff',
    border: '1px solid #f0f0f0',
    borderRadius: 8,
    marginBlock: 20,
  } as React.CSSProperties,

  leftSide: {
    paddingBlock: "20px",
    backgroundColor: '#1677ff', // Antd 默认主色
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
  } as React.CSSProperties,

  rightSide: {
    paddingBlock: "20px",
    backgroundColor: '#fff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0 50px',
    height: 450
  } as React.CSSProperties,
  formWrapper: {
    width: '100%',
    maxWidth: 360,
  } as React.CSSProperties,
  captchaBox: {
    height: 40,
    backgroundColor: '#f5f5f5',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    borderRadius: 6,
    overflow: 'hidden',
    border: '1px solid #d9d9d9'
  } as React.CSSProperties,
  inputIcon: {
    color: 'rgba(0,0,0,0.25)',
  } as React.CSSProperties
};