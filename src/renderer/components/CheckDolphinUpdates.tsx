import { checkDolphinUpdates } from "@/lib/downloadDolphin";
import { useAsync } from "@/lib/hooks/useAsync";
import React from "react";

export const CheckDolphinUpdates: React.FC = () => {
  const asyncResult = useAsync(checkDolphinUpdates);
  return (
    <div>
      <div>
        <button onClick={asyncResult.execute} disabled={asyncResult.loading}>
          download dolphin
        </button>
      </div>
      {asyncResult.loading && <div>Loading</div>}
      {asyncResult.error && <div>Error: {asyncResult.error.message}</div>}
      {asyncResult.result && (
        <div>
          <div>Success!</div>
          <pre>{JSON.stringify(asyncResult.result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
