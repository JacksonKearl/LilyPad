# PartySpot
Browser based applet to find the most convenient party city for you and a friend

_____________________________________________________________
##API

###GET /api/locations

Find the three locations nearest a passed latitude longitude.


**Headers Passed**

Key   | Type    | 
------|---------|
latitude   | numeric  | 
longitude | numeric


*Response Codes*
- 400 - invalid request, no headers
- 500 - unknown internal error
- 200 - locations found

**Returned JSON**
```json
{
  "status": "success",
  "details": "locations found",
  "results": [
    {
      "location_id": 5,
      "name": "University South Carolina",
      "latitude": "34.00",
      "longitude": "81.03",
      "logo_url": null,
      "distance": "1152"
    },
    {
      "location_id": 4,
      "name": "UVA",
      "latitude": "38.04",
      "longitude": "78.51",
      "logo_url": null,
      "distance": "1213"
    },
    {
      "location_id": 1,
      "name": "MIT",
      "latitude": "42.36",
      "longitude": "71.09",
      "logo_url": null,
      "distance": "1378"
    }
  ]
}
```


###POST /api/locations

Add a new location at given cooridnants with optional image url for location.


**Passed JSON**
```json
{
  "name":"MIT",
  "latitude":"42.12",
  "longitude":"89.16",
  ["logo_url":"http://miter.mit.edu/wp-content/uploads/2012/08/MIT_logo_black_red.jpg"]
}
```


*Response Codes*
- 400 - invalid request
- 500 - possible duplicate location
- 201 - location was created

**Returned JSON**
```json
{
  "status":"success"|"error",
  "details":"what happened"
}
```

#####Comments

Can not create a location within ~1 mile of another.


###PATCH /api/locations/:location_id

Add/update a url for an location's logo.


**Passed JSON**
```json
{
  "logo_url":"http://miter.mit.edu/wp-content/uploads/2012/08/MIT_logo_black_red.jpg"
}
```


*Response Codes*
- 400 - no url found
- 201 - otherwise, always returned

**Returned JSON**
```json
{
  "status":"success",
  "details":"updated"
}
```








###GET /api/people

Search for usernames containing passed substring


**Headers Passed**

Key   | Type    | 
------|---------|
phrase   | text  | 


*Response Codes*
- 400 - invalid request, no headers
- 500 - unknown internal error
- 200 - users found

**Returned JSON**
```json
{
  "status": "success",
  "details": "found matches",
  "results": [
    {
      "user_id": 7,
      "username": "Quigg 1.0",
      "location": "UCLA",
      "latitude": "34.07",
      "longitude": "118.44",
      "logo_url": null
    },
    {
      "user_id": 8,
      "username": "Alpha Quigg",
      "location": "UCLA",
      "latitude": "34.07",
      "longitude": "118.44",
      "logo_url": null
    }
  ]
}
```


###POST /api/people

Create a user and assign to location nearest given coordinates


**Passed JSON**
```json
{
  "username":"Randy",
  "latitude":"35.21",
  "longitude":"117.89",
}
```


*Response Codes*
- 400 - invalid request
- 500 - possible duplicate username
- 201 - user was created

**Returned JSON**
```json
{
  "status":"success"|"error",
  "details":"what happened"
}
```


###GET /api/people/:user_id

Get location of user with given ID.


**Headers Passed**

Key   | Type    | 
------|---------|
user_id   | integer  | 


*Response Codes*
- 404 - no user found
- 200 - user found

**Returned JSON**
```json
{
  "status": "success",
  "details": "found",
  "results": [
    {
      "location_id": 1,
      "name": "MIT",
      "latitude": "42.36",
      "longitude": "71.09",
      "logo_url": null
    }
  ]
}
```



#####Comments

Fails silently when location_id not available.


#Documentation Format 
####(courtesy of [Conner DiPaolo](https://github.com/cdipaolo))

Keep documentation in this format please!

Add the method to the [path overview](#paths) and place it under the correct [section](#sections)

```markdown
<a name="briefname"></a>
###METHOD /path/to/endpoint

put a decent description of what the endpoint does here

**Headers Passed**

Key   | Type    | Description
------|---------|------------
key   | string  | here's a header description

**Passed JSON**
{
  "example":"of",
  "passed":"json",
  "goes":{
    "here":true
  }
}


*Response Codes*
- 400 - invalid request
- 200 - OK
- 201 - thing was created
- 401 - unauthorized

**Returned JSON**
{
  "example":"of",
  "return":"json",
  "goes":{
    "here":true
  }
}

#####Comments

put notes here about, for example, optional parameters and/or specific types

```

