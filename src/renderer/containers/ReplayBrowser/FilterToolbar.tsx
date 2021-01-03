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
import { FilterOptions } from "@/store/replayFilter";

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

export const FilterToolbar: React.FC<FilterToolbarProps> = (props) => {
  const [tag, setTag] = React.useState<string>(props.value.searchText);
  const [sortNewest, setSortNewest] = React.useState<boolean>(
    props.value.sortByNewestFirst
  );
  const [hideShortGames, setHideShortGames] = React.useState<boolean>(
    props.value.hideShortGames
  );

  const classes = useStyles();
  const init = useReplays((store) => store.init);
  const rootSlpPath = useSettings((store) => store.settings.rootSlpPath);
  const currentFolder = useReplays((store) => store.currentFolder);

  const refresh = React.useCallback(() => {
    init(rootSlpPath, true, currentFolder);
  }, [rootSlpPath, init, currentFolder]);

  const setNameFilter = (name: string) => {
    setTag(name);
    props.onChange({ searchText: name });
  };

  const setNewest = (shouldSortByNew: boolean) => {
    setSortNewest(shouldSortByNew);
    props.onChange({ sortByNewestFirst: shouldSortByNew });
  };

  const setShortGameFilter = (shouldHide: boolean) => {
    setHideShortGames(shouldHide);
    props.onChange({ hideShortGames: shouldHide });
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
          onClick={() => setNewest(!sortNewest)}
        >
          {sortNewest ? "Newest first" : "Oldest first"}
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<TimerIcon />}
          style={{ textTransform: "initial" }}
          onClick={() => setShortGameFilter(!hideShortGames)}
        >
          {hideShortGames ? "Short games hidden" : "Short games shown"}
        </Button>
      </ButtonContainer>
      <div>
        <InputBase
          className={classes.input}
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => setNameFilter("")}
                disabled={tag.length === 0}
              >
                {tag.length > 0 ? <CloseIcon /> : <SearchIcon />}
              </IconButton>
            </InputAdornment>
          }
          placeholder="Search..."
          value={tag}
          onChange={(e) => {
            setNameFilter(e.target.value);
          }}
        />
      </div>
    </div>
  );
};
