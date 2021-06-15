/** @jsx jsx */
import { css, jsx } from "@emotion/react";
import styled from "@emotion/styled";
import IconButton from "@material-ui/core/IconButton";
import InputAdornment from "@material-ui/core/InputAdornment";
import InputBase from "@material-ui/core/InputBase";
import CloseIcon from "@material-ui/icons/Close";
import SearchIcon from "@material-ui/icons/Search";
import SyncIcon from "@material-ui/icons/Sync";
import { debounce } from "lodash";
import React from "react";

import { Button, Checkbox, Dropdown } from "@/components/FormInputs";
import { FilterOptions } from "@/lib/hooks/useReplayFilter";
import { useSettings } from "@/lib/hooks/useSettings";
import { useReplays } from "@/store/replays";

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
  value: FilterOptions;
  onChange: (options: Partial<FilterOptions>) => void;
}

export const FilterToolbar = React.forwardRef<HTMLInputElement, FilterToolbarProps>((props, ref) => {
  const { disabled, onChange, value } = props;
  const [searchText, setSearchText] = React.useState(value.searchText || "");
  const init = useReplays((store) => store.init);
  const rootSlpPath = useSettings((store) => store.settings.rootSlpPath);
  const currentFolder = useReplays((store) => store.currentFolder);

  React.useEffect(() => {
    if (!value.searchText) {
      setSearchText("");
    }
  }, [value.searchText]);

  const refresh = React.useCallback(() => {
    init(rootSlpPath, true, currentFolder);
  }, [rootSlpPath, init, currentFolder]);

  const debounceChange = debounce((text: string) => {
    onChange({ searchText: text });
  }, 100);

  const setNameFilter = (name: string) => {
    setSearchText(name);
    debounceChange(name);
    // onChange({ searchText: name });
  };

  const setNewest = (shouldSortByNew: boolean) => {
    onChange({ sortByNewestFirst: shouldSortByNew });
  };

  const setShortGameFilter = (shouldHide: boolean) => {
    onChange({ hideShortGames: shouldHide });
  };

  return (
    <Outer>
      <ButtonContainer>
        <Button onClick={refresh} disabled={disabled} startIcon={<SyncIcon />}>
          Refresh
        </Button>
        <Dropdown
          value={value.sortByNewestFirst ? "newest" : "oldest"}
          options={[
            { value: "newest", label: "Date added (newest)" },
            { value: "oldest", label: "Date added (oldest)" },
          ]}
          onChange={(val) => {
            if (val === "newest") {
              setNewest(true);
            } else if (val === "oldest") {
              setNewest(false);
            }
          }}
        />
        <Checkbox
          label="Hide short games"
          checked={value.hideShortGames}
          onChange={() => setShortGameFilter(!value.hideShortGames)}
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
              <IconButton size="small" onClick={() => setNameFilter("")} disabled={value.searchText.length === 0}>
                {value.searchText.length > 0 ? <CloseIcon fontSize="inherit" /> : <SearchIcon fontSize="inherit" />}
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
