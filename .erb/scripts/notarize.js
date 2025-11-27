/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const electronNotarize = require("@electron/notarize");
const electronBuilderConfig = require("../../electron-builder.json");

// Helper to add delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to staple with retries
async function stapleWithRetries(appPath, maxRetries = 5, retryDelay = 30000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Stapling attempt ${attempt}/${maxRetries}...`);
      execSync(`xcrun stapler staple "${appPath}"`, { stdio: "inherit" });
      console.log("Successfully stapled!");
      return true;
    } catch (error) {
      console.warn(`Stapling attempt ${attempt} failed:`, error.message);
      if (attempt < maxRetries) {
        console.log(`Waiting ${retryDelay / 1000}s before retry...`);
        await delay(retryDelay);
      }
    }
  }
  console.warn("Stapling failed after all retries - app is notarized but ticket not stapled");
  return false;
}

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
    // Notarize but don't staple automatically
    await electronNotarize.notarize({
      tool: "notarytool",
      appBundleId: appId,
      appPath: appPath,
      appleApiKeyId: process.env.APPLE_API_KEY_ID,
      appleApiKey: keyPath,
      appleApiIssuer: process.env.APPLE_ISSUER_ID,
    });

    console.log(`Successfully notarized ${appId}`);

    // Wait a bit for the ticket to propagate in Apple's systems
    console.log("Waiting 30s for notarization ticket to propagate...");
    await delay(30000);

    // Try to staple with retries
    await stapleWithRetries(appPath);
  } catch (error) {
    console.error("Notarization error:", error);
    // Stapling failures (code 65) are non-fatal - app is still notarized
    if (error.message && error.message.includes("code: 65")) {
      console.warn("Stapling failed - app is notarized but ticket not stapled");
      console.warn("This is usually safe and the ticket will be fetched online");
      return;
    }
    throw error; // Re-throw actual notarization errors
  }
};
