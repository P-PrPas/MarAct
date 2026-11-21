# Marketplace integration

The buyer UI is at `/ideas/idea-c`. All paths below are relative to `/api/ideas/idea-c`. FastAPI exposes the request schemas in `/docs`.

## Agent and trend handoff

Link to the buyer UI with any subset of `q` (fruit, farm or use), `kg` (whole kilograms), `postcode` (five digits), `arrival` (ISO date), `preference` (buyer interest) and `sort` (match, cost or date). The public GET /lots accepts the same fields. A match means an order fits the supplied constraints. With missing delivery fields, the result is provisional. Prices are whole baht. Each lot sells in whole units. Delivered cost uses the greater of the lot minimum and enough units to cover the requested weight. Shipping for several lots in one farm delivery uses the highest applicable flat freight charge.

The seeded trend scores are illustrative. The trend service can update a listing with PUT /lots/{id}/trend and a JSON score from 0 to 100 using the trend service key.

## LINE OA and support

Set `IDEA_C_PARTNER_KEYS` in the backend environment to a JSON object mapping each farm's stable name to its own high-entropy secret. Reserve `__admin__` for support and `__trend__` for trend ingestion. Send the corresponding secret in the server-to-server `X-Market-Key` header. Buyer sessions use a separate HTTP-only cookie. The included shop account is registered on first use by choosing Create account in the basket.

- PUT /lots/{id} publishes a lot. On update, send the last observed available quantity as the previous_stock query parameter. Stock is sellable units after reservations. A stale update returns 409. Postcode prefixes describe the farm's service area. Shipping windows are inclusive Thai calendar dates.
- GET /partner/orders?farm=... lists a farm's orders for its LINE adapter. The support inbox uses farm=__admin__ and lists escalations. The integration owner controls polling and message delivery.
- POST /orders/{id}/events accepts an action and note. Accept requires payment instructions. Reject requires a reason. Ship marks dispatch. A cancellation request after acceptance can be approved or denied. Reply records the farm response, resolve records the support decision, and refund records the farm's refund update.
- A quote is for one farm and one arrival date. Checkout requires the exact quote and a client UUID. Retry the same body after a transport failure. Reservations expire after 12 hours. Expired inventory is reconciled before marketplace reads and writes. Each order keeps its accepted prices and delivery address.
