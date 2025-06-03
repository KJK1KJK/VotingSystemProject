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

#Run Alembic and start FastAPI
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"]
