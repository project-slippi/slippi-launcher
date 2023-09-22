/* eslint-disable @typescript-eslint/no-var-requires */
// Custom Sign hook for use with electron-builder + SSL CodeSignTool

const { execSync } = require("child_process");

exports.default = async (config) => {
  const ES_CREDENTIAL_ID = process.env.ES_CREDENTIAL_ID;
  const ES_USERNAME = process.env.ES_USERNAME;
  const ES_PASSWORD = process.env.ES_PASSWORD;
  const ES_TOTP_SECRET = process.env.ES_TOTP_SECRET;
  const CODESIGNTOOL_PATH = process.env.CODESIGNTOOL_PATH;
  const fileToSign = config.path ? String(config.path) : "";

  if (
    process.platform !== "win32" ||
    [ES_CREDENTIAL_ID, ES_USERNAME, ES_PASSWORD, ES_TOTP_SECRET, CODESIGNTOOL_PATH, fileToSign].some((v) => !v)
  ) {
    console.log("missing something");
    return;
  }

  const output = execSync(
    `CodeSignTool.bat sign -credential_id="${ES_CREDENTIAL_ID}" -username="${ES_USERNAME}" -password="${ES_PASSWORD}" -totp_secret="${ES_TOTP_SECRET}" -input_file_path="${fileToSign}" -override="true"`,
    { cwd: CODESIGNTOOL_PATH },
  )
    .toString()
    .trim();

  if (!output.includes("Code signed successfully")) {
    throw new Error(`Failed to sign file: ${output}`);
  }
};
