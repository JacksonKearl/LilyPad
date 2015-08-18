DROP SCHEMA IF EXISTS "PartySpot" CASCADE;

CREATE SCHEMA "PartySpot";

CREATE TABLE "PartySpot".locations (
	location_id	serial		PRIMARY KEY,
	name		text		NOT NULL,
	latitude	decimal(10,2)	NOT NULL,
	longitude	decimal(10,2)	NOT NULL,
	logo_url 	text,
	UNIQUE(latitude, longitude)
);

CREATE TABLE "PartySpot".people (
	user_id		serial		PRIMARY KEY,
	username	text		NOT NULL,
	last_location	integer		REFERENCES "PartySpot".locations ON DELETE RESTRICT
									 ON UPDATE CASCADE,
	UNIQUE(username)
);





/*
** Create a location with given paramaters
*/

CREATE OR REPLACE FUNCTION create_location(
					name text, 
					latitude numeric, 
					longitude numeric, 
					logo_url text = null)
RETURNS void AS $$
	INSERT INTO "PartySpot".locations (name, latitude, longitude, logo_url) 
		VALUES (name, latitude, longitude, logo_url);

$$ LANGUAGE SQL VOLATILE STRICT;



/*
** Add/Update location's logo URL
*/

CREATE OR REPLACE FUNCTION update_url(url text, location_id integer)
RETURNS void AS $$
	
	UPDATE "PartySpot".locations SET logo_url=$1 WHERE location_id=$2;

$$ LANGUAGE SQL VOLATILE STRICT;




CREATE OR REPLACE FUNCTION distance(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
RETURNS numeric AS $$
DECLARE
	toRad numeric := 6.28319/360;
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

CREATE OR REPLACE FUNCTION get_locations_nearest(lat numeric, lon numeric)
RETURNS TABLE (location_id integer, 
		name text, 
		latitude numeric, 
		longitude numeric, 
		logo_url text, 
		distance numeric) AS $$

	SELECT 	location_id, 
		name, 
		latitude, 
		longitude, 
		logo_url, 
		(SELECT * FROM distance(lat, lon, latitude, longitude)) AS distance 
	FROM "PartySpot".locations
	ORDER BY distance
	LIMIT 3;

$$ LANGUAGE SQL IMMUTABLE STRICT;
	


/*
**  Creates a user with given name at location nearest given latitude and longitude
*/

CREATE OR REPLACE FUNCTION create_user(username text, latitude numeric, longitude numeric)
RETURNS TABLE (location_id integer, 
		name text, 
		latitude numeric, 
		longitude numeric, 
		logo_url text, 
		distance numeric) AS $$
	
	INSERT INTO "PartySpot".people (username, last_location)
		VALUES (username, (SELECT location_id 
					FROM get_locations_nearest(latitude, longitude)
					LIMIT 1));

	SELECT * FROM get_locations_nearest(latitude, longitude) LIMIT 1;


$$ LANGUAGE SQL VOLATILE STRICT;



/*
** Finds all users case insensitively containing a given phrase
*/

CREATE OR REPLACE FUNCTION search_user(phrase text)
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
** Get location info for user with given username
*/
	
CREATE OR REPLACE FUNCTION get_user_location(user_id integer)
RETURNS "PartySpot".locations AS $$

	SELECT * FROM "PartySpot".locations 
		WHERE location_id = (SELECT last_location 
					FROM "PartySpot".people 
					WHERE user_id = $1 
					LIMIT 1);

$$ LANGUAGE SQL IMMUTABLE STRICT;

