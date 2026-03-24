#!/bin/bash
# Parse REDIS_URL into individual vars expected by the app
if [ -n "$REDIS_URL" ]; then
  export REDIS_HOST=$(echo "$REDIS_URL" | sed -E 's|redis://(:.*)?@([^:]+):.*|\2|')
  export REDIS_PORT=$(echo "$REDIS_URL" | sed -E 's|.*:([0-9]+)/?$|\1|')
  export REDIS_PASSWORD=$(echo "$REDIS_URL" | sed -E 's|redis://:?([^@]*)@.*|\1|')
fi

npm run prisma:migrate:deploy && (NODE_OPTIONS='--max-old-space-size=400' npm run seed:marketing || true) && npm run start:prod
