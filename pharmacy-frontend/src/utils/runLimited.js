/** Несколько независимых задач сразу, без очереди по одной. */
export async function runLimited(items, limit, worker) {
  const queue = [...items];
  const workers = Math.min(Math.max(limit, 1), queue.length || 1);
  const errors = [];
  await Promise.all(Array.from({ length: workers }, async () => {
    while (queue.length) {
      const item = queue.shift();
      try {
        await worker(item);
      } catch (error) {
        errors.push(error);
      }
    }
  }));
  if (errors.length) {
    throw errors[0];
  }
}
