import EChartsReact from "echarts-for-react";
import { useAsyncEffect } from "@evanpatchouli/react-hooks-kit";
import * as LoginLogAPI from "@/api/login-log.api";
import { useState } from "react";
import { Col } from "antd";

export default function DashboardView() {
  const [dailyCount, setDailyCount] = useState<number>(0);
  const [weeklyCount, setWeeklyCount] = useState<number>(0);
  const [monthlyCount, setMonthlyCount] = useState<number>(0);
  const [yearlyCount, setYearlyCount] = useState<number>(0);

  const option = {
    title: {
      text: "登录人次统计",
      left: "center",
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: ["今日", "本周", "本月", "本年"],
      axisLabel: {
        fontSize: 14,
      },
    },
    yAxis: {
      type: "value",
      name: "登录人次",
      nameStyle: { fontSize: 12 },
      axisLabel: { fontSize: 12 },
    },
    series: [
      {
        name: "登录人次",
        type: "bar", // 改用柱状图
        data: [dailyCount, weeklyCount, monthlyCount, yearlyCount],
        itemStyle: {
          color: "#5470c6", // 统一颜色
          borderRadius: [6, 6, 0, 0], // 添加圆角效果
        },
        label: {
          show: true,
          position: "top",
          fontSize: 12,
        },
      },
    ],
    // 添加数据缩放功能（可选）
    dataZoom: [
      {
        type: "inside",
        start: 0,
        end: 100,
      },
    ],
  };

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
    <>
      <Col span={24}>
        <Col span={12}>
          <EChartsReact option={option} style={{ height: 400 }} />
        </Col>
      </Col>
    </>
  );
}
