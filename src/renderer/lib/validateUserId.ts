import { delay } from "common/utils";

export interface ValidateUserIdResponse {
  uid: string;
  displayName: string;
  connectCode: string;
  latestVersion: string;
}

export const validateUserId = async (userId: string): Promise<ValidateUserIdResponse> => {
  console.log("got validation request: ", JSON.stringify(new Date()));
  await delay(2000);
  console.log("finished fake delay: ", JSON.stringify(new Date()));
  if (userId.includes("hello")) {
    console.log("returning data: ", JSON.stringify(new Date()));
    return {
      uid: userId,
      displayName: "hello",
      connectCode: "WORLD#0",
      latestVersion: "1.2.3",
    };
  }
  console.log("throwing error: ", JSON.stringify(new Date()));
  throw new Error("Invalid user id");

  /*
  // Create a new AbortController instance for this request
  const controller = new AbortController();
  // Get the abortController's signal
  const signal = controller.signal;
  const promise = fetch(`${BASE_URL}/user/${userId}`, { mode: "no-cors", signal }).then((resp) => resp.json());
  // Cancel the request if React Query calls the `promise.cancel` method
  (promise as any).cancel = () => controller.abort();

  // Manually abort the request if it takes too long
  setTimeout(() => controller.abort(), timeout);
  return promise;
  */
};
