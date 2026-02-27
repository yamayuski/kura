import { Hono } from "hono"
import { upgradeWebSocket } from "hono/bun"

const app = new Hono()

app.get(
    "/",
    upgradeWebSocket((_c) => {
        return {
            onOpen: (_ws) => {},
            onMessage: (_ws, _data) => {},
            onClose: (_ws) => {},
            onError: (_ws, _error) => {},
        }
    }),
)

export default app
