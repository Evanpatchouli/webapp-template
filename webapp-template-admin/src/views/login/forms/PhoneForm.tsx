import { createStyles } from "@/utils/style.util";
import { PhoneOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Form, Input, Button, Typography, Flex } from "antd";
import { useState } from "react";

export default function PhoneForm() {
  const [count, setCount] = useState(0);

  const sendCode = () => {
    setCount(60);
    const timer = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <Typography.Title level={2}>手机号登录</Typography.Title>
        <Typography.Text type="secondary">
          未绑定账号的手机号将自动创建账号
        </Typography.Text>
      </div>
      <Form layout="vertical">
        <Form.Item name="phone" rules={[{ required: true }]}>
          <Input
            placeholder="手机号"
            prefix={<PhoneOutlined style={styles.inputIcon} />}
          />
        </Form.Item>

        <Form.Item name="code" rules={[{ required: true }]}>
          <Flex gap={8}>
            <Input
              placeholder="验证码"
              prefix={<SafetyCertificateOutlined style={styles.inputIcon} />}
            />
            <Button disabled={count > 0} onClick={sendCode}>
              {count ? `${count}s` : "发送验证码"}
            </Button>
          </Flex>
        </Form.Item>

        <Button type="primary" block>
          登录
        </Button>
      </Form>
    </>
  );
}

const styles = createStyles({
  inputIcon: {
    color: "rgba(0,0,0,0.25)",
  } as React.CSSProperties,
});
