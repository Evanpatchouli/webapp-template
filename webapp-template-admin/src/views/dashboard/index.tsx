import EChartsReact from "echarts-for-react";

export default function DashboardView() {
  const option = {
    title: { text: "销量统计" },
    xAxis: { type: "category", data: ["衬衫", "羊毛衫", "雪纺衫"] },
    yAxis: {},
    series: [{ data: [5, 20, 36], type: "pie" }],
  };

  return (
    <>
      <EChartsReact option={option} style={{ height: 400 }} />
    </>
  );
}
