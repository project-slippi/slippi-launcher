import type { Meta, StoryObj } from "@storybook/react-webpack5";
import React from "react";

import { PlayButton, UpdatingButton } from "./play_button";

const meta = {
  title: "Components/PlayButton",
  component: PlayButton,
} satisfies Meta<typeof PlayButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {},
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Updating = () => {
  const [percent, setPercent] = React.useState(0);
  const timer = React.useRef<number | undefined>();

  const startTimer = React.useCallback(() => {
    const incPercent = () => {
      if (percent < 100) {
        setPercent((p) => p + 1);
      } else {
        clearTimeout(timer.current);
      }
    };
    timer.current = window.setTimeout(incPercent, 20);
  }, [percent]);

  const reset = React.useCallback(() => {
    clearTimeout(timer.current);
    setPercent(0);
    startTimer();
  }, [startTimer, setPercent]);

  React.useEffect(() => {
    startTimer();
    return () => {
      clearTimeout(timer.current);
    };
  });

  return (
    <div>
      <UpdatingButton fillPercent={percent / 100} />
      <div>
        <button onClick={reset}>reset</button>
      </div>
    </div>
  );
};
