export const APP_UPGRADE_DOWNLOADED = 'APP_UPGRADE_DOWNLOADED';
export const SET_ACTIVE_NOTIF = 'SET_ACTIVE_NOTIF';

export function appUpgradeDownloaded() {
  return {
    type: APP_UPGRADE_DOWNLOADED,
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
