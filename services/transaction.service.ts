type RetryableResult<T> = {
  data: T | null;
  error: { code?: string; message: string } | null;
};

const retryablePostgresCodes = new Set(["40001", "40P01", "55P03"]);

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withTransactionRetry<T>(operation: () => PromiseLike<RetryableResult<T>>, attempts = 3) {
  let lastResult: RetryableResult<T> | null = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const result = await operation();
    lastResult = result;

    if (!result.error || !retryablePostgresCodes.has(result.error.code || "")) {
      return result;
    }

    await wait(120 * attempt);
  }

  return lastResult as RetryableResult<T>;
}
