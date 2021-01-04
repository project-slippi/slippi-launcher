import { debounce } from "lodash";
import React from "react";
import RefreshIcon from "@material-ui/icons/Refresh";
import SortIcon from "@material-ui/icons/Sort";
import SearchIcon from "@material-ui/icons/Search";
import CloseIcon from "@material-ui/icons/Close";
import TimerIcon from "@material-ui/icons/Timer";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import InputBase from "@material-ui/core/InputBase";
import InputAdornment from "@material-ui/core/InputAdornment";
import { useReplays } from "@/store/replays";
import { useSettings } from "@/store/settings";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import styled from "styled-components";
import { FilterOptions } from "@/lib/hooks/useReplayFilter";

const useStyles = makeStyles(() =>
  createStyles({
    input: {
      border: "solid 1px rgba(255, 255, 255, 0.6)",
      borderRadius: 5,
      paddingLeft: 10,
    },
    root: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 5,
    },
  })
);

const ButtonContainer = styled.div`
  button + button {
    margin-left: 5px;
  }
`;

export interface FilterToolbarProps {
  value: FilterOptions;
  onChange: (options: Partial<FilterOptions>) => void;
}

export const FilterToolbar = React.forwardRef<
  HTMLInputElement,
  FilterToolbarProps
>((props, ref) => {
  const { onChange, value } = props;
  const [searchText, setSearchText] = React.useState(value.searchText || "");
  const classes = useStyles();
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
    <div className={classes.root}>
      <ButtonContainer>
        <Button
          variant="contained"
          size="small"
          startIcon={<RefreshIcon />}
          style={{ textTransform: "initial" }}
          onClick={refresh}
        >
          Refresh
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<SortIcon />}
          style={{ textTransform: "initial" }}
          onClick={() => setNewest(!value.sortByNewestFirst)}
        >
          {value.sortByNewestFirst ? "Newest first" : "Oldest first"}
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<TimerIcon />}
          style={{ textTransform: "initial" }}
          onClick={() => setShortGameFilter(!value.hideShortGames)}
        >
          {value.hideShortGames ? "Short games hidden" : "Short games shown"}
        </Button>
      </ButtonContainer>
      <div>
        <InputBase
          ref={ref}
          className={classes.input}
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => setNameFilter("")}
                disabled={value.searchText.length === 0}
              >
                {value.searchText.length > 0 ? <CloseIcon /> : <SearchIcon />}
              </IconButton>
            </InputAdornment>
          }
          placeholder="Search..."
          value={searchText}
          onChange={(e) => {
            setNameFilter(e.target.value);
          }}
        />
      </div>
    </div>
  );
});
