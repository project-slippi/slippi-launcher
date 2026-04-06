import type { DiscoveredConsoleInfo } from "@console/types";
import styled from "@emotion/styled";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import ErrorIcon from "@mui/icons-material/Error";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpIcon from "@mui/icons-material/Help";
import WifiIcon from "@mui/icons-material/Wifi";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { StoredConnection } from "@settings/types";
import log from "electron-log";
import debounce from "lodash/debounce";
import React from "react";
import { useQuery } from "react-query";

import { useConsoleDiscoveryStore } from "@/lib/hooks/use_console_discovery";
import { useServices } from "@/services";
import { ReactComponent as WiiIcon } from "@/styles/images/wii_icon.svg";

import { StartBroadcastDialogMessages as Messages } from "./start_broadcast_dialog.messages";

// These are the default params for broadcasting Netplay Dolphin
const DEFAULT_IP = "127.0.0.1";
const DEFAULT_PORT = 51441;

type StartBroadcastFormData = {
  ip: string;
  port: number;
  viewerId: string;
  connectionType: "dolphin" | "console";
};

type StartBroadcastDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: StartBroadcastFormData) => void;
  savedConnections: StoredConnection[];
  initialAdvancedExpanded?: boolean;
};

type SelectedConnectionType =
  | { type: "saved"; id: number }
  | { type: "discovered"; ip: string }
  | { type: "manual" }
  | null;

export const StartBroadcastDialog = ({
  open,
  onClose,
  onSubmit,
  savedConnections,
  initialAdvancedExpanded = false,
}: StartBroadcastDialogProps) => {
  const { slippiBackendService } = useServices();

  // Minimal state - only what's needed for UX logic
  const [viewerId, setViewerId] = React.useState("");
  const [isAdvancedExpanded, setIsAdvancedExpanded] = React.useState(initialAdvancedExpanded);
  const [connectionType, setConnectionType] = React.useState<"dolphin" | "console">("dolphin");
  const [selectedConnection, setSelectedConnection] = React.useState<SelectedConnectionType>(null);

  // Get discovered consoles from the store
  const discoveredConsoles = useConsoleDiscoveryStore((store) => store.consoleItems);
  const savedIps = savedConnections.map((conn) => conn.ipAddress);
  const availableConsoles = discoveredConsoles.filter((item) => !savedIps.includes(item.ip));

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // Refs for IP/Port inputs to populate them
  const ipInputRef = React.useRef<HTMLInputElement>(null);
  const portInputRef = React.useRef<HTMLInputElement>(null);

  // User validation query
  const userQuery = useQuery(
    ["userId", viewerId],
    async () => {
      if (!viewerId.match(/^[0-9a-zA-Z]+$/)) {
        throw new Error(Messages.invalidUserIdFormat());
      }
      const result = await slippiBackendService.validateUserId(viewerId);
      return result;
    },
    {
      enabled: false,
      retry: false,
    },
  );

  const fetchUser = debounce(async () => {
    await userQuery.refetch();
  }, 200);

  const handleViewerIdChange = React.useCallback(
    (inputText: string) => {
      userQuery.remove();
      setViewerId(inputText);
      void fetchUser();
    },
    [fetchUser, userQuery],
  );

  // Handle selecting a saved connection
  const handleSelectSavedConnection = (conn: StoredConnection) => {
    setConnectionType("console");
    setSelectedConnection({ type: "saved", id: conn.id });
    if (ipInputRef.current) {
      ipInputRef.current.value = conn.ipAddress;
    }
    if (portInputRef.current) {
      portInputRef.current.value = String(conn.port ?? DEFAULT_PORT);
    }
  };

  // Handle selecting a discovered console
  const handleSelectDiscoveredConsole = (console: DiscoveredConsoleInfo) => {
    setConnectionType("console");
    setSelectedConnection({ type: "discovered", ip: console.ip });
    if (ipInputRef.current) {
      ipInputRef.current.value = console.ip;
    }
    if (portInputRef.current) {
      portInputRef.current.value = String(DEFAULT_PORT);
    }
  };

  // Handle accordion expansion change
  const handleAccordionChange = (_: React.SyntheticEvent, expanded: boolean) => {
    setIsAdvancedExpanded(expanded);
    if (!expanded && connectionType === "console") {
      setConnectionType("dolphin");
    }
  };

  // Handle connection type change
  const handleConnectionTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newType = event.target.value as "dolphin" | "console";
    setConnectionType(newType);
    if (newType === "dolphin") {
      // Reset to defaults when switching to Dolphin
      if (ipInputRef.current) {
        ipInputRef.current.value = DEFAULT_IP;
      }
      if (portInputRef.current) {
        portInputRef.current.value = String(DEFAULT_PORT);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const ip = (formData.get("ip") as string) || DEFAULT_IP;
    const port = Number(formData.get("port")) || DEFAULT_PORT;

    onSubmit({
      connectionType,
      ip,
      port,
      viewerId,
    });
    onClose();
  };

  const showErrorStatus = viewerId.length > 0 && userQuery.isError;
  if (showErrorStatus) {
    log.error(`could not get details about spectator: ${userQuery.error}`);
  }

  // Check if a specific connection is selected
  const isSavedSelected = (id: number) => selectedConnection?.type === "saved" && selectedConnection.id === id;
  const isDiscoveredSelected = (ip: string) =>
    selectedConnection?.type === "discovered" && selectedConnection.ip === ip;

  return (
    <Dialog
      open={open}
      fullWidth={true}
      fullScreen={fullScreen}
      onClose={(_, reason) => {
        if (reason !== "backdropClick") {
          onClose();
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <StyledDialogTitle>Start Broadcast</StyledDialogTitle>

        <DialogContent style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <FormControl fullWidth={true}>
            <FormLabel>
              {Messages.spectatorId()}
              <Tooltip title={Messages.theUniqueViewerCodeOfTheSpectator()}>
                <HelpIcon style={{ marginLeft: 10, opacity: 0.7 }} fontSize="small" />
              </Tooltip>
            </FormLabel>
            <Box display="flex" flexDirection="row" gap={2}>
              <TextField
                value={viewerId}
                variant="filled"
                style={{ width: "100%", flex: 1 }}
                onChange={(e) => handleViewerIdChange(e.target.value)}
                error={showErrorStatus}
                helperText={
                  userQuery.isSuccess && userQuery.data
                    ? Messages.broadcastToUser(userQuery.data.displayName, userQuery.data.connectCode)
                    : showErrorStatus
                    ? Messages.noAssociatedUserFound()
                    : undefined
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {viewerId.length > 0 ? (
                        <Tooltip title={Messages.clear()}>
                          <IconButton size="small" onClick={() => handleViewerIdChange("")}>
                            <CloseIcon />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title={Messages.paste()}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              navigator.clipboard
                                .readText()
                                .then((text) => {
                                  if (text) {
                                    handleViewerIdChange(text);
                                  }
                                })
                                .catch(console.error);
                            }}
                          >
                            <AssignmentIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ opacity: viewerId.length === 0 ? 0 : 1 }}>
                <Box sx={{ margin: "12px 12px 0 0" }}>
                  {userQuery.data ? (
                    <CheckCircleIcon
                      style={{
                        color: theme.palette.success.main,
                      }}
                    />
                  ) : userQuery.isError ? (
                    <ErrorIcon
                      style={{
                        color: theme.palette.error.main,
                      }}
                    />
                  ) : (
                    <CircularProgress size={27} />
                  )}
                </Box>
              </Box>
            </Box>
          </FormControl>

          <Accordion expanded={isAdvancedExpanded} onChange={handleAccordionChange}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <FormLabel>Advanced</FormLabel>
            </AccordionSummary>
            <AccordionDetails style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <FormControl>
                <FormLabel>Connection Type</FormLabel>
                <RadioGroup value={connectionType} onChange={handleConnectionTypeChange} row={true}>
                  <FormControlLabel value="dolphin" control={<Radio />} label="Dolphin (Netplay)" />
                  <FormControlLabel value="console" control={<Radio />} label="Console (Wii/Nintendont)" />
                </RadioGroup>
              </FormControl>

              {connectionType === "console" && (
                <FormControl>
                  <FormLabel>Select Connection</FormLabel>
                  <Paper variant="outlined" sx={{ maxHeight: 200, overflow: "auto" }}>
                    <List dense={true}>
                      {savedConnections.map((conn) => (
                        <ListItem key={`saved-${conn.id}`} disablePadding={true}>
                          <ListItemButton
                            selected={isSavedSelected(conn.id)}
                            onClick={() => handleSelectSavedConnection(conn)}
                          >
                            <ListItemIcon>
                              <WiiIcon fill="#ffffff" width="40px" />
                            </ListItemIcon>
                            <ListItemText
                              primary={conn.consoleNick || conn.ipAddress}
                              secondary={`${conn.ipAddress}:${conn.port ?? DEFAULT_PORT}`}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}

                      {availableConsoles.map((console) => (
                        <ListItem key={`discovered-${console.ip}`} disablePadding={true}>
                          <ListItemButton
                            selected={isDiscoveredSelected(console.ip)}
                            onClick={() => handleSelectDiscoveredConsole(console)}
                          >
                            <ListItemIcon>
                              <WifiIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={console.name || console.ip}
                              secondary={`${console.ip} (auto-discovered)`}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}

                      {savedConnections.length === 0 && availableConsoles.length === 0 && (
                        <ListItem>
                          <ListItemText
                            primary="No connections available"
                            secondary="Enable console discovery or add a saved connection"
                            sx={{
                              textAlign: "center",
                              color: "text.secondary",
                            }}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Paper>
                </FormControl>
              )}

              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl sx={{ flex: 3 }}>
                  <FormLabel>IP Address</FormLabel>
                  <TextField name="ip" inputRef={ipInputRef} defaultValue={DEFAULT_IP} fullWidth={true} />
                </FormControl>
                <FormControl sx={{ flex: 1 }}>
                  <FormLabel>Port</FormLabel>
                  <TextField
                    name="port"
                    inputRef={portInputRef}
                    defaultValue={DEFAULT_PORT}
                    type="number"
                    fullWidth={true}
                  />
                </FormControl>
              </Box>
            </AccordionDetails>
          </Accordion>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} color="secondary">
            {Messages.cancel()}
          </Button>
          <Button color="primary" type="submit" disabled={viewerId.length === 0}>
            {Messages.confirm()}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const StyledDialogTitle = styled(DialogTitle)`
  h2 {
    display: flex;
    align-items: center;
  }
`;
