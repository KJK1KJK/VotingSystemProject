FROM python:3.11

WORKDIR /app

#Install system dependencies for xmlsec if missing
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    xmlsec1 \
    pkg-config \
    libxml2-dev \
    libxmlsec1-dev \
    libxmlsec1-openssl \
    libssl-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/

#Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

#Copy all backend-related files
COPY ./app ./app
COPY ./alembic ./alembic
COPY alembic.ini .

# Create .env file dynamically
RUN echo "DATABASE_URL=sqlite:///./test.db" >> .env && \
    echo "BACKEND_PORT=8000" >> .env && \
    echo "FRONTEND_PORT=3000" >> .env && \
    echo "KEYCLOAK_PORT=8080" >> .env && \
    echo "KEYCLOAK_ADMIN=admin" >> .env && \
    echo "KEYCLOAK_ADMIN_PASSWORD=admin" >> .env && \
    echo "KC_DB=postgres" >> .env && \
    echo "KC_DB_USERNAME=keycloak" >> .env && \
    echo "KC_DB_PASSWORD=password" >> .env && \
    echo "KC_DB_NAME=keycloak" >> .env && \
    echo "KC_DB_HOST=postgres" >> .env && \
    echo "BACKEND_URL=localhost" >> .env && \
    echo "FRONTEND_URL=localhost" >> .env && \
    echo "KEYCLOAK_URL=localhost" >> .env && \
    echo "INTERNAL_KEYCLOAK_URL=keycloak" >> .env

#Run Alembic and start FastAPI
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"]
