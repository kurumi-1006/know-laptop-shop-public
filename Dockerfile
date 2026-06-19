# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable

WORKDIR /app

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM base AS builder

ARG NEXT_PUBLIC_APP_URL="http://localhost:3000"
ARG NEXT_PUBLIC_SUPABASE_URL="https://docker-build.supabase.co"
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY="docker-build-anon-key"
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="docker-build-cloud"

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN pnpm exec prisma generate
RUN DATABASE_URL="postgresql://know:know@localhost:5432/know" \
  DIRECT_URL="postgresql://know:know@localhost:5432/know" \
  BETTER_AUTH_SECRET="docker-build-only-secret-not-for-runtime" \
  BETTER_AUTH_URL="http://localhost:3000" \
  GOOGLE_CLIENT_ID="docker-build-client" \
  GOOGLE_CLIENT_SECRET="docker-build-secret" \
  SMTP_USER="docker-build@example.com" \
  SMTP_PASSWORD="docker-build-password" \
  pnpm build

FROM base AS tools

ENV NODE_ENV=development

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN pnpm exec prisma generate

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
