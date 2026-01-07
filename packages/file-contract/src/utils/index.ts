export async function measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const end = performance.now();
    console.info(`[TIME] ${label}: ${((end - start) / 1000).toFixed(3)}s`);
  }
}
