"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Config, Result } from "@/lib/ai/types";
import { Label } from "recharts";
import { transformDataForMultiLineChart } from "@/lib/ai/rechart-format";

function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Utilities
export const formatCurrency = (value: number): string => {
  if (value >= 1000000000) {
    const billions = value / 1000000000;
    return `$${billions.toFixed(1)}B`;
  } else if (value >= 1000000) {
    const millions = value / 1000000;
    return `$${millions.toFixed(1)}M`;
  } else if (value >= 100000) {
    const thousands = value / 1000;
    return `$${thousands.toFixed(1)}K`;
  } else {
    const thousands = value / 1000;
    return `$${thousands.toFixed(0)}`;
  }
};
const colors = [
  "hsl(0, 0%, 20%)",   // Dark
  "hsl(0, 0%, 30%)",
  "hsl(0, 0%, 40%)",
  "hsl(0, 0%, 50%)",
  "hsl(0, 0%, 60%)",
  "hsl(0, 0%, 70%)",
  "hsl(0, 0%, 80%)",
  "hsl(0, 0%, 90%)",   // Light
];

export function DynamicChart({
  chartData,
  chartConfig,
}: {
  chartData: Result[];
  chartConfig: Config;
}) {
  const renderChart = () => {
    if (!chartData || !chartConfig) return <div>No chart data</div>;
    const parsedChartData = chartData.map((item) => {
      const parsedItem: { [key: string]: any } = {};
      for (const [key, value] of Object.entries(item)) {
        parsedItem[key] = isNaN(Number(value)) ? value : Number(value);
      }
      return parsedItem;
    });

    chartData = parsedChartData;

    const processChartData = (data: Result[], chartType: string) => {
      if (chartType === "bar" || chartType === "pie") {
        if (data.length <= 8) {
          return data;
        }

        const subset = data.slice(0, 20);
        return subset;
      }
      return data;
    };

    chartData = processChartData(chartData, chartConfig.type);
    // console.log({ chartData, chartConfig });

    switch (chartConfig.type) {
      case "bar":
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chartConfig.xKey}>
              <Label
                value={toTitleCase(chartConfig.xKey)}
                offset={0}
                position="insideBottom"
              />
            </XAxis>
            <YAxis tickFormatter={formatCurrency}>
              <Label
                value={toTitleCase(chartConfig.yKeys[0])}
                angle={-90}
                position="insideLeft"
              />
            </YAxis>
            <ChartTooltip content={<ChartTooltipContent />} />
            {chartConfig.legend && <Legend />}
            {chartConfig.yKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        );
      case "line":
        const { data, xAxisField, lineFields } = transformDataForMultiLineChart(
          chartData,
          chartConfig,
        );
        const useTransformedData =
          chartConfig.multipleLines &&
          chartConfig.measurementColumn &&
          chartConfig.yKeys.includes(chartConfig.measurementColumn);
        // console.log(useTransformedData, "useTransformedData");
        // const useTransformedData = false;
        return (
          <LineChart data={useTransformedData ? data : chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={useTransformedData ? chartConfig.xKey : chartConfig.xKey}
            >
              <Label
                value={toTitleCase(
                  useTransformedData ? xAxisField : chartConfig.xKey,
                )}
                offset={0}
                position="insideBottom"
              />
            </XAxis>
            <YAxis tickFormatter={formatCurrency}>
              <Label
                value={toTitleCase(chartConfig.yKeys[0])}
                angle={-90}
                position="insideLeft"
              />
            </YAxis>
            <ChartTooltip content={<ChartTooltipContent />} />
            {chartConfig.legend && <Legend />}
            {useTransformedData
              ? lineFields.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[index % colors.length]}
                  />
                ))
              : chartConfig.yKeys.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[index % colors.length]}
                  />
                ))}
          </LineChart>
        );
      case "area":
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chartConfig.xKey} />
            <YAxis tickFormatter={formatCurrency} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {chartConfig.legend && <Legend />}
            {chartConfig.yKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                fill={colors[index % colors.length]}
                stroke={colors[index % colors.length]}
              />
            ))}
          </AreaChart>
        );
      case "pie":
        // Calculate total for percentage
        const total = chartData.reduce((sum, item) => {
          const value = Number(item[chartConfig.yKeys[0]]);
          return sum + (isNaN(value) ? 0 : value);
        }, 0);

        // Add percentage to each data item
        const pieDataWithPercentage = chartData.map((item) => {
          const value = Number(item[chartConfig.yKeys[0]]);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
          return {
            ...item,
            name: `${item[chartConfig.xKey]} (${percentage}%)`,
            originalName: item[chartConfig.xKey],
          };
        });

        return (
          <PieChart>
            <Pie
              data={pieDataWithPercentage}
              dataKey={chartConfig.yKeys[0]}
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={(entry) => entry.name}
            >
              {pieDataWithPercentage.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
            {chartConfig.legend && <Legend />}
          </PieChart>
        );
      default:
        return <div>Unsupported chart type: {chartConfig.type}</div>;
    }
  };

  return (
    <div className="w-full flex flex-col justify-center items-center">
      <h2 className="text-md font-bold mb-1">{chartConfig.title}</h2>
      {chartConfig && chartData.length > 0 && (
        <ChartContainer
          config={chartConfig.yKeys.reduce(
            (acc, key, index) => {
              acc[key] = {
                label: key,
                color: colors[index % colors.length],
              };
              return acc;
            },
            {} as Record<string, { label: string; color: string }>,
          )}
          className="h-[520px] w-full"
        >
          {renderChart()}
        </ChartContainer>
      )}
      <div className="w-full">
        <p className="mt-4 text-sm">{chartConfig.description}</p>
        <p className="mt-4 text-sm">{chartConfig.takeaway}</p>
      </div>
    </div>
  );
}
