FROM quay.io/keycloak/keycloak:24.0

COPY sso/keycloak_import/realm-export.json /opt/keycloak/data/import/realm-export.json

ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "start-dev", "--import-realm", "--features=scripts", "--features=scripts"]