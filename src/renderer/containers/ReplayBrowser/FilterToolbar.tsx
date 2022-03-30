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

import { Button, Checkbox, Dropdown } from "@/components/FormInputs";
import { useReplayFilter } from "@/lib/hooks/useReplayFilter";
import { useReplays } from "@/lib/hooks/useReplays";
import { useSettings } from "@/lib/hooks/useSettings";
import { useToasts } from "@/lib/hooks/useToasts";
import { ReplaySortOption, SortDirection } from "@/lib/replayFileSort";

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

export interface FilterToolbarProps {
  disabled?: boolean;
}

export const FilterToolbar = React.forwardRef<HTMLInputElement, FilterToolbarProps>((props, ref) => {
  const { disabled } = props;
  const init = useReplays((store) => store.init);
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
    init(rootSlpPath, extraSlpPaths, true, currentFolder).catch(showError);
  }, [rootSlpPath, extraSlpPaths, init, currentFolder, showError]);

  const debounceChange = debounce((text: string) => {
    setStoreSearchText(text);
  }, 100);

  const setNameFilter = (name: string) => {
    setSearchText(name);
    debounceChange(name);
  };

  return (
    <Outer>
      <ButtonContainer>
        <div style={{ display: "inline-block" }}>
          <Button onClick={refresh} disabled={disabled} startIcon={<SyncIcon />}>
            Refresh
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
              label: "Most recent",
            },
            {
              value: {
                key: ReplaySortOption.DATE,
                dir: SortDirection.ASC,
              },
              label: "Least recent",
            },
            {
              value: {
                key: ReplaySortOption.GAME_DURATION,
                dir: SortDirection.DESC,
              },
              label: "Longest game",
            },
            {
              value: {
                key: ReplaySortOption.GAME_DURATION,
                dir: SortDirection.ASC,
              },
              label: "Shortest game",
            },
          ]}
          onChange={(val) => {
            setSortBy(val.key);
            setSortDirection(val.dir);
          }}
        />
        <Checkbox
          label="Hide short games"
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
          placeholder="Search"
          value={searchText}
          onChange={(e) => {
            setNameFilter(e.target.value);
          }}
        />
      </div>
    </Outer>
  );
});
