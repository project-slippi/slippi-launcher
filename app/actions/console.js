export const CONNECTION_CANCEL_EDIT = 'CONNECTION_CANCEL_EDIT';
export const CONNECTION_EDIT = 'CONNECTION_EDIT';
export const CONNECTION_SAVE = 'CONNECTION_SAVE';
export const CONNECTION_DELETE = 'CONNECTION_DELETE';
export const CONNECTION_CONNECT = 'CONNECTION_CONNECT';
export const CONNECTION_STATE_CHANGED = 'CONNECTION_STATE_CHANGED';

export function cancelEditConnection() {
  return {
    type: CONNECTION_CANCEL_EDIT,
    payload: {},
  };
}

export function editConnection(id) {
  return {
    type: CONNECTION_EDIT,
    payload: {
      id: id,
    },
  };
}

export function saveConnection(id, settings) {
  return {
    type: CONNECTION_SAVE,
    payload: {
      id: id,
      settings: settings,
    },
  };
}

export function deleteConnection(id) {
  return {
    type: CONNECTION_DELETE,
    payload: {
      id: id,
    },
  };
}

export function connectConnection(connection) {
  return () => {
    connection.connect();
  };
}

export function connectionStateChanged() {
  return {
    type: CONNECTION_STATE_CHANGED,
    payload: {},
  }
}

export function startMirroring(connection) {
  return () => {
    // TODO: Handle errors
    connection.startMirroring();
  };
}
