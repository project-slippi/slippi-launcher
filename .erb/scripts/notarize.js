/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");
const electronNotarize = require("@electron/notarize");
const electronBuilderConfig = require("../../electron-builder.json");

module.exports = async function (params) {
  if (process.platform !== "darwin" || !process.env.SLIPPI_ENABLE_SIGNING) {
    return;
  }

  console.log("afterSign hook triggered", params);

  // Bail early if this is a fork-caused PR build, which doesn't get
  // secrets.
  if (!process.env.APPLE_API_KEY_ID || !process.env.APPLE_API_KEY || !process.env.APPLE_ISSUER_ID) {
    console.log("Bailing, no secrets found.");
    return;
  }

  const appId = electronBuilderConfig.appId;
  const appPath = path.join(params.appOutDir, `${params.packager.appInfo.productFilename}.app`);
  if (!fs.existsSync(appPath)) {
    throw new Error(`Cannot find application at: ${appPath}`);
  }

  console.log(`Notarizing ${appId} found at ${appPath} (this could take awhile, get some coffee...)`);

  const keyPath = path.join(process.env.HOME, `private_keys/AuthKey_${process.env.APPLE_API_KEY_ID}.p8`);

  try {
    await electronNotarize.notarize({
      tool: "notarytool",
      appBundleId: appId,
      appPath: appPath,
      appleApiKeyId: process.env.APPLE_API_KEY_ID,
      appleApiKey: keyPath,
      appleApiIssuer: process.env.APPLE_ISSUER_ID,
    });

    console.log(`Successfully notarized ${appId}`);
  } catch (error) {
    console.error(error);
  }
};
