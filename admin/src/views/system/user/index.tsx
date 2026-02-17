import { useEffect, useState } from "react";
import * as UserManageAPI from "@/api/user-manage.api";
import {
  Button,
  Dropdown,
  Flex,
  Form,
  Input,
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
import { ADMIN_USER_ID } from "@webapp-template/common"

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
  const [phoneModal, setPhoneModal] = useState({ open: false, userId: "" });
  const [emailModal, setEmailModal] = useState({ open: false, userId: "" });
  const [phoneForm] = Form.useForm();
  const [emailForm] = Form.useForm();

  const loadData = async () => {
    const resp = await UserManageAPI.queryUserPage({ page: userPage.page, size: userPage.size });
    setUserPage(resp.getData() || { list: [], total: 0, page: 1, size: 10, totalPages: 1 });
  };

  const handleMenuClick = (record: Record<string, any>): MenuProps["onClick"] => (info) => {
    switch (info.key) {
      case "bind_phone":
        setPhoneModal({ open: true, userId: record.id });
        phoneForm.setFieldsValue({ phone: record.phone || "" });
        break;
      case "bind_wechat":
        message.info("绑定微信功能尚未支持");
        break;
      case "bind_email":
        setEmailModal({ open: true, userId: record.id });
        emailForm.setFieldsValue({ email: record.email || "" });
        break;
      case "reset_password":
        Modal.confirm({
          title: "确认重置密码",
          content: "确认重置该用户的密码吗？",
          onOk: async () => {
            await UserManageAPI.resetPassword(record.id);
            message.success("密码重置成功");
            loadData();
          },
          okText: "确认",
          cancelText: "取消",
        });
        break;
      case "delete":
        Modal.confirm({
          title: "确认删除",
          content: "确认删除该用户吗？",
          onOk: async () => {
            await UserManageAPI.deleteUser(record.id);
            message.success("删除成功");
            loadData();
          },
          okText: "确认",
          cancelText: "取消",
        });
        break;
    }
  };

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
            <Button onClick={async () => {
              const resp = await UserManageAPI.getUserDetail(record.id);
              Modal.info({
                title: "用户详情",
                content: <pre>{JSON.stringify(resp.getData(), null, 2)}</pre>,
                width: 600,
              });
            }}>详情</Button>
            <Button
              disabled={record.id === ADMIN_USER_ID}
              onClick={async () => {
                await UserManageAPI.toggleUserStatus(record.id);
                message.success(record.status ? "已禁用" : "已启用");
                loadData();
              }}
            >
              {record.status ? "禁用" : "启用"}
            </Button>
            <Dropdown.Button
              menu={{
                items: createItems(record),
                onClick: handleMenuClick(record),
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
      <Modal
        title="更新手机号"
        open={phoneModal.open}
        onCancel={() => setPhoneModal({ open: false, userId: "" })}
        onOk={async () => {
          const values = await phoneForm.validateFields();
          await UserManageAPI.updatePhone(phoneModal.userId, values.phone);
          message.success("手机号更新成功");
          setPhoneModal({ open: false, userId: "" });
          loadData();
        }}
        okText="确认"
        cancelText="取消"
      >
        <Form form={phoneForm} layout="vertical">
          <Form.Item name="phone" label="手机号" rules={[{ required: true, message: "请输入手机号" }]}>
            <Input placeholder="请输入手机号" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="更新邮箱"
        open={emailModal.open}
        onCancel={() => setEmailModal({ open: false, userId: "" })}
        onOk={async () => {
          const values = await emailForm.validateFields();
          await UserManageAPI.updateEmail(emailModal.userId, values.email);
          message.success("邮箱更新成功");
          setEmailModal({ open: false, userId: "" });
          loadData();
        }}
        okText="确认"
        cancelText="取消"
      >
        <Form form={emailForm} layout="vertical">
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: "email", message: "请输入有效的邮箱" }]}>
            <Input placeholder="请输入邮箱" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
