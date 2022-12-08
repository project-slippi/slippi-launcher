import { generateDisplayPicture } from "@/lib/displayPicture";

import { UserInfo } from "./UserInfo";

// type UserInfoProps = React.ComponentProps<typeof UserInfo>;

export default {
  title: "containers/Header/UserInfo",
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
};

const displayPicture = generateDisplayPicture("");

export const StandardUserInfo = () => {
  return <UserInfo displayName="Player name" displayPicture={displayPicture} connectCode="TEST#000" />;
};

export const LoadingUserInfo = () => {
  return <UserInfo displayName="Player name" displayPicture={displayPicture} connectCode="TEST#000" loading={true} />;
};

export const ErrorUserInfo = () => {
  return (
    <UserInfo
      displayName="Player name"
      displayPicture={displayPicture}
      connectCode="TEST#000"
      errorMessage="Some error message"
    />
  );
};
