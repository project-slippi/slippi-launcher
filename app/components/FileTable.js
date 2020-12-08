import _ from 'lodash';
import log from 'electron-log';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Button, Icon } from 'semantic-ui-react';
import { AutoSizer, Table, Column } from 'react-virtualized'
import { stages as stageUtils } from '@slippi/slippi-js';
import classNames from 'classnames';

import styles from './FileTable.scss';
import SpacedGroup from './common/SpacedGroup';
import PlayerChiclet from './common/PlayerChiclet';
import * as timeUtils from '../utils/time';
import Tooltip from './common/Tooltip';

const path = require('path');
const shell = require('electron').shell;

export default class FileTable extends Component {
  static propTypes = {
    files: PropTypes.array.isRequired,
    playFile: PropTypes.func.isRequired,
    setStatsGamePage: PropTypes.func.isRequired,
    deleteSelections: PropTypes.func.isRequired,
    queueFiles: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props)
    this.state = {
      selectedOrdinal: 0,
      selections: [],
      areAllSelected: false,
      shiftPressed: false,
    }
  }


  componentDidMount() {
    document.addEventListener("keydown", this.shiftKeyListener);
    document.addEventListener("keyup", this.shiftKeyListener);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.shiftKeyListener);
    document.removeEventListener("keyup", this.shiftKeyListener);
  }


  playFile = (e, file) => {
    e.stopPropagation();
    this.props.playFile(file);
  };

  viewStats = (e, i) => {
    e.stopPropagation();
    this.props.setStatsGamePage(i);
  };

  onSelect = (selectedFile, fileIndex) => {
    // shift clicking has gmail behavior
    if (this.state.shiftPressed) {
      this.handleShiftSelect(selectedFile, fileIndex);
      return;
    }

    const newSelections = [];

    let wasSeen = false;
    this.state.selections.forEach(file => {
      if (file === selectedFile) {
        wasSeen = true;
        return;
      }
      newSelections.push(file);
    });
    if (!wasSeen) {
      newSelections.push(selectedFile);
    }

    this.setState({
      selections: newSelections,
      areAllSelected: newSelections.length === this.props.files.length,
    });
  };

  handleShiftSelect = (selectedFile, fileIndex) => {
    // Shift clicking on an already selected file removes all consecutive selections on and after it
    // eslint-disable-next-line react/no-access-state-in-setstate
    let newSelections = [...this.state.selections];
    const files = this.props.files
    if (this.state.selections.indexOf(selectedFile) !== -1) {
      const startingFileIndex = files.indexOf(selectedFile);
      let numToRemove = 0;
      for (let i = startingFileIndex; i < files.length; i++) {
        if (this.state.selections.indexOf(files[i]) === -1) {
          break;
        }
        numToRemove++;
      }
      newSelections.splice(this.state.selections.indexOf(selectedFile), numToRemove);
      this.setState({
        selections: newSelections,
        areAllSelected: newSelections.length === this.props.files.length,
      });
      return;
    }

    // Shift clicking on a not selected file selects all files before it up to another already selected file
    let newFiles = [];
    for (let i = fileIndex; i >= 0; i--) {
      if (this.state.selections.indexOf(files[i]) !== -1) {
        break;
      }
      newFiles.push(files[i]);
    }
    newFiles = newFiles.reverse();
    newSelections = [...this.state.selections, ...newFiles];
    this.setState({
      selections: newSelections,
      areAllSelected: newSelections.length === this.props.files.length,
    });
  };

  shiftKeyListener = (event) => {
    if (event.key === "Shift") {
      this.setState({
        shiftPressed: Boolean(event.type === "keydown"),
      });
    }
  }

  generateSelectHeader(state) {
    const iconStyle = classNames({ [styles['select-all-icon']]: true})
    const selectAllIcon = state.areAllSelected ? (
      <Icon size="big" name="check square outline" onClick={this.selectAll} className={iconStyle} />
    ) : (
      <Icon size="big" name="square outline" onClick={this.selectAll} className={iconStyle} />
    )
    // Generate header row
    return (
      <div className={iconStyle}>{selectAllIcon}</div>
    );
  }

  generateSelectCell(file, index) {
    const selectedOrdinal = this.state.selections.indexOf(file)+1
    const useOrdinal = selectedOrdinal > 0;
    let contents;
    if (useOrdinal) {
      contents = (
        <div className={styles['pos-text']}>
          <Icon size="big" name="check square outline"  onClick={() => this.onSelect(file, index)}/>
          <div className={styles['pos-text']}>{selectedOrdinal}</div>
        </div>
      );
    } else {
      contents = (
        <Icon size="big" name="square outline" onClick={() => this.onSelect(file, index)} />
      );
    }

    const cellStyles = classNames({
      [styles['select-cell']]: true,
      [styles['selected']]: useOrdinal,
    });

    return (
      <div className={cellStyles}>
        <div className={styles['select-content-wrapper']}>
          {contents}
        </div>
      </div>
    );
  }

  generateDetailsCell(file) {
    const onFileLocationClick = () => {
      const fileLocation = path.resolve(file.fullPath);
      shell.showItemInFolder(fileLocation);
    }
    const metadata = [
      {
        label: 'Stage',
        content: this.getStageName(file),
      },
      {
        separator: true,
      },
      {
        label: 'File',
        content:
          <Tooltip
            title="Open location">
            <button type="button" className={styles['reveal-file-location']} onClick={onFileLocationClick}>{this.getFileName(file)}</button>
          </Tooltip>,
      },
    ];

    const metadataDisplay = _.map(metadata, (entry, key) => {
      if (entry.separator) {
        return (
          <div key={`separator-${key}`} className={styles['separator']}>
            |
          </div>
        );
      }

      return (
        <div key={`metadata-${entry.label}`}>
          <span className={styles['label']}>{entry.label}</span>
          <span className={styles['value']}>{entry.content}</span>
        </div>
      );
    });

    return (
      <div>
        <SpacedGroup direction="vertical" size="xs">
          <SpacedGroup>{this.generateTeamElements(file)}</SpacedGroup>
          <SpacedGroup className={styles['metadata-display']} size="md">
            {metadataDisplay}
          </SpacedGroup>
        </SpacedGroup>
      </div>
    );
  }

  getFileName(file) {
    const fileName = file.fileName || '';
    const extension = path.extname(fileName);
    const nameWithoutExt = path.basename(fileName, extension);

    return nameWithoutExt;
  }

  getStageName(file) {
    if (file.isError) {
      return null;
    }

    const settings = file.game.getSettings() || {};
    const stageId = settings.stageId;
    try {
      const stageName = stageUtils.getStageName(stageId);
      return stageName;
    } catch (err) {
      log.error(err);
      return "Unknown";
    }
  }

  generateTeamElements(file) {
    if (file.isError) {
      return <div />;
    }

    const game = file.game || {};
    const settings = game.getSettings() || {};

    // If this is a teams game, group by teamId, otherwise group players individually
    const teams = _.chain(settings.players)
      .groupBy(player => (settings.isTeams ? player.teamId : player.port))
      .toArray()
      .value();

    // This is an ugly way to do this but the idea is to create spaced groups of
    // character icons when those characters are on a team and each team should
    // have an element indicating they are playing against each other in between
    const elements = [];
    teams.forEach((team, idx) => {
      // Add player chiclets for all the players on the team
      team.forEach(player => {
        elements.push(
          <PlayerChiclet
            key={`player-${player.playerIndex}`}
            game={game}
            playerIndex={player.playerIndex}
            showContainer={true}
          />
        );
      });

      // Add VS obj in between teams
      if (idx < teams.length - 1) {
        // If this is not the last team, add a "vs" element
        elements.push(
          <div className={styles['vs-element']} key={`vs-${idx}`}>
            {' '}
            vs{' '}
          </div>
        );
      }
    });

    return elements;
  }

  generateStartTimeCell(file) {
    if (file.isError) {
      return <div singleLine={true}>Error</div>;
    }

    const startAtDisplay = timeUtils.monthDayHourFormat(file.startTime) || "Unknown";

    return <div>{startAtDisplay}</div>;
  }

  generateOptionsCell(file, index) {
    return (
      <div className={styles['actions-cell']}>
        <SpacedGroup direction="horizontal">
          <Button
            circular={true}
            inverted={true}
            size="tiny"
            color="green"
            icon={<Icon name="play" color="green"/>}
            onClick={e => this.playFile(e, file)}
          />
          <Link to="/game" className={styles['bound-link']} replace={false}>
            <Button
              circular={true}
              inverted={true}
              size="tiny"
              color="green"
              icon={<Icon name="bar chart" color="green"/>}
              onClick={e => this.viewStats(e, index)}
            />
          </Link>
        </SpacedGroup>

      </div>
    );
  }

  deleteSelections = () => {
    this.props.deleteSelections(this.state.selections);
    this.setState({
      selections: [],
    });
    this.renderMain();
  }

  queueClear = () => {
    this.setState({
      selections: [],
      areAllSelected: false,
    });
  };

  queueFiles = () => {
    this.props.queueFiles(this.state.selections);
    this.setState({
      selections: [],
    });
  };

  selectAll = () => {
    this.setState((prevState) => ({
      selections: prevState.areAllSelected ? [] : (this.props.files) || [],
      areAllSelected: !prevState.areAllSelected,
    }));
  }


  renderQueueButtons() {
    if (this.state.selections.length === 0) {
      return null;
    }
    return (
      <div className={styles['queue-buttons']} key="buttons">
        <Button onClick={this.queueFiles}>
          <Icon name="play circle" />
          Play all
        </Button>
        <Button onClick={this.queueClear}>
          <Icon name="dont" />
          Clear
        </Button>
        <Button onClick={this.deleteSelections}>
          <Icon name="trash alternate outline" />
            Delete
        </Button>
      </div>
    );
  }


  render() {
    return [
      <AutoSizer key="autosizer">
        {
          ({width, height}) => <Table
            className={styles['file-table']}
            style={{overflow: 'visible'}}
            width={width}
            height={height}
            headerHeight={70}
            rowHeight={70}
            rowCount={this.props.files.length}
            rowGetter={({index}) => this.props.files[index]}>
            <Column 
              label="Select" 
              dataKey="" 
              width={70}
              headerRenderer={() => this.generateSelectHeader(this.state)}
              cellRenderer={props => this.generateSelectCell(props.rowData, props.rowIndex)}
            />
            <Column 
              label="Details" 
              dataKey="" 
              flexGrow={1}
              width={100}
              cellRenderer={props => this.generateDetailsCell(props.rowData)}
            />
            <Column 
              dataKey="" 
              width={200}
              label="Time" 
              cellRenderer={props => this.generateStartTimeCell(props.rowData)}
            />
            <Column 
              label="Options" 
              dataKey="" 
              width={200}
              cellRenderer={props => this.generateOptionsCell(props.rowData, props.rowIndex)}
            />
          </Table>
        }
      </AutoSizer>,
      this.renderQueueButtons(),
    ];
  }
}
