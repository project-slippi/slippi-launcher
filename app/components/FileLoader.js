import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  Icon,
  Header,
  Button,
  Segment,
  Message,
  Loader,
} from 'semantic-ui-react';
import styles from './FileLoader.scss';
import DismissibleMessage from './common/DismissibleMessage';
import PageHeader from './common/PageHeader';
import FolderBrowser from './common/FolderBrowser';
import PageWrapper from './PageWrapper';
import Scroller from './common/Scroller';
import { MIN_GAME_LENGTH_SECONDS } from '../actions/fileLoader';
import FileTable from './FileTable';
import 'react-virtualized/styles.css';

export default class FileLoader extends Component {
  static propTypes = {
    // fileLoader actions
    loadRootFolder: PropTypes.func.isRequired,
    changeFolderSelection: PropTypes.func.isRequired,
    playFile: PropTypes.func.isRequired,
    queueFiles: PropTypes.func.isRequired,
    storeFileLoadState: PropTypes.func.isRequired,
    setStatsGamePage: PropTypes.func.isRequired,
    deleteSelections: PropTypes.func.isRequired,
    setFilterReplays: PropTypes.func.isRequired,
    
    // error actions
    dismissError: PropTypes.func.isRequired,

    // store data
    history: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired,
    errors: PropTypes.object.isRequired,
    topNotifOffset: PropTypes.number.isRequired,
  };

  componentDidMount() {
    if (this.props.history.action === "PUSH") {
      // The action when returning from the stats page is "POP". The action when coming from the
      // main menu is "PUSH". When coming from the main menu, we want to reload the files such that
      // any new files show up correctly
      this.props.setFilterReplays(true);
      this.props.loadRootFolder();
    } else if (this.props.history.action === "POP") {
      //
    }
  }

  componentWillUnmount() {
    this.props.dismissError('fileLoader-global');

    // Stop listening for the shift key
    document.removeEventListener("keydown", this.shiftKeyListener);
    document.removeEventListener("keyup", this.shiftKeyListener);
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

  renderFilteredFilesNotif() {
    const store = this.props.store || {};
    if (store.isLoading) {
      return null;
    }

    // These are the number of files that were initially removed probably because they're corrupted
    const errorFileCount = _.get(store, 'numErroredFiles');
    const durationFilterCount = _.get(store, 'numDurationFilteredFiles');
    const totalFilteredCount = _.get(store, 'numFilteredFiles');
    if (totalFilteredCount === 0) {
      return null;
    }

    let contentText =
      `Replays shorter than ${MIN_GAME_LENGTH_SECONDS} seconds are automatically filtered.`;

    if (errorFileCount > 0) {
      if (durationFilterCount > 0) {
        // There are corrupted files and filtered files
        contentText = `${errorFileCount} corrupt files detected. Non-corrupt replays shorter than ${MIN_GAME_LENGTH_SECONDS} seconds are automatically filtered.`;
      } else {
        contentText = `${errorFileCount} corrupt files detected.`;
      }
    }
    const showHideButton = durationFilterCount > 0 && store.filterReplays;

    const onShowAnywayClick = () => {
      // Clear the currently loaded files
      this.props.storeFileLoadState({
        filesToRender: [],
        filesOffset: 0,
      });
      // Clear the selection and disable replay filter
      this.props.setFilterReplays(false);
      // this.setState({
      //   selections: [],
      //   areAllSelected: false,
      // });
    }

    return (
      <Message
        info={true}
        icon="info circle"
        header={`${totalFilteredCount} Files have been filtered`}
        content={<>
          <span>{contentText}</span> {showHideButton && <button type="button" className={styles['show-anyway']} onClick={onShowAnywayClick}>Click to show all</button>}
        </>}
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

  renderFileSelection() {
    const store = this.props.store || {};

    const allFiles = (store.filterReplays ? store.files : store.allFiles) || [];

    if (store.isLoading) {
      return this.renderLoadingState();
    }

    // If we have no files to display, render an empty state
    if (!allFiles.length) {
      return this.renderEmptyLoader();
    }

    const isFiltering = _.get(this.props.store, 'numFilteredFiles') > 0;
    const offset = this.props.topNotifOffset + isFiltering ? 70 : 0

    return (
      <div style={{
        width: `calc(100% + 17px)`,
        height: `calc(100vh - ${offset + 85}px)`,
      }}>
        <FileTable 
          files={allFiles}
          setStatsGamePage={this.props.setStatsGamePage}
          onSelectFunc={this.onSelect}
          playFile={this.props.playFile}
          queueFiles={this.props.queueFiles}
          deleteSelections={this.props.deleteSelections}
        />
      </div>
    )
  }

  renderMain() {
    const mainStyles = `main-padding ${styles['loader-main']}`;
    return (
      <div className={mainStyles}>
        <PageHeader
          icon="disk"
          text="Replay Browser"
          history={this.props.history}
        />
        {this.renderGlobalError()}
        {this.renderFilteredFilesNotif()}
        {this.renderFileSelection()}
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
