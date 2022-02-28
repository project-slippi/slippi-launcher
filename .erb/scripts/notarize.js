/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");
const electronNotarize = require("electron-notarize");
const electronBuilderConfig = require("../electron-builder.json");

module.exports = async function (params) {
  if (process.platform !== "darwin") {
    return;
  }

  console.log("afterSign hook triggered", params);

  // Bail early if this is a fork-caused PR build, which doesn't get
  // secrets.
  if (!process.env.APPLE_TEAM_PROVIDER_ID || !process.env.APPLE_API_KEY || !process.env.APPLE_ISSUER_ID) {
    console.log("Bailing, no secrets found.");
    return;
  }

  const appId = electronBuilderConfig.appId;
  const appPath = path.join(params.appOutDir, `${params.packager.appInfo.productFilename}.app`);
  if (!fs.existsSync(appPath)) {
    throw new Error(`Cannot find application at: ${appPath}`);
  }

  console.log(`Notarizing ${appId} found at ${appPath} (this could take awhile, get some coffee...)`);

  try {
    await electronNotarize.notarize({
      appBundleId: appId,
      appPath: appPath,
      appleApiKey: process.env.APPLE_API_KEY,
      appleApiIssuer: process.env.APPLE_ISSUER_ID,
    });

    console.log(`Successfully notarized ${appId}`);
  } catch (error) {
    console.error(error);
  }
};
