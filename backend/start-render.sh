#!/bin/bash
# Parse REDIS_URL (redis:// or rediss://) into individual vars expected by the app
if [ -n "$REDIS_URL" ]; then
  export REDIS_HOST=$(echo "$REDIS_URL" | sed -E 's|rediss?://(:.*)?@([^:]+):.*|\2|')
  export REDIS_PORT=$(echo "$REDIS_URL" | sed -E 's|.*:([0-9]+)/?$|\1|')
  export REDIS_PASSWORD=$(echo "$REDIS_URL" | sed -E 's|rediss?://:?([^@]*)@.*|\1|')
fi

# Run seed with --transpile-only to avoid ts-node OOM on free tier (skips type checking)
npm run prisma:migrate:deploy && \
  (NODE_OPTIONS='--max-old-space-size=400' node_modules/.bin/ts-node --transpile-only -r tsconfig-paths/register src/seeder/seeder.command.ts marketing || true) && \
  npm run start:prod
