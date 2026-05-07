import { css } from "@emotion/react";
import React from "react";

import { AuthGuard } from "@/components/auth_guard";
import type { AuthUser } from "@/services/auth/types";

import { SettingItem } from "../setting_item_section";
import { ChatMessagesFooter } from "./chat_messages_footer";
import { ChatMessagesInput } from "./chat_messages_input";
import { ChatSettingsMessages as Messages } from "./chat_settings.messages";
import { useChatMessages } from "./use_chat_messages";

const ChatConfigSettings = React.memo(({ user }: { user: AuthUser }) => {
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

  const footer: React.ReactNode = React.useMemo(() => {
    if (!dirty) {
      return null;
    }
    return (
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
  }, [dirty, discardLocalChanges, loading, submitChatMessages]);

  return (
    <>
      <ChatMessagesInput
        messages={localMessages}
        updateMessages={setLocalMessages}
        availableMessages={availableMessages}
        user={{ uid: user.uid, subLevel }}
      />
      {footer}
    </>
  );
});

export const ChatSettings = React.memo(() => {
  return (
    <div
      css={css`
        min-width: 450px;
      `}
    >
      <SettingItem name={Messages.chatMessages()} description={Messages.chatMessagesDescription()}>
        <AuthGuard
          fallback={<div>{Messages.pleaseLoginToUseFeature()}</div>}
          render={(user) => <ChatConfigSettings user={user} />}
        />
      </SettingItem>
    </div>
  );
});
