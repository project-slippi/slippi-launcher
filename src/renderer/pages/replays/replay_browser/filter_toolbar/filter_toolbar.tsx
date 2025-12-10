import { css } from "@emotion/react";
import styled from "@emotion/styled";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import SyncIcon from "@mui/icons-material/Sync";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputBase from "@mui/material/InputBase";
import debounce from "lodash/debounce";
import React from "react";

import { Button, Checkbox, Dropdown } from "@/components/form";
import { useReplayFilter } from "@/lib/hooks/use_replay_filter";
import { useReplayPresenter, useReplays } from "@/lib/hooks/use_replays";
import { useSettings } from "@/lib/hooks/use_settings";
import { useToasts } from "@/lib/hooks/use_toasts";
import { ReplaySortOption, SortDirection } from "@/lib/replay_file_sort";

import { FilterToolbarMessages as Messages } from "./filter_toolbar.messages";

const Outer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 10px;
`;

const ButtonContainer = styled.div`
  & > * {
    margin-right: 20px;
  }
`;

type FilterToolbarProps = {
  disabled?: boolean;
};

export const FilterToolbar = React.forwardRef<HTMLInputElement, FilterToolbarProps>((props, ref) => {
  const presenter = useReplayPresenter();
  const { disabled } = props;
  const rootSlpPath = useSettings((store) => store.settings.rootSlpPath);
  const extraSlpPaths = useSettings((store) => store.settings.extraSlpPaths);
  const currentFolder = useReplays((store) => store.currentFolder);
  const storeSearchText = useReplayFilter((store) => store.searchText);
  const setStoreSearchText = useReplayFilter((store) => store.setSearchText);
  const sortBy = useReplayFilter((store) => store.sortBy);
  const hideShortGames = useReplayFilter((store) => store.hideShortGames);
  const setHideShortGames = useReplayFilter((store) => store.setHideShortGames);
  const setSortBy = useReplayFilter((store) => store.setSortBy);
  const sortDirection = useReplayFilter((store) => store.sortDirection);
  const setSortDirection = useReplayFilter((store) => store.setSortDirection);
  const [searchText, setSearchText] = React.useState(storeSearchText ?? "");
  const { showError } = useToasts();

  const refresh = React.useCallback(() => {
    presenter.init(rootSlpPath, extraSlpPaths, true, currentFolder).catch(showError);
  }, [presenter, rootSlpPath, extraSlpPaths, currentFolder, showError]);

  const debounceChange = debounce((text: string) => {
    setStoreSearchText(text);
  }, 100);

  const setNameFilter = (name: string) => {
    setSearchText(name);
    debounceChange(name);
  };

  // Reload when sort, hideShortGames, or searchText changes (backend filters)
  // Skip initial mount to avoid double-loading
  const isInitialMount = React.useRef(true);
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    presenter.loadFolder(currentFolder, true).catch(showError);
  }, [sortBy, sortDirection, hideShortGames, storeSearchText]);

  return (
    <Outer>
      <ButtonContainer>
        <div style={{ display: "inline-block" }}>
          <Button onClick={refresh} disabled={disabled} startIcon={<SyncIcon />}>
            {Messages.refresh()}
          </Button>
        </div>
        <Dropdown
          value={{
            key: sortBy,
            dir: sortDirection,
          }}
          options={[
            {
              value: {
                key: ReplaySortOption.DATE,
                dir: SortDirection.DESC,
              },
              label: Messages.mostRecent(),
            },
            {
              value: {
                key: ReplaySortOption.DATE,
                dir: SortDirection.ASC,
              },
              label: Messages.leastRecent(),
            },
            {
              value: {
                key: ReplaySortOption.GAME_DURATION,
                dir: SortDirection.DESC,
              },
              label: Messages.longestGame(),
            },
            {
              value: {
                key: ReplaySortOption.GAME_DURATION,
                dir: SortDirection.ASC,
              },
              label: Messages.shortestGame(),
            },
          ]}
          onChange={(val) => {
            setSortBy(val.key);
            setSortDirection(val.dir);
          }}
        />
        <Checkbox
          label={Messages.hideShortGames()}
          checked={hideShortGames}
          onChange={() => setHideShortGames(!hideShortGames)}
          css={css`
            .MuiFormControlLabel-label {
              font-size: 12px;
            }
          `}
        />
      </ButtonContainer>
      <div>
        <InputBase
          ref={ref}
          css={css`
            background-color: black;
            border-radius: 10px;
            padding: 5px 10px;
            font-size: 12px;
          `}
          endAdornment={
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setNameFilter("")} disabled={searchText.length === 0}>
                {searchText.length > 0 ? <CloseIcon fontSize="inherit" /> : <SearchIcon fontSize="inherit" />}
              </IconButton>
            </InputAdornment>
          }
          placeholder={Messages.search()}
          value={searchText}
          onChange={(e) => {
            setNameFilter(e.target.value);
          }}
        />
      </div>
    </Outer>
  );
});
