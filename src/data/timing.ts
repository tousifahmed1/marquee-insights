export async function timed<T>(label: string, run: () => Promise<T>): Promise<T> {
  if (!import.meta.env.DEV) return run()
  const started = performance.now()
  try {
    return await run()
  } finally {
    console.info(`[data] ${label} ${Math.round(performance.now() - started)}ms`)
  }
}
