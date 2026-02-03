import React, { useMemo } from "react";
import { UserOutlined } from "@ant-design/icons";
import {
  Flex,
  Layout,
  Menu,
  theme,
  Typography,
  type MenuProps,
} from "antd";
import { Outlet, useLocation, useNavigate } from "react-router";
import { APP_NAME } from "@/constants";
import { withoutTrailingSlash } from "ufo";
import useLoginCheck from "@/hooks/useLoginCheck";

const { Header, Content, Footer, Sider } = Layout;

type OnItemClick = (key: string) => void;

const createItems = (onItemClick: OnItemClick) =>
  [
    {
      key: "/role",
      icon: React.createElement(UserOutlined),
      label: "角色管理",
    },
    {
      key: "/permission-demo",
      icon: React.createElement(UserOutlined),
      label: "权限示例",
    },
  ].map((item) => ({
    ...item,
    onClick: () => onItemClick(item.key),
  })) as MenuProps["items"];

export default function Home() {
  useLoginCheck();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const nav = useNavigate();

  const [selected, setSelected] = React.useState<string>("");
  const items = useMemo(
    () =>
      createItems((key) => {
        setSelected(key);
        nav(key);
      }),
    [nav, setSelected],
  );

  const location = useLocation();

  React.useEffect(() => {
    const path = location.pathname;
    const targetSelected = withoutTrailingSlash(path);
    if (selected !== targetSelected) {
      setSelected(targetSelected);
    }
  }, [location.pathname, selected]);

  return (
    <Layout style={{ minHeight: '100vh', maxHeight: '100vh' }}>
      <Sider
        style={styles.siderStyle}
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={(broken) => {
          console.log(broken);
        }}
        onCollapse={(collapsed, type) => {
          console.log(collapsed, type);
        }}
      >
        <Flex style={styles.menuHeaderStyle} align="center">
          <img
            src="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"
            alt="logo"
            style={{ width: 32 }}
          />
          <Typography.Text style={styles.menuHeaderTextStyle}>
            {APP_NAME}
          </Typography.Text>
        </Flex>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["4"]}
          items={items}
          selectedKeys={[selected]}
        />
      </Sider>
      <Layout style={{ display: 'flex', flexDirection: 'column' }}>
        <Header style={{ padding: 0, background: colorBgContainer, flexShrink: 0 }} />
        <Content style={{ margin: "24px 16px 0", flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            style={{
              padding: 24,
              flex: 1,
              overflow: 'auto',
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
        <Footer style={{ textAlign: "center", flexShrink: 0 }}>
          Ant Design ©{new Date().getFullYear()} Created by Ant UED
        </Footer>
      </Layout>
    </Layout>
  );
}

const styles = {
  menuHeaderStyle: {
    padding: "10px 12px 8px 12px",
  } as React.CSSProperties,
  menuHeaderTextStyle: {
    marginInlineStart: 12,
    color: "#eee",
    fontSize: 18,
  } as React.CSSProperties,
  siderStyle: {
    // overflow: 'auto',
    // height: '100vh',
    // position: 'sticky',
    // insetInlineStart: 0,
    // top: 0,
    // scrollbarWidth: 'thin',
    // scrollbarGutter: 'stable',
  } as React.CSSProperties,
};
