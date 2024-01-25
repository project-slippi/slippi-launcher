import { css } from "@emotion/react";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import type { SelectChangeEvent } from "@mui/material/Select";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import log from "electron-log";
import { capitalize, chain } from "lodash";
import type { MouseEventHandler } from "react";
import React, { useState } from "react";

import type { AvailableMessageType } from "@/services/slippi/types";

import { defaultMessages } from "./default_chat_messages";
import { DpadDirection } from "./dpad_direction";

const dirIdx = {
  up: 0,
  left: 1,
  right: 2,
  down: 3,
};

const genChatMessageItem = (
  key: string,
  message: string,
  isPaid: boolean,
  isDefault: boolean,
  isHovered: boolean,
  updateHoverState: (isHovered: boolean) => void,
  user: { uid: string | undefined; subLevel: string },
) => {
  let adornment = null;
  if (isDefault) {
    adornment = (
      <Typography fontSize="12px" color={"#FFFFFFB0"} marginRight={"6px"} padding={"4px 8px"}>
        Default
      </Typography>
    );
  } else if (isPaid && isHovered && user.subLevel === "NONE") {
    adornment = (
      <div
        css={css`
          display: grid;
          grid-template-columns: auto auto;
          align-items: center;
          justify-items: center;
          gap: 5px;
          padding: 4px 8px;
          margin-right: 6px;
          color: #1b0b28;
          background: #ffffff;
          font-size: 18px;
          border-radius: 4px;
        `}
      >
        <LockOpenIcon fontSize="inherit" />
        <Typography fontSize="12px" color="#1B0B28" fontWeight="500">
          Subscribe
        </Typography>
      </div>
    );
  } else if (isPaid) {
    adornment = (
      <div
        css={css`
          display: grid;
          grid-template-columns: auto auto;
          align-items: center;
          justify-items: center;
          gap: 5px;
          padding: 4px 8px;
          margin-right: 6px;
          color: #b984bb;
          font-size: 18px;
        `}
      >
        <AutoAwesomeIcon fontSize="inherit" />
        <Typography fontSize="12px" color="#b984bb" fontWeight="bold">
          Premium
        </Typography>
      </div>
    );
  }

  let onClickHandler: MouseEventHandler<React.ReactNode> | undefined = undefined;
  let icon = <div />;
  if (isPaid && user.subLevel === "NONE") {
    icon = (
      <div
        css={css`
          color: #ffffff4c;
          font-size: 20px;
          margin-top: 4px;
          margin-right: 6px;
          margin-left: -2px;
        `}
      >
        <LockIcon color="inherit" fontSize="inherit" />
      </div>
    );

    onClickHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      // e.preventDefault();
      const manageUrl = `https://slippi.gg/manage?expectedUid=${user.uid}`;
      window.electron.shell.openExternal(manageUrl).catch(log.error);
    };
  }

  return (
    <MenuItem
      key={key}
      value={message}
      onMouseEnter={() => updateHoverState(true)}
      onMouseLeave={() => updateHoverState(false)}
      onClick={onClickHandler}
    >
      <div
        css={css`
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          width: 100%;
        `}
      >
        {icon}
        {message}
        {adornment}
      </div>
    </MenuItem>
  );
};

type ChatMessageSelectorProps = {
  groupDirection: "up" | "left" | "right" | "down";
  direction: "up" | "left" | "right" | "down";
  message: string;
  availableMessages: AvailableMessageType[];
  updateMessage: (value: string) => void;
  user: { uid: string | undefined; subLevel: string };
};

const ChatMessageSelector = ({
  groupDirection,
  direction,
  message,
  availableMessages,
  updateMessage,
  user,
}: ChatMessageSelectorProps) => {
  const [hoverStates, setHoverStates] = useState<Record<string, boolean>>({});

  const defaultMessage = defaultMessages[dirIdx[groupDirection] * 4 + dirIdx[direction]];

  const updateHoverState = (message: string) => (isHovered: boolean) => {
    setHoverStates((prev) => ({
      ...prev,
      [message]: isHovered,
    }));
  };

  const isLockedByMessage = chain(availableMessages)
    .keyBy("text")
    .mapValues((am) => {
      return am.isPaid && user.subLevel === "NONE";
    })
    .value();

  const items = chain(availableMessages)
    .orderBy(["isPaid", "text"])
    .filter((am) => am.text !== defaultMessage)
    .map((am) =>
      genChatMessageItem(
        `${groupDirection}-${direction}-${am.text}`,
        am.text,
        am.isPaid,
        false,
        hoverStates[am.text] ?? false,
        updateHoverState(am.text),
        user,
      ),
    )
    .value();

  // Add default message to the top of the list
  items.unshift(
    genChatMessageItem(
      `${groupDirection}-${direction}-${defaultMessage}`,
      defaultMessage,
      false,
      true,
      hoverStates[defaultMessage],
      updateHoverState(defaultMessage),
      user,
    ),
  );

  const onChange = (event: SelectChangeEvent<string>) => {
    console.log(`Updating message to ${event.target.value}. isLocked: ${isLockedByMessage[event.target.value]}`);
    if (isLockedByMessage[event.target.value]) {
      // Don't allow change to locked item
      return;
    }

    updateMessage(event.target.value);
  };

  const id = `chat-message-${groupDirection}-${direction}`;
  return (
    <div
      css={css`
        display: grid;
        grid-template-columns: auto auto 10px 1fr;
        align-items: center;
        padding: 5px;
        max-width: 800px;
      `}
    >
      <DpadDirection direction={groupDirection} />
      <DpadDirection direction={direction} />
      <div />
      <FormControl fullWidth={true} size="small">
        <Select
          labelId={`${id}-label`}
          id={id}
          value={message}
          MenuProps={{
            style: {
              height: "calc(100% - 96px)",
              maxHeight: "400px",
            },
          }}
          onChange={onChange}
        >
          {items}
        </Select>
      </FormControl>
    </div>
  );
};

type ChatMessagesSectionProps = {
  direction: "up" | "left" | "right" | "down";
  messages: string[];
  availableMessages: AvailableMessageType[];
  updateLocal: (idx: number, value: string) => void;
  user: { uid: string | undefined; subLevel: string };
};

const ChatMessagesSection = ({
  direction,
  messages,
  availableMessages,
  updateLocal,
  user,
}: ChatMessagesSectionProps) => {
  const updateMessage = (idx: number) => (value: string) => {
    updateLocal(idx, value);
  };

  return (
    <div
      css={css`
        margin-bottom: 32px;
      `}
    >
      <Typography fontSize={15} color={"#FFFFFFAA"} marginBottom={"5px"}>
        Chat Group: {capitalize(direction)}
      </Typography>
      <ChatMessageSelector
        groupDirection={direction}
        direction="up"
        message={messages[0]}
        availableMessages={availableMessages}
        updateMessage={updateMessage(0)}
        user={user}
      />
      <ChatMessageSelector
        groupDirection={direction}
        direction="left"
        message={messages[1]}
        availableMessages={availableMessages}
        updateMessage={updateMessage(1)}
        user={user}
      />
      <ChatMessageSelector
        groupDirection={direction}
        direction="right"
        message={messages[2]}
        availableMessages={availableMessages}
        updateMessage={updateMessage(2)}
        user={user}
      />
      <ChatMessageSelector
        groupDirection={direction}
        direction="down"
        message={messages[3]}
        availableMessages={availableMessages}
        updateMessage={updateMessage(3)}
        user={user}
      />
    </div>
  );
};

type ChatMessagesInputProps = {
  updateMessages: (messages: string[]) => void;
  messages: string[];
  availableMessages: AvailableMessageType[];
  user: { uid: string | undefined; subLevel: string };
};

export const ChatMessagesInput = ({ messages, availableMessages, updateMessages, user }: ChatMessagesInputProps) => {
  // const { showError } = useToasts();

  if (messages.length !== 16 || availableMessages.length === 0) {
    return <CircularProgress color="inherit" size={29} />;
  }

  const onChange = (offset: number) => (idx: number, value: string) => {
    const newMessages = [...messages];
    newMessages[offset + idx] = value;
    updateMessages(newMessages);
  };

  return (
    <div
      css={css`
        margin-top: 16px;
      `}
    >
      <ChatMessagesSection
        direction="up"
        messages={messages.slice(0, 4)}
        availableMessages={availableMessages}
        updateLocal={onChange(0)}
        user={user}
      />
      <ChatMessagesSection
        direction="left"
        messages={messages.slice(4, 8)}
        availableMessages={availableMessages}
        updateLocal={onChange(4)}
        user={user}
      />
      <ChatMessagesSection
        direction="right"
        messages={messages.slice(8, 12)}
        availableMessages={availableMessages}
        updateLocal={onChange(8)}
        user={user}
      />
      <ChatMessagesSection
        direction="down"
        messages={messages.slice(12, 16)}
        availableMessages={availableMessages}
        updateLocal={onChange(12)}
        user={user}
      />
    </div>
  );
};
