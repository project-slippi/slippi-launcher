import type { StoredConnection } from "@settings/types";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { QueryClient, QueryClientProvider } from "react-query";
import { action } from "storybook/actions";

import { createServiceProvider } from "@/services/index";
import type { Services } from "@/services/types";

import { StartBroadcastDialog } from "./start_broadcast_dialog";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const mockServices: Partial<Services> = {
  slippiBackendService: {
    validateUserId: async (userId: string) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        displayName: `Player ${userId}`,
        connectCode: `${userId}#123`,
      };
    },
  } as any,

  consoleService: {
    startDiscovery: () => Promise.resolve(),
    stopDiscovery: () => Promise.resolve(),
  } as any,
};

// Create a mock ServiceProvider for stories
const { ServiceProvider } = createServiceProvider({
  services: mockServices as Services,
});

const meta = {
  title: "pages/spectate/StartBroadcastDialog",
  component: StartBroadcastDialog,
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <ServiceProvider>
          <Story />
        </ServiceProvider>
      </QueryClientProvider>
    ),
  ],
  args: {
    open: true,
    onClose: action("onClose"),
    onSubmit: action("onSubmit"),
  },
} satisfies Meta<typeof StartBroadcastDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock saved connections
const mockConnections: StoredConnection[] = [
  {
    id: 1,
    ipAddress: "192.168.1.5",
    port: 51441,
    folderPath: "/home/user/replays/wii-livingroom",
    isRealtime: true,
    consoleNick: "Wii-LivingRoom",
    enableAutoSwitcher: false,
    useNicknameFolders: true,
    enableRelay: false,
  },
  {
    id: 2,
    ipAddress: "192.168.1.10",
    port: 51442,
    folderPath: "/home/user/replays/wii-basement",
    isRealtime: false,
    consoleNick: "Wii-Basement",
    enableAutoSwitcher: true,
    obsIP: "localhost",
    obsPort: "4444",
    obsSourceName: "Gameplay",
    useNicknameFolders: false,
    enableRelay: true,
  },
];

export const Default: Story = {
  args: {
    savedConnections: mockConnections,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Default state showing only the Spectator ID field. Dolphin is selected by default with default IP (127.0.0.1) and port (51441). Click 'Advanced' to configure console connections.",
      },
    },
  },
};

// 2. Advanced expanded with saved connections and discovered consoles
export const AdvancedExpanded: Story = {
  args: {
    savedConnections: mockConnections,
    initialAdvancedExpanded: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Advanced section expanded showing: Connection Type radio buttons, IP/Port fields, and connection selection list. Shows saved connections first, then auto-discovered consoles (filtered to exclude saved IPs), and manual entry option.",
      },
    },
  },
};

// 3. No saved connections - shows empty state with discovered consoles only
export const NoSavedConnections: Story = {
  args: {
    savedConnections: [],
    initialAdvancedExpanded: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "When no saved connections exist, the list shows auto-discovered consoles (if any) and the manual entry option. Connection fields are editable when 'Enter manually' is selected.",
      },
    },
  },
};
