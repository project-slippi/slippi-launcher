import _ from 'lodash';
import OBSWebSocket from 'obs-websocket-js';

export default class OBSManager {
  constructor(settings) {
    this.obs = new OBSWebSocket();
    this.obsSourceName = settings.obsSourceName;
    this.obsIP = settings.obsIP;
    this.obsPassword = settings.obsPassword;
    this.statusOutput = {
      status: false,
      timeout: null,
    };
  }

  disconnect() {
    this.obs.disconnect();
  }
  
  updateSettings(settings) {
    this.obsIP = settings.obsIP;
    this.obsSourceName = settings.obsSourceName;
    this.obsPassword = settings.obsPassword;
  }

  getSceneSources = async () => {
    // eslint-disable-line
    const res = await this.obs.send('GetSceneList');
    const scenes = res.scenes || [];
    const pairs = _.flatMap(scenes, scene => {
      const sources = scene.sources || [];
      return _.map(sources, source => ({
        scene: scene.name,
        source: source.name,
      }));
    });
    this.obsPairs = _.filter(pairs, pair => pair.source === this.obsSourceName);
  };

  async connect() {
    if (this.obsIP && this.obsSourceName) {
      // if you send a password when authentication is disabled, OBS will still connect
      await this.obs.connect({
        address: this.obsIP,
        password: this.obsPassword,
      });
      await this.obs.on(
        'SceneItemAdded',
        async () => this.getSceneSources()
      ); // eslint-disable-line
      await this.obs.on(
        'SceneItemRemoved',
        async () => this.getSceneSources()
      ); // eslint-disable-line
      await this.getSceneSources();
    }
  }

  updateSourceVisibility(show) {
    _.forEach(this.obsPairs, pair => {
      this.obs.send('SetSceneItemProperties', {
        'scene-name': pair.scene,
        item: this.obsSourceName,
        visible: show,
      });
    });
  }

  setStatus(value) {
    this.statusOutput.status = value;
    this.updateSourceVisibility(value);
  }

  /*
  As long as we are receiving data from the console, show the source feed in OBS.
  */
  handleStatusOutput(timeoutLength = 200) {
    const setTimer = () => {
      if (this.statusOutput.timeout) {
        // If we have a timeout, clear it
        clearTimeout(this.statusOutput.timeout);
      }

      this.statusOutput.timeout = setTimeout(() => {
        // If we timeout, set and set status
        this.setStatus(false);
      }, timeoutLength);
    };

    if (this.statusOutput.status) {
      // If game is currently active, reset the timer
      setTimer();
      return;
    }

    // Here we did not have a game going, so let's indicate we do now
    this.setStatus(true);

    // Set timer
    setTimer();
  }
}