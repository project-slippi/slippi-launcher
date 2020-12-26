import produce from "immer";
import React from "react";
import RefreshIcon from "@material-ui/icons/Refresh";
import SortIcon from "@material-ui/icons/Sort";
import SearchIcon from "@material-ui/icons/Search";
import TimerIcon from "@material-ui/icons/Timer";
import Button from "@material-ui/core/Button";
import InputBase from "@material-ui/core/InputBase";
import InputAdornment from "@material-ui/core/InputAdornment";
import { useReplays } from "@/store/replays";
import { useSettings } from "@/store/settings";
import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";

export interface FilterOptions {
  tag: string;
  newestFirst: boolean;
  hideShortGames: boolean;
}

export interface FilterToolbarProps {
  value: FilterOptions;
  onChange: (options: FilterOptions) => void;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    input: {
      border: "solid 1px white",
      borderRadius: "5px",
    },
    root: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
  })
);

export const FilterToolbar: React.FC<FilterToolbarProps> = (props) => {
  const [tag, setTag] = React.useState<string>(props.value.tag);
  const [sortNewest, setSortNewest] = React.useState<boolean>(
    props.value.newestFirst
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
    props.onChange(
      produce(props.value, (draft) => {
        draft.tag = name;
      })
    );
  };

  const setNewest = (shouldSortByNew: boolean) => {
    setSortNewest(shouldSortByNew);
    props.onChange(
      produce(props.value, (draft) => {
        draft.newestFirst = shouldSortByNew;
      })
    );
  };

  const setShortGameFilter = (shouldHide: boolean) => {
    setHideShortGames(shouldHide);
    props.onChange(
      produce(props.value, (draft) => {
        draft.hideShortGames = shouldHide;
      })
    );
  };

  return (
    <div className={classes.root}>
      <div>
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
      </div>
      <div>
        <InputBase
          className={classes.input}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon />
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
