---
type: "query"
date: "2026-10-29T04:58:27.521668+00:00"
question: "Trace the path from openCashierShift to posOpenShift and posDataRouter"
contributor: "graphify"
outcome: "useful"
source_nodes: ["openCashierShift()", "posOpenShift()", "posDataRouter.js"]
---

# Q: Trace the path from openCashierShift to posOpenShift and posDataRouter

## Answer

openCashierShift() in src/hooks/useCashierShift.js calls posOpenShift() in src/services/pos/posDataRouter.js. posDataRouter acts as an offline/online hybrid gateway routing between shiftApi and desktopOfflineBridge, coordinating with fiscalGateway and cashierTerminalIdentity.

## Outcome

- Signal: useful

## Source Nodes

- openCashierShift()
- posOpenShift()
- posDataRouter.js