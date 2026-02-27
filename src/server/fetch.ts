import { Hono } from "hono"
import oauth from "./oauth"
import websocket from "./websocket"

const app = new Hono()

app.route("/oauth", oauth)
app.route("/websocket", websocket)

export default app.fetch
