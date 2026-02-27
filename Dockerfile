# syntax=docker/dockerfile:1.6
# check=error=true

FROM mirror.gcr.io/oven/bun:1 AS base

RUN mkdir -p /tmp/dev
WORKDIR /tmp/dev

FROM base AS install-dev

COPY package.json bun.lock /tmp/dev/

RUN bun install --frozen-lockfile

FROM base AS install-prod

COPY package.json bun.lock /tmp/dev/

RUN bun install --frozen-lockfile --production

FROM base AS prerelease

WORKDIR /usr/src/app

COPY --from=install-dev /tmp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production
RUN bun test && bun run build

FROM base AS release

WORKDIR /usr/src/app

COPY --from=install-prod /tmp/dev/node_modules node_modules
COPY --from=prerelease /usr/src/app/index.ts /usr/src/app/package.json ./

USER bun
EXPOSE 8081/tcp
ENTRYPOINT [ "bun", "run" ]
CMD [ "index.ts" ]
