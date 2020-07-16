import sudo from 'sudo-prompt';

export default function sudoExecAsync(command, options) {
  return new Promise((resolve, reject) => {
    sudo.exec(
      command, 
      options,
      (error, stdout, stderr) => {
        if (
          error === undefined &&
          stdout !== undefined &&
          stderr !== undefined
        ) {
          resolve();
        } else {
          reject(new Error("Could not run elevated command"));
        }
      })
  })
}
