# payment-gateway

sudo apt-get install postgresql postgresql-contrib -y
npm install pg
sudo service postgresql start
sudo -u postgres psql
ALTER USER paralegal CREATEDB;
\dp
sudo service postgresql restart

sudo -u postgres psql paralegaldb
\dt
\d user_subscriptions
SELECT * FROM user_subscriptions;


-> Backup
pg_dump -U your_username -h localhost -d your_database_name > backup.sql
pg_dump -U paralegal -h localhost -d paralegaldb > backup.sql

->Restore
sudo -u postgres psql

CREATE DATABASE new_database_name;
CREATE DATABASE paralegaldb;
\q

sudo -u postgres psql paralegaldb < ./backup.sql






