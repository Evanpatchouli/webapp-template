import { useLoginStore } from "@/auth/store";
import { logoutSession, SessionError } from "@/auth/session";
import { Avatar, Dropdown, message, Modal, type MenuProps } from "antd";
import { useState } from "react";

export default function UserAvatar() {
  const userInfo = useLoginStore((state) => state.userInfo);
  const [busy, setBusy] = useState(false);
  const logout = async (sso = false) => {
    if (busy) return;
    setBusy(true);
    try {
      await logoutSession(sso);
    } catch (error) {
      message.error(error instanceof SessionError ? error.message : "退出失败，请重试；尚未确认退出");
    } finally {
      setBusy(false);
    }
  };
  const items: MenuProps["items"] = [
    { key: "nickname", label: userInfo?.nickname || userInfo?.username },
    { key: "logout", label: busy ? "正在退出…" : "退出当前应用", disabled: busy, onClick: () => void logout() },
    { key: "logout-sso", label: "退出中心 SSO", disabled: busy, onClick: () => {
      Modal.confirm({
        title: "退出中心 SSO",
        content: "将退出当前应用并前往认证中心退出。其他应用的本地会话可能仍然存在。",
        okText: "继续退出",
        cancelText: "取消",
        onOk: () => logout(true),
      });
    } },
  ];
  const name = userInfo?.nickname || userInfo?.username;
  return (
    <Dropdown menu={{ items }} placement="bottomRight" arrow>
      <Avatar style={{ backgroundColor: "dodgerblue", cursor: "pointer" }}>
        {name === "超级管理员" ? "管" : name?.slice(0, 1) || "U"}
      </Avatar>
    </Dropdown>
  );
}
