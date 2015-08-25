DROP SCHEMA IF EXISTS lilypad CASCADE;

CREATE SCHEMA lilypad;

CREATE TABLE lilypad.locations (
	location_id	serial		PRIMARY KEY,
	name		text		NOT NULL,
	latitude	decimal(10,2)	NOT NULL,
	longitude	decimal(10,2)	NOT NULL,
	logo_url 	text,
	party		boolean         NOT NULL,
	UNIQUE(latitude, longitude)
);

CREATE TABLE lilypad.people (
	user_id		    serial		PRIMARY KEY,
	username	    text	  	NOT NULL,
	pin		        text  		NOT NULL,
	last_location	integer		REFERENCES lilypad.locations ON DELETE RESTRICT
									 ON UPDATE CASCADE,
	UNIQUE(username)
);

CREATE TABLE lilypad.favorites (
	user_id	  	integer		REFERENCES lilypad.people ON DELETE CASCADE,
	location_id	integer		REFERENCES lilypad.locations ON DELETE CASCADE,
	UNIQUE(user_id, location_id)
);

CREATE TABLE lilypad.friends(
	partyA  	integer		REFERENCES lilypad.people ON DELETE CASCADE,
	partyB  	integer		REFERENCES lilypad.people ON DELETE CASCADE,
	status      text     NOT NULL,
    UNIQUE(partyA,partyB)
);

CREATE TABLE lilypad.meets (
    requester   integer     REFERENCES lilypad.people ON DELETE CASCADE,
    requestee   integer     REFERENCES lilypad.people ON DELETE CASCADE,
    name        text        NOT NULL,
    deeplink    text        NOT NULL
);


/*
** Create a location with given paramaters
*/

CREATE OR REPLACE FUNCTION lilypad.create_location(
					name text,
					latitude numeric,
					longitude numeric,
					party boolean,
					logo_url text = '')
RETURNS void AS $$
	INSERT INTO lilypad.locations (name, latitude, longitude, logo_url, party)
		VALUES (name, latitude, longitude, logo_url, party);

$$ LANGUAGE SQL VOLATILE STRICT;



/*
** Add/Update location's logo URL
*/

CREATE OR REPLACE FUNCTION lilypad.update_url(url text, location_id integer)
RETURNS void AS $$

	UPDATE lilypad.locations SET logo_url=$1 WHERE location_id=$2;

$$ LANGUAGE SQL VOLATILE STRICT;




CREATE OR REPLACE FUNCTION lilypad.fast_distance(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
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

CREATE OR REPLACE FUNCTION lilypad.get_locations_nearest(lat numeric, lon numeric)
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
		(SELECT * FROM lilypad.fast_distance(lat, lon, latitude, longitude)) AS distance_sqr
	FROM lilypad.locations
	ORDER BY distance_sqr
	LIMIT 3;

$$ LANGUAGE SQL IMMUTABLE STRICT;


/*
** Returns the three parties nearest a given latitude/longitude, along with respective distances
*/

CREATE OR REPLACE FUNCTION lilypad.get_parties_nearest(lat numeric, lon numeric)
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
		(SELECT * FROM lilypad.fast_distance(lat, lon, latitude, longitude)) AS distance_sqr
	FROM lilypad.locations
	WHERE party
	ORDER BY distance_sqr
	LIMIT 3;

$$ LANGUAGE SQL IMMUTABLE STRICT;

/*
**  Creates a user with given name at location nearest given latitude and longitude
*/

CREATE OR REPLACE FUNCTION lilypad.create_user(username text, pin text)
RETURNS lilypad.people AS $$

	INSERT INTO lilypad.people (username, pin)
		VALUES (username, pin);
    SELECT * FROM lilypad.people WHERE username = $1 AND pin = $2;

$$ LANGUAGE SQL VOLATILE STRICT;



/*
** Finds all users case insensitively containing a given phrase
*/

CREATE OR REPLACE FUNCTION lilypad.search_users(phrase text)
RETURNS TABLE( user_id integer,
		username text,
		location text,
		latitude numeric,
		longitude numeric,
		logo_url text ) AS $$

	SELECT 	user_id,
		username,
		(SELECT name
			FROM lilypad.locations
			WHERE location_id = last_location)
			AS name,
		(SELECT latitude
			FROM lilypad.locations
			WHERE location_id = last_location)
			AS latitude,
		(SELECT longitude
			FROM lilypad.locations
			WHERE location_id = last_location)
			AS longitude,
		(SELECT logo_url
			FROM lilypad.locations
			WHERE location_id = last_location)
			AS logo_url
		FROM lilypad.people
		WHERE lower(username) LIKE '%' || lower(phrase) || '%';

$$ LANGUAGE SQL VOLATILE STRICT;


/*
** Finds all locations case insensitively containing a given phrase
*/

CREATE OR REPLACE FUNCTION lilypad.search_locations(phrase text)
RETURNS SETOF lilypad.locations AS $$

	SELECT *
		FROM lilypad.locations
		WHERE lower(name) LIKE '%' || lower(phrase) || '%';

$$ LANGUAGE SQL VOLATILE STRICT;

/*
** Get location info for user with given username
*/

CREATE OR REPLACE FUNCTION lilypad.get_user_location(user_id integer)
RETURNS lilypad.locations AS $$

	SELECT * FROM lilypad.locations
		WHERE location_id = (SELECT last_location
					FROM lilypad.people
					WHERE user_id = $1
					LIMIT 1);

$$ LANGUAGE SQL IMMUTABLE STRICT;
