import isEqual from "lodash/isEqual";
import keyBy from "lodash/keyBy";
import { useCallback } from "react";
import { create } from "zustand";
import { combine } from "zustand/middleware";

import { useToasts } from "@/lib/hooks/use_toasts";
import { useServices } from "@/services";
import type { AvailableMessageType, SlippiBackendService } from "@/services/slippi/types";

import { defaultMessages } from "./default_chat_messages";

const validateMessages = (messages: string[], availableMessages: AvailableMessageType[]): string[] => {
  const optionsByText = keyBy(availableMessages, "text");
  return messages.map((msg, idx) => {
    return optionsByText[msg] ? msg : defaultMessages[idx];
  });
};

export const useChatMessagesStore = create(
  combine(
    {
      loading: false,
      localMessages: [] as string[],
      dbMessages: [] as string[],
      availableMessages: [] as AvailableMessageType[],
      subLevel: "NONE",
    },
    (set, get) => ({
      setLoading: (loading: boolean) => set({ loading }),
      setLocalMessages: (localMessages: string[]) => set({ localMessages }),
      setDbMessages: (dbMessages: string[]) => set({ dbMessages }),
      setAvailableMessages: (availableMessages: AvailableMessageType[]) => set({ availableMessages }),
      setSubLevel: (subLevel: string) => set({ subLevel }),
      discardLocalChanges: () => {
        const { dbMessages } = get();
        set({ localMessages: dbMessages });
      },
      resetStore: () => {
        set({
          loading: false,
          localMessages: [],
          dbMessages: [],
          availableMessages: [],
          subLevel: "NONE",
        });
      },
    }),
  ),
);

export async function refreshChatMessages(slippiBackendService: SlippiBackendService, uid: string) {
  const state = useChatMessagesStore.getState();

  if (state.loading) {
    return;
  }

  state.setLoading(true);

  try {
    const msgData = await slippiBackendService.fetchChatMessageData(uid);
    const validatedMessages = validateMessages(msgData.userMessages, msgData.availableMessages);
    useChatMessagesStore.setState({
      localMessages: validatedMessages,
      dbMessages: validatedMessages,
      availableMessages: msgData.availableMessages,
      subLevel: msgData.level,
    });
  } catch (err) {
    useChatMessagesStore.setState({
      localMessages: [],
      dbMessages: [],
    });
    throw err;
  } finally {
    state.setLoading(false);
  }
}

export async function submitChatMessages(slippiBackendService: SlippiBackendService, uid: string, messages: string[]) {
  const state = useChatMessagesStore.getState();

  if (state.loading) {
    return;
  }

  state.setLoading(true);

  try {
    const activeMessages = await slippiBackendService.submitChatMessages(uid, messages);
    useChatMessagesStore.setState({
      localMessages: activeMessages,
      dbMessages: activeMessages,
    });
  } finally {
    state.setLoading(false);
  }
}

export const useChatMessages = (uid?: string) => {
  const { slippiBackendService } = useServices();
  const { showError } = useToasts();

  const loading = useChatMessagesStore((state) => state.loading);
  const localMessages = useChatMessagesStore((state) => state.localMessages);
  const dbMessages = useChatMessagesStore((state) => state.dbMessages);
  const availableMessages = useChatMessagesStore((state) => state.availableMessages);
  const subLevel = useChatMessagesStore((state) => state.subLevel);
  const setLocalMessages = useChatMessagesStore((state) => state.setLocalMessages);
  const discardLocalChanges = useChatMessagesStore((state) => state.discardLocalChanges);

  const dirty = !isEqual(localMessages, dbMessages);

  const handleSubmit = useCallback(async () => {
    if (!uid) {
      return;
    }
    try {
      await submitChatMessages(slippiBackendService, uid, localMessages);
    } catch (err) {
      showError(err);
    }
  }, [slippiBackendService, uid, localMessages, showError]);

  return {
    loading,
    localMessages,
    setLocalMessages,
    dirty,
    availableMessages,
    subLevel,
    submitChatMessages: handleSubmit,
    discardLocalChanges,
  };
};
