#Initialize data tables, fill with test data 
#(to be removed once connected to node and running full tests),
#then display the created tables

psql -f init.sql

psql -f testing.sql > /dev/null

#psql -c '\dt "PartySpot".*'
