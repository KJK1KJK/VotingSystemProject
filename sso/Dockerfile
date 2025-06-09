FROM quay.io/keycloak/keycloak:24.0

COPY sso/keycloak_import/realm-export.json /opt/keycloak/data/import/realm-export.json
COPY sso/entrypoint.sh /opt/keycloak/entrypoint.sh

ENTRYPOINT ["/opt/keycloak/entrypoint.sh"]