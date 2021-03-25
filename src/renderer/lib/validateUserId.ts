import { fetch } from "cross-fetch";

const BASE_URL = process.env.SLIPPI_USER_SERVER;

export interface ValidateUserIdResponse {
  uid: string;
  displayName: string;
  connectCode: string;
  latestVersion: string;
}

export const validateUserId = async (userId: string, timeout = 2500): Promise<ValidateUserIdResponse> => {
  // Create a new AbortController instance for this request
  const controller = new AbortController();
  // Get the abortController's signal
  const signal = controller.signal;
  const promise = fetch(`${BASE_URL}/user/${userId}`, { mode: "no-cors", signal }).then((resp) => resp.json());
  // Cancel the request if React Query calls the `promise.cancel` method
  (promise as any).cancel = () => controller.abort();

  // FIXME: Currently the users rest endpoint spins forever on invalid userId.
  // Fizzi has been informed and says he'll look into it eventually, so for now
  // we'll just manually abort the request if it takes longer than the timeout
  setTimeout(() => controller.abort(), timeout);
  return promise;
};
