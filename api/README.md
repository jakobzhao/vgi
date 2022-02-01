# LGBTQSPACES API

This is the API used for the LGBTQSPACES project. Specifically, the API establishes a connection between the data source and the database in which information of each data input is stored.

1. `heroku login`
    - Prompts login into Heroku in a new browser.

2. `heroku psql`
    - Enter into Heroku's database to access and run psql commands in bash.

3. `PGUSER=postgres PGPASSWORD=[localdb password] heroku pg:push lgbtqspaces_sys HEROKU_PSQL_URI -a lgbtqspaces-api`
    - PGUSER: local host user name
    - PGPASSWORD: local db password
    - lgbtqspaces_sys: name of db in localhost
    - HEROKU_PSQL_URI: given through Heroku's app owner dashboard
    - lgbtqspaces-api: name of the app hosted on Heroku

*[This command is only useful for testing from local host and moving the schemas from local host to Heroku.]*

4. Databse on Heroku is separate from the database in localhost. In order to use pgAdmin to access Heroku database, use Heroku-given database credentials and login.
