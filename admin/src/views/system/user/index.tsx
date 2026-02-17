import { useEffect, useState } from "react";
import * as UserManageAPI from "@/api/user-manage.api";
import {
  Button,
  Dropdown,
  Flex,
  message,
  Modal,
  Table,
  Tag,
  type MenuProps,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  DeleteOutlined,
  MailOutlined,
  PhoneOutlined,
  RedoOutlined,
  WechatOutlined,
} from "@ant-design/icons";
import type { PaginatedResult } from "@/types/resp";
import { ifFalsy } from "@/utils/value";
import USpan from "@/components/unimportant/uspan";
import UA from "@/components/unimportant/ua";
import { ADMIN_USER_ID, sleep } from "@webapp-template/common"

export default function UserManageView() {
  const [userPage, setUserPage] = useState<
    PaginatedResult<Record<string, any>>
  >({
    list: [],
    total: 0,
    page: 1,
    size: 10,
    totalPages: 1,
  });

  const handleMenuClick: MenuProps["onClick"] = (info) => {
    switch (info.key) {
      case "bind_phone":
        message.info("绑定手机功能尚未支持");
        break;
      case "bind_wechat":
        message.info("绑定微信功能尚未支持");
        break;
      case "bind_email":
        message.info("绑定邮箱功能尚未支持");
        break;
      case "reset_password":
        message.info("重置密码功能尚未支持");
        break;
      case "delete":
        Modal.confirm({
          title: "确认删除",
          content: "确认删除该用户吗？",
          onOk: async () => {
            message.loading({ content: "正在删除...", key: "delete" });
            await sleep(1000);
            message.info({ content: "删除功能尚未支持", key: "delete" });
          },
          okText: "确认",
          onCancel: () => { },
          cancelText: "取消",
        })
        break;
      default:
        break;
    };
  }

  const createItems = (record: Record<string, any>): MenuProps["items"] => {
    return [
      {
        label: "绑定手机",
        key: "bind_phone",
        icon: <PhoneOutlined />,
      },
      {
        label: "绑定微信",
        key: "bind_wechat",
        icon: <WechatOutlined />,
      },
      {
        label: "绑定邮箱",
        key: "bind_email",
        icon: <MailOutlined />,
      },
      {
        label: "重置密码",
        key: "reset_password",
        icon: <RedoOutlined />,
        disabled: record.id === ADMIN_USER_ID,
      },
      {
        label: "删除",
        key: "delete",
        icon: <DeleteOutlined />,
        danger: true,
      },
    ]
  };

  const columns: ColumnsType<Record<string, any>> = [
    {
      title: "昵称",
      dataIndex: "nickname",
      fixed: "left",
      width: 200,
      render: (text) => (text ? <a>{text}</a> : <UA>未设置昵称</UA>),
    },
    {
      title: "账号",
      dataIndex: "username",
      render: (text) => ifFalsy(text, <USpan>-</USpan>),
    },
    {
      title: "手机号",
      dataIndex: "phone",
      render: (text) => ifFalsy(text, <USpan>-</USpan>),
    },
    {
      title: "微信",
      dataIndex: "openid",
      render: (openid) =>
        openid ? <Tag color="green">已绑定</Tag> : <Tag>未绑定</Tag>,
    },
    {
      title: "状态",
      dataIndex: "status",
      render: (status) =>
        status ? <Tag color="green">已激活</Tag> : <Tag>未激活</Tag>,
    },
    {
      title: "注册时间",
      dataIndex: "register_at",
      render: (time) => (
        <>
          {time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : <USpan>-</USpan>}
        </>
      ),
    },
    {
      title: "操作",
      render: (_, record) => {
        return (
          <Flex align="center" gap="small">
            <Button>详情</Button>
            <Button disabled={record.id === ADMIN_USER_ID}>禁用</Button>
            <Dropdown.Button
              menu={{
                items: createItems(record),
                onClick: handleMenuClick,
              }}
            >
              更多
            </Dropdown.Button>
          </Flex>
        );
      },
    },
  ];

  useEffect(() => {
    UserManageAPI.queryUserPage({ page: 1, size: 10 }).then((resp) => {
      setUserPage(
        resp.getData() || {
          list: [],
          total: 0,
          page: 1,
          size: 10,
          totalPages: 1,
        },
      );
    });
  }, []);
  return (
    <div>
      <Table
        dataSource={userPage.list}
        columns={columns}
        pagination={{
          pageSize: userPage.size,
          total: userPage.total,
          current: userPage.page,
        }}
      />
    </div>
  );
}
