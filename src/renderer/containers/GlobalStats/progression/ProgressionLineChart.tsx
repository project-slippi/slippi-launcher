import { colors } from "@common/colors";
import moment from "moment";
import React from "react";
import { Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

export const ProgressionLineChart: React.FC<{
  data: any[];
  lines: string[];
  lineColors?: string[];
}> = ({ data, lines, lineColors }) => {
  const formatXAxis = (v: any) => {
    const value = new Date(v);
    const month = moment(value.toLocaleDateString()).format("MMM");
    return month;
  };

  const lineColors2 = lineColors || [
    colors.greenPrimary,
    colors.purplePrimary,
    colors.offWhite,
    "red",
    "yellow",
    "orange",
    "pink",
  ];

  return (
    <LineChart width={400} height={300} data={data} style={{ margin: "auto" }}>
      <XAxis dataKey="day" interval={6} tickFormatter={formatXAxis} />
      <YAxis />
      <Tooltip
        contentStyle={{ backgroundColor: colors.purpleDark }}
        labelStyle={{ backgroundColor: colors.purpleDark, color: colors.offWhite }}
        itemStyle={{ backgroundColor: colors.purpleDark, color: colors.greenDark }}
      />
      <Legend />
      {lines.map((line, i) => (
        <Line key={line} type="monotone" dataKey={line} stroke={lineColors2[i]} dot={false} />
      ))}
    </LineChart>
  );
};
