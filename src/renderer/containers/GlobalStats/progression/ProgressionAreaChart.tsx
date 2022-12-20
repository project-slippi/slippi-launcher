import { colors } from "@common/colors";
import moment from "moment";
import React from "react";
import { Area, AreaChart, Legend, Tooltip, XAxis, YAxis } from "recharts";

export const ProgressionAreaChart: React.FC<{
  data: any[] | null;
  areas: string[];
  areaColors?: string[];
  unstack?: boolean;
  size?: { width: number; height: number };
}> = ({ data, areas, areaColors, unstack, size }) => {
  const formatXAxis = (v: any) => {
    const value = new Date(v);
    return moment(value.toLocaleDateString()).format("MMM");
  };

  const areaColors2 = areaColors || [
    colors.greenPrimary,
    colors.purplePrimary,
    "orange",
    "red",
    "yellow",
    "pink",
    colors.offWhite,
  ];

  const data2 = data || [];

  const size2 = size || { width: 400, height: 300 };

  return (
    <AreaChart width={size2.width} height={size2.height} data={data2} style={{ margin: "auto" }}>
      <XAxis dataKey="day" interval={6} tickFormatter={formatXAxis} />
      <YAxis />
      <Tooltip
        contentStyle={{ backgroundColor: colors.purpleDark }}
        labelStyle={{ backgroundColor: colors.purpleDark, color: colors.offWhite }}
        itemStyle={{ backgroundColor: colors.purpleDark, color: colors.greenDark }}
      />
      <Legend />
      {areas.map((area, i) => (
        <Area
          key={area}
          stackId={!unstack ? "1" : i}
          type="monotone"
          dataKey={area}
          fill={areaColors2[i]}
          stroke={areaColors2[i]}
          dot={false}
        />
      ))}
    </AreaChart>
  );
};
