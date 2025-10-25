type Awaitable<T> = () => Promise<T>;

export async function until<T>(callback: Awaitable<T>): Promise<[Error | null, T | null]> {
  try {
    return [null, await callback()];
  } catch (error) {
    return [error as Error, null];
  }
}
