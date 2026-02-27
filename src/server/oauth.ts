import { Hono } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"

const REDIRECT_URI = "http://localhost:8081/callback"
const OPENID_CONNECT_CONFIGURATION_ENDPOINT =
    "https://accounts.google.com/.well-known/openid-configuration"
const SCOPES = "openid"
const LOGIN_HINTS = "infiniteloop.co.jp"
let authorizationEndpoint: string
let tokenEndpoint: string
let _userinfoEndpoint: string

function getRandomString(length: number): string {
    const array = new Uint8Array(length)
    globalThis.crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
        "",
    )
}

async function getEndpoint() {
    if (authorizationEndpoint) {
        return
    }
    const response = await (
        await fetch(OPENID_CONNECT_CONFIGURATION_ENDPOINT)
    ).json()
    if ("authorization_endpoint" in response) {
        authorizationEndpoint = response.authorization_endpoint
    }
    if ("token_endpoint" in response) {
        tokenEndpoint = response.token_endpoint
    }
    if ("userinfo_endpoint" in response) {
        _userinfoEndpoint = response.userinfo_endpoint
    }
}

const app = new Hono()

app.get("/redirect", async (c) => {
    await getEndpoint()
    const state = getRandomString(16)
    setCookie(c, "oauth_state", state, {
        path: "/",
        secure: false,
        domain: "localhost",
        httpOnly: true,
        maxAge: 180,
        sameSite: "Strict",
    })
    const params = {
        client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
        response_type: "code",
        scope: SCOPES,
        redirect_uri: REDIRECT_URI,
        state,
        hd: LOGIN_HINTS,
    }
    return c.redirect(`${authorizationEndpoint}?${new URLSearchParams(params)}`)
})

app.get("/callback", async (c) => {
    const { error, code, state } = c.req.query()
    if (error || !code) {
        throw new Error(`Authorization failed: ${error}`)
    }
    const oldState = getCookie(c, "oauth_state")
    if (!oldState) {
        throw new Error("Missing OAuth state cookie")
    }
    if (oldState !== state) {
        throw new Error("Invalid OAuth state")
    }
    deleteCookie(c, "oauth_state")

    const params = {
        client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLOUD_CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
        code,
    }
    const response = await (
        await fetch(tokenEndpoint, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(params).toString(),
            method: "POST",
        })
    ).json()

    if ("error" in response) {
        throw new Error(`Authorization Failed: ${response.error}`)
    }
    if (!("access_token" in response)) {
        throw new Error("No access token provided")
    }
    setCookie(c, "oauth_access_token", response.access_token, {
        path: "/",
        secure: false,
        domain: "localhost",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: "Strict",
    })
})

export default app
