/* eslint-disable @typescript-eslint/no-var-requires */
// Custom Sign hook for use with electron-builder + SSL CodeSignTool

const { execSync } = require("child_process");

const ES_CREDENTIAL_ID = process.env.ES_CREDENTIAL_ID;
const ES_USERNAME = process.env.ES_USERNAME;
const ES_PASSWORD = process.env.ES_PASSWORD;
const ES_TOTP_SECRET = process.env.ES_TOTP_SECRET;
const CODESIGNTOOL_PATH = process.env.CODESIGNTOOL_PATH;

exports.default = async (config) => {
  const fileToSign = config.path ? String(config.path) : "";

  if (process.env.SKIP_CODE_SIGNING === "yes") {
    return;
  }

  if (process.platform !== "win32") {
    throw new Error(`unexpected platform: ${process.platform}`);
  }

  if ([ES_USERNAME, ES_CREDENTIAL_ID, ES_PASSWORD, ES_TOTP_SECRET, CODESIGNTOOL_PATH, fileToSign].some((v) => !v)) {
    throw new Error("missing required secrets");
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
