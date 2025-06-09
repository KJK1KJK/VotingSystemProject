#!/bin/bash

if [ ! -f /opt/keycloak/data/import/.imported ]; then
  echo "Importing Keycloak realm..."
  /opt/keycloak/bin/kc.sh start-dev --import-realm --features=scripts &
  PID=$!

  # Wait for Keycloak to finish import
  sleep 30

  # Signal import is done
  touch /opt/keycloak/data/import/.imported

  kill $PID
fi

# Start normally now that import is done
exec /opt/keycloak/bin/kc.sh start-dev --features=scripts --import-realm --override=true