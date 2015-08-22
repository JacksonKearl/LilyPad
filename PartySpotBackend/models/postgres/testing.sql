INSERT INTO "PartySpot".locations (name, latitude, longitude, party) 
		VALUES ('MIT',			42.3598,	71.0921, TRUE);
INSERT INTO "PartySpot".locations (name, latitude, longitude, party) 
		VALUES ('UCLA',			34.0722,	118.4441, TRUE);
INSERT INTO "PartySpot".locations (name, latitude, longitude, party) 
		VALUES ('Harvey Mudd',		34.1061,	117.7092, FALSE);
INSERT INTO "PartySpot".locations (name, latitude, longitude, party) 
		VALUES ('UVA',			38.0350,	78.5050, TRUE);
INSERT INTO "PartySpot".locations (name, latitude, longitude, party) 
		VALUES ('University South Carolina',  33.9975,	81.0253, FALSE);

INSERT INTO "PartySpot".people (username, pin) VALUES ('jkearl',	1234); 
INSERT INTO "PartySpot".people (username, pin) VALUES ('iYango',	1642); 
INSERT INTO "PartySpot".people (username, pin) VALUES ('Yassa',		2633); 
INSERT INTO "PartySpot".people (username, pin) VALUES ('cdipaolo',	3345); 
INSERT INTO "PartySpot".people (username, pin) VALUES ('jField',	4345); 
INSERT INTO "PartySpot".people (username, pin) VALUES ('cCrook',	5967); 
INSERT INTO "PartySpot".people (username, pin) VALUES ('Quigg 1.0',	2653); 
INSERT INTO "PartySpot".people (username, pin) VALUES ('Alpha Quigg',	2346); 
INSERT INTO "PartySpot".people (username, pin) VALUES ('Kunzel-MAN',	3634);

INSERT INTO "PartySpot".favorites (user_id, location_id) VALUES (1,1);
INSERT INTO "PartySpot".favorites (user_id, location_id) VALUES (1,2);
INSERT INTO "PartySpot".favorites (user_id, location_id) VALUES (1,3);
INSERT INTO "PartySpot".favorites (user_id, location_id) VALUES (1,5);
INSERT INTO "PartySpot".favorites (user_id, location_id) VALUES (2,1);
INSERT INTO "PartySpot".favorites (user_id, location_id) VALUES (5,1);
INSERT INTO "PartySpot".favorites (user_id, location_id) VALUES (6,2);
INSERT INTO "PartySpot".favorites (user_id, location_id) VALUES (3,1);


INSERT INTO "PartySpot".friends (partyA, partyB, status) VALUES (1,1,'mutual');
INSERT INTO "PartySpot".friends (partyA, partyB, status) VALUES (1,2,'mutual');
INSERT INTO "PartySpot".friends (partyA, partyB, status) VALUES (1,3,'mutual');
INSERT INTO "PartySpot".friends (partyA, partyB, status) VALUES (1,5,'mutual');
INSERT INTO "PartySpot".friends (partyA, partyB, status) VALUES (1,8,'mutual');
INSERT INTO "PartySpot".friends (partyA, partyB, status) VALUES (1,6,'pending');
INSERT INTO "PartySpot".friends (partyA, partyB, status) VALUES (4,1,'requested');
INSERT INTO "PartySpot".friends (partyA, partyB, status) VALUES (1,7,'pending');
INSERT INTO "PartySpot".friends (partyA, partyB, status) VALUES (2,3,'mutual');
INSERT INTO "PartySpot".friends (partyA, partyB, status) VALUES (3,4,'mutual');
INSERT INTO "PartySpot".friends (partyA, partyB, status) VALUES (7,2,'mutual');
INSERT INTO "PartySpot".friends (partyA, partyB, status) VALUES (4,5,'mutual');
INSERT INTO "PartySpot".friends (partyA, partyB, status) VALUES (5,6,'mutual');
INSERT INTO "PartySpot".friends (partyA, partyB, status) VALUES (6,7,'mutual');


INSERT INTO "PartySpot".meets (requester, requestee, name, deeplink) VALUES (1,2,'Memphis', 'http');
INSERT INTO "PartySpot".meets (requester, requestee, name, deeplink) VALUES (3,1,'Soul', 'ftp');
INSERT INTO "PartySpot".meets (requester, requestee, name, deeplink) VALUES (5,1,'Kitch', 'scp');
INSERT INTO "PartySpot".meets (requester, requestee, name, deeplink) VALUES (3,4,'Blah', 'B');
INSERT INTO "PartySpot".meets (requester, requestee, name, deeplink) VALUES (5,7,'Okay', 'Nope');

