/** Serialize offline DB work so chunked bootstrap can yield without concurrent readers/writers. */
let tail = Promise.resolve();

function enqueueOfflineDb(task) {
  const run = tail.then(
    () => task(),
    () => task(),
  );
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

module.exports = {
  enqueueOfflineDb,
};
