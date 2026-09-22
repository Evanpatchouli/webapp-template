import { Alert, Button, Card, Row, Col, Space, Typography } from "antd";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { useLoginStore } from "@/auth/store";
import { refreshSession, safeReturnTo, startLogin } from "@/auth/session";
import { APP_NAME, SYSTEM_NAME } from "@/constants";
import { createStyles } from "@/utils/style.util";
import { useTitle } from "@evanpatchouli/react-hooks-kit";

const { Title, Text } = Typography;

export default function LoginView() {
  useTitle("登录 - WebApp");
  const status = useLoginStore((state) => state.status);
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const loggedOut = params.get("loggedOut") === "1" || location.pathname === "/logout";
  const error = params.get("error");
  const returnTo = safeReturnTo(params.get("returnTo"));
  const errorText = error === "account_not_linked" ? "此账号尚未关联，请联系管理员开通。" :
    error ? "身份认证失败，请重新登录。" : null;

  return (
    <div style={styles.container}>
      <Card
        style={styles.actionCard}
        styles={{ body: styles.actionCardBody }}
        variant="borderless"
      >
        <Row style={{ flex: 1 }}>
          {/* 左侧区域，系统名称LOGO等 */}
          <Col span={7} style={styles.leftSide}>
            <div>
              <Title level={3} style={{ color: "#fff", margin: 0 }}>
                {APP_NAME}
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                {SYSTEM_NAME}
              </Text>
            </div>
          </Col>

          {/* 右侧区域，放置登录表单等 */}
          <Col span={17} style={styles.rightSide}>
            <Space orientation="vertical" size="large" style={{ width: "100%" }}>
              <div>
                <Title level={2}>{loggedOut && status === "anonymous" ? "已退出当前应用" : "欢迎登录"}</Title>
                <Text type="secondary">使用 Nexus Auth 统一身份认证</Text>
              </div>
              {errorText ? <Alert type="error" showIcon title={errorText} /> : null}
              {loggedOut ? <Text type="secondary">点击登录可再次进入；中心 SSO 会话可能仍有效。</Text> : null}
              {status === "error" ? <>
                <Alert type="warning" title="无法确认登录状态，请重试" />
                <Button block onClick={() => void refreshSession()}>重试</Button>
              </> : status === "authenticated" && !errorText ? (
                <Button block size="large" type="primary" onClick={() => navigate(returnTo.slice(2))}>进入管理后台</Button>
              ) : (
                <Button block size="large" type="primary" loading={status === "loading"} onClick={() => startLogin(returnTo)}>使用 Nexus Auth 登录</Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

const styles = createStyles({
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  actionCardBody: {
    display: "flex",
    padding: 0,
  },
  actionCard: {
    width: 680,
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    borderRadius: 12,
  },
  leftSide: {
    paddingBlock: "20px",
    background:
      // "#1677ff", // 单色
      // "linear-gradient(180deg, #4096ff 0%, #0958d9 100%)", // 从下到上渐变
      // "linear-gradient(180deg, #0958d9 0%, #4096ff 100%)", // 从上到下渐变
      "linear-gradient(90deg, #0958d9 0%, #4096ff 100%)", // 从左到右渐变
    // "linear-gradient(-90deg, #0958d9 0%, #4096ff 100%)", // 从右到左渐变
    // "linear-gradient(-45deg, #0958d9 0%, #4096ff 75%, #69b1ff 100%)", // 从右下到左上渐变
    // "linear-gradient(135deg, #0958d9 0%, #4096ff 75%, #69b1ff 100%)", // 从左上到右下渐变
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#fff",
  },
  rightSide: {
    paddingBlock: "20px",
    backgroundColor: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "0 50px",
    height: 480,
  },

  corner: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 60,
    height: 60,
    cursor: "pointer",
    zIndex: 10,
  },
  ribbon: {
    width: 0,
    height: 0,
    borderStyle: "solid",
    borderWidth: "0 68px 68px 0",
    borderColor: "transparent #1677ffac transparent transparent",
  },
  icon: {
    position: "absolute",
    top: 6,
    right: 14,
    color: "#fff",
    fontSize: 32,
  },
});
