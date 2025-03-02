FROM node:lts-alpine AS builder

WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
ARG SST_RESOURCE_ZchatDB
ARG SST_RESOURCE_ZchatViewSyncer
ARG SST_RESOURCE_ZchatAuth
ARG SST_RESOURCE_ZeroAuthSecret
ARG SST_RESOURCE_DeepseekApiKey
RUN npm run build
RUN npm prune --prod

FROM builder AS deployer

WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/package.json .
EXPOSE 3000
ENV NODE_ENV=production
CMD [ "node", "build" ]
