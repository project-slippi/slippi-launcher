import React from "react";

export const useAsync = <T>(asyncFunction: (...args: any[]) => Promise<T>) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<any>(null);
  const [result, setResult] = React.useState<T | null>(null);
  const runAsync = async (...args: any[]) => {
    try {
      setLoading(true);
      setError(null);
      const res = await asyncFunction(...args);
      setResult(res);
    } catch (error) {
      console.error(error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };
  return {
    execute: runAsync,
    loading,
    error,
    result,
  };
};
