export const APP_UPGRADE_DOWNLOADED = 'APP_UPGRADE_DOWNLOADED';
export const SET_ACTIVE_NOTIF = 'SET_ACTIVE_NOTIF';
export const DISMISS_GLOBAL_NOTIF = 'DISMISS_GLOBAL_NOTIF';

export function appUpgradeDownloaded(upgradeDetails) {
  return {
    type: APP_UPGRADE_DOWNLOADED,
    payload: {
      upgradeDetails: upgradeDetails,
    },
  };
}

export function setActiveNotif(notif) {
  return {
    type: SET_ACTIVE_NOTIF,
    payload: {
      notif: notif,
    },
  };
}

export function dismissNotif(key) {
  return {
    type: DISMISS_GLOBAL_NOTIF,
    payload: {
      key: key,
    },
  }
}
