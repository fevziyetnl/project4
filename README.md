# Network

Project 4 of https://cs50.harvard.edu/web/2020/projects/4/network/

# Setup

git clone https://github.com/fevziyetnl/project4
cd network

   Install dependencies:

pip install -r requirements.txt

   Django requires a secret key, so you will need to make sure that you add one to your bash profile.

SECRET_KEY="your-secret-key-goes-here"
export SECRET_KEY 

   You can generate a random secret key by running:

python -c "import secrets; print(secrets.token_urlsafe())"

   To run the development server:

python manage.py runserver
