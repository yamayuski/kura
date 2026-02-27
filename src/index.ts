import { serve } from "bun"
import { websocket } from "hono/bun"
import index from "./index.html"
import fetch from "./server/fetch"

const server = serve({
    routes: {
        // Serve index.html for all unmatched routes.
        "/": index,
        "/index.html": index,
    },

    fetch,
    websocket,

    development: process.env.NODE_ENV !== "production" && {
        // Enable browser hot reloading in development
        hmr: true,

        // Echo console logs from the browser to the server
        console: true,
    },

    port: 8081,
})

console.log(`🚀 Server running at ${server.url}`)
