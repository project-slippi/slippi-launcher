import type { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";

import { PlayButton, UpdatingButton } from "./PlayButton";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Components/PlayButton",
  component: PlayButton,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof PlayButton>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof PlayButton> = (args) => <PlayButton {...args} />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {};

export const Disabled = Template.bind({});
Disabled.args = {
  disabled: true,
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
