import { isEqual, keyBy } from "lodash";
import { useCallback, useEffect, useState } from "react";

import { useToasts } from "@/lib/hooks/useToasts";
import { useServices } from "@/services";
import type { AvailableMessageType } from "@/services/slippi/types";

import { defaultMessages } from "./default_chat_messages";

const validateMessages = (messages: string[], availableMessages: AvailableMessageType[]): string[] => {
  const optionsByText = keyBy(availableMessages, "text");
  return messages.map((msg, idx) => {
    return optionsByText[msg] ? msg : defaultMessages[idx];
  });
};

export const useChatMessages = (uid?: string) => {
  const { slippiBackendService } = useServices();
  const { showError } = useToasts();

  const [loading, setLoading] = useState(false);
  const [localMessages, setLocalMessages] = useState<string[]>([]);
  const [dbMessages, setDbMessages] = useState<string[]>([]);
  const [availableMessages, setAvailableMessages] = useState<AvailableMessageType[]>([]);
  const [subLevel, setSubLevel] = useState("NONE");

  const refreshChatMessages = useCallback(async () => {
    if (loading || !uid) {
      return;
    }

    setLoading(true);

    await slippiBackendService
      .fetchChatMessageData(uid)
      .then((msgData) => {
        const validatedMessages = validateMessages(msgData.userMessages, msgData.availableMessages);
        setLocalMessages(validatedMessages);
        setDbMessages(validatedMessages);
        setAvailableMessages(msgData.availableMessages);
        setSubLevel(msgData.level);
      })
      .catch((err) => {
        setLocalMessages([]);
        setDbMessages([]);
        showError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slippiBackendService, uid, loading, showError]);

  const submitChatMessages = useCallback(async () => {
    if (loading || !uid) {
      return;
    }

    setLoading(true);

    await slippiBackendService
      .submitChatMessages(uid, localMessages)
      .then((activeMessages) => {
        setLocalMessages(activeMessages);
        setDbMessages(activeMessages);
      })
      .catch((err) => {
        showError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slippiBackendService, uid, loading, localMessages, showError]);

  const discardLocalChanges = useCallback(() => {
    setLocalMessages(dbMessages);
  }, [dbMessages]);

  // Only run once on mount
  useEffect(() => {
    refreshChatMessages().catch(console.error);
  }, []);

  return {
    loading,
    localMessages,
    setLocalMessages,
    dirty: !isEqual(localMessages, dbMessages),
    availableMessages,
    subLevel,
    refreshChatMessages,
    submitChatMessages,
    discardLocalChanges,
  };
};
