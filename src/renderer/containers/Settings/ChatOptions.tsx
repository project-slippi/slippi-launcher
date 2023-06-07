import { css } from "@emotion/react";
import React from "react";

import { ChatMessagesFooter } from "@/components/ChatMessagesFooter";
import { ChatMessagesInput } from "@/components/ChatMessagesInput";
import { useAccount } from "@/lib/hooks/useAccount";
import { useChatMessages } from "@/lib/hooks/useChatMessages";

import { SettingItem } from "./SettingItem";

export const ChatOptions: React.FC = () => {
  const user = useAccount((store) => store.user);
  const {
    loading,
    localMessages,
    setLocalMessages,
    dirty,
    subLevel,
    availableMessages,
    submitChatMessages,
    discardLocalChanges,
  } = useChatMessages(user?.uid);

  let footer = null;
  if (dirty) {
    footer = (
      <>
        {/*Element makes space for the footer when we are scrolled all the way down*/}
        <div
          css={css`
            height: 32px;
          `}
        />

        <div
          css={css`
            position: fixed;
            bottom: 0;
            padding: 16px;
            width: 100%;
            margin-left: -30px;
            background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 50%, rgba(0, 0, 0, 0));
          `}
        >
          <ChatMessagesFooter
            loading={loading}
            dirty={dirty}
            saveToDatabase={submitChatMessages}
            discardChanges={discardLocalChanges}
          />
        </div>
      </>
    );
  }

  return (
    <div
      css={css`
        min-width: 450px;
      `}
    >
      <SettingItem name="Chat Messages" description="Chat messages to use for netplay">
        <ChatMessagesInput
          messages={localMessages}
          updateMessages={setLocalMessages}
          availableMessages={availableMessages}
          user={{ uid: user?.uid, subLevel }}
        />
        {footer}
      </SettingItem>
    </div>
  );
};
