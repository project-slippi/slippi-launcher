import { colors } from "@common/colors";
import { css } from "@emotion/react";
import type { GlobalStats } from "@replays/stats";
import _ from "lodash";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

const CustomizedLabel: React.FC<any> = (props) => {
  const { height, width, key, x, y, value, color } = props;
  if (width < 20) {
    return <text />;
  } else {
    return (
      <text style={{ fill: color, fontWeight: "bold" }} {...props} key={key} x={x + 5} y={y + (height * 1.25) / 2}>
        {value}
      </text>
    );
  }
};

export const OpponentTable: React.FC<{ stats: GlobalStats }> = ({ stats }) => {
  const oppStats = stats.opponents;
  const data = Object.keys(oppStats)
    .sort((a, b) => oppStats[b].count - oppStats[a].count)
    .slice(0, 26)
    .map((k) => {
      console.log(k);
      const op = oppStats[k];
      return {
        playerTag: k,
        won: op.won + 2,
        lost: op.count - op.won,
      };
    })
    .slice(0, 15);

  return (
    <ResponsiveContainer height={600}>
      <BarChart
        css={css`
            text-color: {colors.offWhite};
            `}
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 50, left: 0, bottom: 0 }}
      >
        <XAxis type="number" hide />
        <YAxis
          width={140}
          tickLine={false}
          axisLine={false}
          stroke="#ccc"
          type="category"
          dataKey="playerTag"
          interval={0}
        />
        <Bar stackId="1" dataKey="lost" fill="red" label={<CustomizedLabel label="20" color={colors.greenDark} />} />
        <Bar stackId="1" dataKey="won" fill={colors.greenDark} label={<CustomizedLabel label="20" color="red" />} />
      </BarChart>
    </ResponsiveContainer>
  );
};
