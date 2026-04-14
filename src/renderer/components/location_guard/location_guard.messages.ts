export const LocationGuardMessages = {
  title: () => "Allow Approximate Location Access",
  description: () => "We need access to your approximate location to show you nearby tournaments.",
  privacyDisclosure: () =>
    "Your location data will be sent to a third-party service. Slippi does NOT collect this data. You can turn this feature off again in the settings.",
  allow: () => "Allow",
  error: (errorMessage: string) => "Failed to fetch location information. Error: {0}",
};
