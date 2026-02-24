import { useAsyncEffect } from "@evanpatchouli/react-hooks-kit";
import * as LoginLogAPI from "@/api/login-log.api";
import { useState } from "react";
import { Row, Col, Statistic, Card } from "antd";
import {
  FieldTimeOutlined,
  CalendarOutlined,
  FundOutlined,
} from "@ant-design/icons";

export default function DashboardView() {
  const [dailyCount, setDailyCount] = useState<number>(0);
  const [weeklyCount, setWeeklyCount] = useState<number>(0);
  const [monthlyCount, setMonthlyCount] = useState<number>(0);
  const [yearlyCount, setYearlyCount] = useState<number>(0);

  useAsyncEffect(async () => {
    const [daily, weekly, monthly, yearly] = await Promise.all([
      LoginLogAPI.count("daily"),
      LoginLogAPI.count("weekly"),
      LoginLogAPI.count("monthly"),
      LoginLogAPI.count("yearly"),
    ]);

    setDailyCount(daily.getData() || 0);
    setWeeklyCount(weekly.getData() || 0);
    setMonthlyCount(monthly.getData() || 0);
    setYearlyCount(yearly.getData() || 0);
  }, []);

  return (
    <div style={{ padding: "24px" }}>
      {/* 标题行 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <h2 style={{ margin: 0 }}>登录人次统计</h2>
        </Col>
      </Row>

      {/* 统计数据卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          >
            <Statistic
              title={
                <span>
                  <FieldTimeOutlined
                    style={{ marginRight: 8, color: "#1890ff" }}
                  />
                  今日登录
                </span>
              }
              value={dailyCount}
              valueStyle={{ color: "#1890ff", fontSize: 28 }}
              suffix="人次"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          >
            <Statistic
              title={
                <span>
                  <CalendarOutlined
                    style={{ marginRight: 8, color: "#52c41a" }}
                  />
                  本周登录
                </span>
              }
              value={weeklyCount}
              valueStyle={{ color: "#52c41a", fontSize: 28 }}
              suffix="人次"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          >
            <Statistic
              title={
                <span>
                  <CalendarOutlined
                    style={{ marginRight: 8, color: "#fa8c16" }}
                  />
                  本月登录
                </span>
              }
              value={monthlyCount}
              valueStyle={{ color: "#fa8c16", fontSize: 28 }}
              suffix="人次"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          >
            <Statistic
              title={
                <span>
                  <FundOutlined style={{ marginRight: 8, color: "#722ed1" }} />
                  本年登录
                </span>
              }
              value={yearlyCount}
              valueStyle={{ color: "#722ed1", fontSize: 28 }}
              suffix="人次"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
