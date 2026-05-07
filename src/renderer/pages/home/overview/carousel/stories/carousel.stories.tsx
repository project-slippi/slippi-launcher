import type { Meta, StoryObj } from "@storybook/react-webpack5";

import type { CarouselItem } from "../carousel";
import { Carousel } from "../carousel";

const meta = {
  title: "pages/home/overview/Carousel",
  component: Carousel,
  decorators: [
    (Story) => (
      <div style={{ width: "600px", height: "300px" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    durationMs: {
      control: "number",
      description: "Auto-play interval in milliseconds",
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;

type Story = StoryObj<typeof meta>;

const sampleItems: CarouselItem[] = [
  {
    title: "Title 1",
    subtitle: "Subtitle 1",
    image: "https://placehold.co/600x300/1a1a2e/white?text=Slide+1",
    link: "https://example.com/slide1",
    isHappeningNow: false,
  },
  {
    title: "Title 2",
    subtitle: "Subtitle 2",
    image: "https://placehold.co/600x300/16213e/white?text=Slide+2",
    link: "https://example.com/slide2",
    isHappeningNow: false,
  },
  {
    title: "Title 3",
    subtitle: "Subtitle 3",
    image: "https://placehold.co/600x300/0f3460/white?text=Slide+3",
    link: "https://example.com/slide3",
    isHappeningNow: false,
  },
  {
    title: "Title 4",
    subtitle: "Subtitle 4",
    image: "https://placehold.co/600x300/e94560/white?text=Slide+4",
    link: "https://example.com/slide4",
    isHappeningNow: false,
  },
];

export const Default: Story = {
  args: {
    items: sampleItems,
  },
};

export const CustomDuration: Story = {
  args: {
    items: sampleItems,
    durationMs: 2000,
  },
};

export const SingleItem: Story = {
  args: {
    items: [sampleItems[0]],
  },
};

export const WithHappeningNow: Story = {
  args: {
    items: sampleItems.map((item) => ({ ...item, isHappeningNow: true })),
  },
};

export const TwoItems: Story = {
  args: {
    items: sampleItems.slice(0, 2),
  },
};
