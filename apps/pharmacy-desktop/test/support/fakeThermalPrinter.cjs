/**
 * Записывает вызовы node-thermal-printer, без железа.
 */
function createFakeThermalPrinter() {
  const calls = [];
  const printer = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'calls') return calls;
        return (...args) => {
          calls.push({ method: String(prop), args });
        };
      },
    },
  );
  return printer;
}

function callsOf(printer, method) {
  return printer.calls.filter((call) => call.method === method);
}

module.exports = {
  createFakeThermalPrinter,
  callsOf,
};
