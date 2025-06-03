# VotingSystemProject

# Instructions for starting the database locally:
1. run an administrator cmd/powershell
2. cd into the project folder
3. run this command: python -m venv env
4. repeat the next steps each time you want to start the server
5. make sure you're still in the project folder
6a. run this command: source env/bin/activate  # Linux/Mac
6b. run this command: .\env\Scripts\activate   # Windows
7. run this command: pip install -r requirements.txt
8. run this command inside of the activated environment: uvicorn app.main:app --reload
9. connect to this host to test the database: http://127.0.0.1:8000/docs#/

# Instructions for running the tests:
1. run an administrator cmd/powershell
2. run command: python -m pytest tests/ -v

# Instructions for running the entire project using docker
1. Run an administrator cmd/powershell
2. Run wsl if on Windows
3. Access the main project folder (int mnt/c if using wsl)
4. Run these commands to install docker
4a. mkdir -p ~/.docker/cli-plugins
4b. curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o ~/.docker/cli-plugins/docker-compose
4c. curl -sSL https://github.com/docker/buildx/releases/download/v0.11.2/buildx-v0.11.2.linux-amd64 -o ~/.docker/cli-plugins/docker-buildx
4d. chmod +x ~/.docker/cli-plugins/docker-buildx
4e. chmod +x ~/.docker/cli-plugins/docker-compose
5. Run this command to build: COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose --env-file .env build
6. Run this comment to start the app: docker-compose up