import { ReplayBrowserPage } from "./replays_page";

export function createReplaysPage(): { Page: React.ComponentType } {
  const Page = () => <ReplayBrowserPage />;

  return { Page };
}
