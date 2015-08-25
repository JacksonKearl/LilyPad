DROP SCHEMA IF EXISTS "PartySpot" CASCADE;

CREATE SCHEMA "PartySpot";

CREATE TABLE "PartySpot".locations (
	location_id	serial		PRIMARY KEY,
	name		text		NOT NULL,
	latitude	decimal(10,2)	NOT NULL,
	longitude	decimal(10,2)	NOT NULL,
	logo_url 	text,
	party		boolean         NOT NULL,
	UNIQUE(latitude, longitude)
);

CREATE TABLE "PartySpot".people (
	user_id		    serial		PRIMARY KEY,
	username	    text	  	NOT NULL,
	pin		        text  		NOT NULL,
	last_location	integer		REFERENCES "PartySpot".locations ON DELETE RESTRICT
									 ON UPDATE CASCADE,
	UNIQUE(username)
);

CREATE TABLE "PartySpot".favorites (
	user_id	  	integer		REFERENCES "PartySpot".people ON DELETE CASCADE,
	location_id	integer		REFERENCES "PartySpot".locations ON DELETE CASCADE,
	UNIQUE(user_id, location_id)
);

CREATE TABLE "PartySpot".friends(
	partyA  	integer		REFERENCES "PartySpot".people ON DELETE CASCADE,
	partyB  	integer		REFERENCES "PartySpot".people ON DELETE CASCADE,
	status      text     NOT NULL,
    UNIQUE(partyA,partyB)
);

CREATE TABLE "PartySpot".meets (
    requester   integer     REFERENCES "PartySpot".people ON DELETE CASCADE,
    requestee   integer     REFERENCES "PartySpot".people ON DELETE CASCADE,
    name        text        NOT NULL,
    deeplink    text        NOT NULL
);


/*
** Create a location with given paramaters
*/

CREATE OR REPLACE FUNCTION "PartySpot".create_location(
					name text, 
					latitude numeric, 
					longitude numeric,
					party boolean, 
					logo_url text = '')
RETURNS void AS $$
	INSERT INTO "PartySpot".locations (name, latitude, longitude, logo_url, party) 
		VALUES (name, latitude, longitude, logo_url, party);

$$ LANGUAGE SQL VOLATILE STRICT;



/*
** Add/Update location's logo URL
*/

CREATE OR REPLACE FUNCTION "PartySpot".update_url(url text, location_id integer)
RETURNS void AS $$
	
	UPDATE "PartySpot".locations SET logo_url=$1 WHERE location_id=$2;

$$ LANGUAGE SQL VOLATILE STRICT;




CREATE OR REPLACE FUNCTION "PartySpot".fast_distance(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
RETURNS numeric AS $$
DECLARE
	toRad numeric := 6.28319/360.0;
	lat1 numeric := lat1 * toRad;
	lat2 numeric := lat2 * toRad;
	lon1 numeric := lon1 * toRad;
	lon2 numeric := lon2 * toRad;
	x numeric = (lat2 - lat1);
	y numeric = (lon2 - lon1) * cos(lat1);
BEGIN
	RETURN ROUND(6371 * sqrt(x * x + y * y),0);
END
$$ LANGUAGE plpgsql;



/*
** Returns the three locations nearest a given latitude/longitude, along with respective distances
*/

CREATE OR REPLACE FUNCTION "PartySpot".get_locations_nearest(lat numeric, lon numeric)
RETURNS TABLE (location_id integer, 
		name text, 
		latitude numeric, 
		longitude numeric, 
		logo_url text, 
		party boolean,
		distance numeric) AS $$

	SELECT 	location_id, 
		name, 
		latitude, 
		longitude, 
		logo_url, 
		party,
		(SELECT * FROM "PartySpot".fast_distance(lat, lon, latitude, longitude)) AS distance_sqr 
	FROM "PartySpot".locations
	ORDER BY distance_sqr
	LIMIT 3;

$$ LANGUAGE SQL IMMUTABLE STRICT;
	

/*
** Returns the three parties nearest a given latitude/longitude, along with respective distances
*/

CREATE OR REPLACE FUNCTION "PartySpot".get_parties_nearest(lat numeric, lon numeric)
RETURNS TABLE (location_id integer, 
		name text, 
		latitude numeric, 
		longitude numeric, 
		logo_url text, 
		party boolean,
		distance numeric) AS $$

	SELECT 	location_id, 
		name, 
		latitude, 
		longitude, 
		logo_url, 
		party,
		(SELECT * FROM "PartySpot".fast_distance(lat, lon, latitude, longitude)) AS distance_sqr 
	FROM "PartySpot".locations
	WHERE party
	ORDER BY distance_sqr
	LIMIT 3;

$$ LANGUAGE SQL IMMUTABLE STRICT;

/*
**  Creates a user with given name at location nearest given latitude and longitude
*/

CREATE OR REPLACE FUNCTION "PartySpot".create_user(username text, pin text)
RETURNS "PartySpot".people AS $$
	
	INSERT INTO "PartySpot".people (username, pin)
		VALUES (username, pin);
    SELECT * FROM "PartySpot".people WHERE username = $1 AND pin = $2;

$$ LANGUAGE SQL VOLATILE STRICT;



/*
** Finds all users case insensitively containing a given phrase
*/

CREATE OR REPLACE FUNCTION "PartySpot".search_users(phrase text)
RETURNS TABLE( user_id integer,
		username text,
		location text,
		latitude numeric,
		longitude numeric,
		logo_url text ) AS $$

	SELECT 	user_id, 
		username, 
		(SELECT name 
			FROM "PartySpot".locations 
			WHERE location_id = last_location)
			AS name, 
		(SELECT latitude 
			FROM "PartySpot".locations 
			WHERE location_id = last_location)
			AS latitude, 
		(SELECT longitude
			FROM "PartySpot".locations 
			WHERE location_id = last_location)
			AS longitude, 
		(SELECT logo_url 
			FROM "PartySpot".locations 
			WHERE location_id = last_location)
			AS logo_url 
		FROM "PartySpot".people 
		WHERE lower(username) LIKE '%' || lower(phrase) || '%';

$$ LANGUAGE SQL VOLATILE STRICT;  


/*
** Finds all locations case insensitively containing a given phrase
*/

CREATE OR REPLACE FUNCTION "PartySpot".search_locations(phrase text)
RETURNS SETOF "PartySpot".locations AS $$

	SELECT * 
		FROM "PartySpot".locations
		WHERE lower(name) LIKE '%' || lower(phrase) || '%';

$$ LANGUAGE SQL VOLATILE STRICT;  

/*
** Get location info for user with given username
*/
	
CREATE OR REPLACE FUNCTION "PartySpot".get_user_location(user_id integer)
RETURNS "PartySpot".locations AS $$

	SELECT * FROM "PartySpot".locations 
		WHERE location_id = (SELECT last_location 
					FROM "PartySpot".people 
					WHERE user_id = $1 
					LIMIT 1);

$$ LANGUAGE SQL IMMUTABLE STRICT;

