import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Link } from 'react-router-dom';
import {
  Table,
  Icon,
  Header,
  Button,
  Segment,
  Message,
  Loader,
} from 'semantic-ui-react';
import styles from './FileLoader.scss';
import FileRow from './FileRow';
import DismissibleMessage from './common/DismissibleMessage';
import PageHeader from './common/PageHeader';
import FolderBrowser from './common/FolderBrowser';
import PageWrapper from './PageWrapper';
import Scroller from './common/Scroller';

export default class FileLoader extends Component {
  static propTypes = {
    // fileLoader actions
    loadRootFolder: PropTypes.func.isRequired,
    changeFolderSelection: PropTypes.func.isRequired,
    playFile: PropTypes.func.isRequired,
    queueFiles: PropTypes.func.isRequired,
    storeScrollPosition: PropTypes.func.isRequired,

    // game actions
    gameProfileLoad: PropTypes.func.isRequired,

    // error actions
    dismissError: PropTypes.func.isRequired,

    // store data
    history: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired,
    errors: PropTypes.object.isRequired,
    topNotifOffset: PropTypes.number.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      files: [],
      selections: [],
    };
  }

  static getDerivedStateFromProps(newProps, oldState) {
    if (newProps.store.files !== oldState.files) {
      return {
        files: newProps.store.files,
        selections: [],
      };
    }
    return oldState;
  }

  componentDidMount() {
    const xPos = _.get(this.props.store, ['scrollPosition', 'x']) || 0;
    const yPos = _.get(this.props.store, ['scrollPosition', 'y']) || 0;
    window.scrollTo(xPos, yPos);

    if (this.props.history.action === "PUSH") {
      // I don't really like this but when returning back to the file loader, the action is "POP"
      // instead of "PUSH", and we don't want to trigger the loader and ruin our ability to restore
      // scroll position when returning to fileLoader from a game
      this.props.loadRootFolder();
    }
  }

  componentWillUnmount() {
    this.props.storeScrollPosition({
      x: window.scrollX,
      y: window.scrollY,
    });

    // TODO: I added this because switching to the stats view was maintaining the scroll
    // TODO: position of this component
    // TODO: Might be better to do something as shown here:
    // TODO: https://github.com/ReactTraining/react-router/issues/2144#issuecomment-150939358
    window.scrollTo(0, 0);

    this.props.dismissError('fileLoader-global');
  }

  onSelect = (key) => {
    const newSelections = [];

    let wasSeen = false;
    this.state.selections.forEach(selection => {
      if (selection === key) {
        wasSeen = true;
        return;
      }
      newSelections.push(selection);
    });
    if (!wasSeen) {
      newSelections.push(key);
    }

    this.setState({
      selections: newSelections,
    });
  }

  renderSidebar() {
    const store = this.props.store || {};

    // Have to offset both the height and sticky position of the sidebar when a global notif is
    // active. Wish I knew a better way to do this.
    const customStyling = {
      height: `calc(100vh - ${this.props.topNotifOffset}px)`,
    };

    // We return a div that will serve as a placeholder for our column as well as a fixed
    // div for actually displaying the sidebar
    // TODO: I'm not really sure why I had to subtract 85 from top offset in this case and
    // TODO: the other places didn't have to. But without that there was 85 pixels of blank space
    // TODO: at the bottom
    return [
      <div key="column-placeholder" />,
      <div key="sidebar" style={customStyling} className={styles['sidebar']}>
        <Scroller topOffset={this.props.topNotifOffset - 85}>
          <FolderBrowser
            folders={store.folders}
            rootFolderName={store.rootFolderName}
            selectedFolderFullPath={store.selectedFolderFullPath}
            changeFolderSelection={this.props.changeFolderSelection}
          />
        </Scroller>
      </div>,
    ];
  }

  processFiles(files) {
    let resultFiles = files;

    resultFiles = resultFiles.filter(file => {
      if (file.hasError) {
        // This will occur if an error was encountered while parsing
        return false;
      }

      const settings = file.game.getSettings() || {};
      if (!settings.stageId) {
        // I know that right now if you play games from debug mode it make some
        // weird replay files... this should filter those out
        return false;
      }

      const metadata = file.game.getMetadata() || {};
      const totalFrames = metadata.lastFrame || 30 * 60 + 1;
      return totalFrames > 30 * 60;
    });

    resultFiles = _.orderBy(
      resultFiles,
      [
        file => {
          const metadata = file.game.getMetadata() || {};
          const startAt = metadata.startAt;
          return moment(startAt);
        },
        'fileName',
      ],
      ['desc', 'desc']
    );

    // Filter out files that were shorter than 30 seconds
    return resultFiles;
  }

  queueClear = () => {
    this.setState({
      selections: [],
    });
  }

  queueFiles = () => {
    this.props.queueFiles(this.state.selections);
    this.setState({
      selections: [],
    });
  }

  renderGlobalError() {
    const errors = this.props.errors || {};
    const errorKey = 'fileLoader-global';

    const showGlobalError = errors.displayFlags[errorKey] || false;
    const globalErrorMessage = errors.messages[errorKey] || '';
    return (
      <DismissibleMessage
        error={true}
        visible={showGlobalError}
        icon="warning circle"
        header="An error has occurred"
        content={globalErrorMessage}
        onDismiss={this.props.dismissError}
        dismissParams={[errorKey]}
      />
    );
  }

  renderFilteredFilesNotif(processedFiles) {
    const store = this.props.store || {};
    if (store.isLoading) {
      return null;
    }

    const files = store.files || [];
    const filteredFileCount = files.length - processedFiles.length;

    if (!filteredFileCount) {
      return null;
    }

    let contentText =
      'Replays shorter than 30 seconds are automatically filtered.';

    const filesWithErrors = files.filter(file => file.hasError);
    const errorFileCount = filesWithErrors.length;
    if (errorFileCount) {
      contentText = `${errorFileCount} corrupt files detected. Non-corrupt replays shorter than 30 seconds are automatically filtered.`;
    }

    return (
      <Message
        info={true}
        icon="info circle"
        header={`${filteredFileCount} Files have been filtered`}
        content={contentText}
      />
    );
  }

  renderEmptyLoader() {
    const folders = this.props.store.folders || {};
    const rootFolderName = this.props.store.rootFolderName || '';

    if (!folders[rootFolderName]) {
      return this.renderMissingRootFolder();
    }

    return (
      <div className={styles['empty-loader-content']}>
        <Header
          as="h2"
          icon={true}
          color="grey"
          inverted={true}
          textAlign="center"
        >
          <Icon name="search" />
          <Header.Content>
            No Replay Files Found
            <Header.Subheader>
              Place slp files in the folder to browse
            </Header.Subheader>
          </Header.Content>
        </Header>
      </div>
    );
  }

  renderMissingRootFolder() {
    return (
      <div className={styles['empty-loader-content']}>
        <Header
          as="h2"
          icon={true}
          color="grey"
          inverted={true}
          textAlign="center"
        >
          <Icon name="folder outline" />
          <Header.Content>
            Root Folder Missing
            <Header.Subheader>
              Go to the settings page to select a root slp folder
            </Header.Subheader>
          </Header.Content>
        </Header>
        <Segment basic={true} textAlign="center">
          <Link to="/settings">
            <Button color="blue" size="large">
              Select Folder
            </Button>
          </Link>
        </Segment>
      </div>
    );
  }

  renderLoadingState() {
    const store = this.props.store || {};
    return (
      <Loader
        className={styles['loader']}
        inverted={true}
        active={store.isLoading}
        indeterminate={true}
        inline="centered"
        size="big"
      >
        <span>Loading Files...</span>
      </Loader>
    );
  }

  renderFileSelection(files) {
    const store = this.props.store || {};
    if (store.isLoading) {
      return this.renderLoadingState();
    }

    // If we have no files to display, render an empty state
    if (!files.length) {
      return this.renderEmptyLoader();
    }

    // Generate header row
    const headerRow = (
      <Table.Row>
        <Table.HeaderCell />
        <Table.HeaderCell>Details</Table.HeaderCell>
        <Table.HeaderCell>Time</Table.HeaderCell>
        <Table.HeaderCell />
      </Table.Row>
    );

    // Generate a row for every file in selected folder
    const rows = files.map(
      file => (
        <FileRow
          key={file.fullPath}
          file={file}
          playFile={this.props.playFile}
          gameProfileLoad={this.props.gameProfileLoad}
          onSelect={this.onSelect}
          selectedOrdinal={this.state.selections.indexOf(file.fullPath) + 1}
        />
      ),
      this
    );

    return (
      <Table
        className={styles['file-table']}
        basic="very"
        celled={true}
        inverted={true}
        selectable={true}
      >
        <Table.Header>{headerRow}</Table.Header>
        <Table.Body>{rows}</Table.Body>
      </Table>
    );
  }

  renderQueueButtons() {
    if (this.state.selections.length === 0) {
      return;
    }
    return (
      <div className={styles['queue-buttons']}>
        <Button onClick={this.queueFiles}>
          <Icon name="play circle" />
          Play all
        </Button>
        <Button onClick={this.queueClear}>
          <Icon name="dont" />
          Clear
        </Button>
      </div>
    );
  }

  renderMain() {
    const store = this.props.store || {};
    const files = store.files || [];
    const processedFiles = this.processFiles(files);
    const mainStyles = `main-padding ${styles['loader-main']}`;

    return (
      <div className={mainStyles}>
        <PageHeader
          icon="disk"
          text="Replay Browser"
          history={this.props.history}
        />
        <Scroller topOffset={this.props.topNotifOffset}>
          {this.renderGlobalError()}
          {this.renderFilteredFilesNotif(processedFiles)}
          {this.renderFileSelection(processedFiles)}
        </Scroller>
        {this.renderQueueButtons()}
      </div>
    );
  }

  render() {
    return (
      <PageWrapper history={this.props.history}>
        <div className={styles['layout']}>
          {this.renderSidebar()}
          {this.renderMain()}
        </div>
      </PageWrapper>
    );
  }
}
