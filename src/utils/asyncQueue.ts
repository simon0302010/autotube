export class AsyncQueue<T> implements AsyncIterable<T> {
  private queue: T[] = [];
  private waiters: ((result: IteratorResult<T, void>) => void)[] = [];
  private isDone = false;
  private error: unknown = null;

  push(value: T): void {
    if (this.isDone) return;
    const waiter = this.waiters.shift();
    if (waiter) {
      waiter({ value, done: false });
    } else {
      this.queue.push(value);
    }
  }

  done(): void {
    if (this.isDone) return;
    this.isDone = true;
    while (this.waiters.length > 0) {
      this.waiters.shift()!({ value: undefined, done: true });
    }
  }

  fail(err: unknown): void {
    this.error = err;
    this.done();
  }

  [Symbol.asyncIterator](): AsyncIterator<T, void> {
    return {
      next: (): Promise<IteratorResult<T, void>> => {
        if (this.error) {
          const err = this.error;
          this.error = null;
          return Promise.reject(err);
        }
        if (this.queue.length > 0) {
          return Promise.resolve({ value: this.queue.shift()!, done: false });
        }
        if (this.isDone) {
          return Promise.resolve({ value: undefined, done: true });
        }
        return new Promise<IteratorResult<T, void>>((resolve) => {
          this.waiters.push(resolve);
        });
      },
    };
  }
}
