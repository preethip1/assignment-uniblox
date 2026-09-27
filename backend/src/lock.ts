// Minimal async mutex: queued callers run one at a time, in order.
export class Mutex {
  private tail: Promise<unknown> = Promise.resolve();

  runExclusive<T>(fn: () => T | Promise<T>): Promise<T> {
    const result = this.tail.then(() => fn());
    this.tail = result.catch(() => undefined); // keep the chain alive if a task rejects
    return result;
  }
}
