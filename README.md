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