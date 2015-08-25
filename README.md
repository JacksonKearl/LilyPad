# PartySpot
Browser based applet to find the most convenient party city for you and a friend

_____________________________________________________________
##API

Method                |        Path            | Summary
----------------------|------------------------|--------------------------------
[PUT](#newuser)       | /users                 | create a user
[GET](#getuser)       | /users                 | get main user info
[PATCH](#locateuser)  | /users                 | update user's location
[PUT](#addFav)        | /users/favorites       | add a favorite location
[PUT](#requestFriend) | /users/:userid/friends | friend request :userid
[POST](#acceptFriend) | /users/:userid/friends | accept :userid's request
[DELETE](#delFriend)  | /users/:userid/friends | reject :userid's request
[PUT](#meetUp)        | /users/:userid/meets   | arrange to meet with :userid
[DELETE](#delMeet)    | /users/:userid/meets   | delete request to meet up
||
[GET](#searchLoc)     | /search/locations      | search locations matching term
[GET](#searchUser)    | /search/users          | search users matching term
||
[GET](#getLocations)  | /locations             | get locations nearest a given location
[PUT](#putLocation)   | /locations             | create location
[PATCH](#changeUrl)   | /locations/:locationid | update url of given location

<a name="newuser"></a>
###PUT /users

Creates a new user, returning user info with a JWT to use for remaining connections.

**Headers Passed**

Key        | Type    |
-----------|---------|
username   | text    |
pin        | text    |

**Passed JSON**

*None*

*Response Codes*
- 400 - invalid request
- 500 - possible duplicate username
- 201 - location was created

**Returned JSON**
```json

{
  "status": "success",
  "details": "user added",
  "token": "eyJ0eXAiOiJKV1..."
}
```


<a name="getuser"></a>
###GET /users

Get all info about user, including friends, follows, and arranged meets

**Headers Passed**

Key          | Type    |
-------------|---------|
username     | text    |
pin OR token | text    |

**Passed JSON**

*NONE*

*Response Codes*
- 202 - user deleted
- 401 - unauthorized
- 500 - server error

**Returned JSON**

```json
{}
```

#####Comments

Server finds user id from session. No need to send it yourself. Returns blank object.

<a name="searchLoc"></a>
###GET /search/locations

Find all locations containing a given phrase.

**Headers Passed**

Key          | Type    |
-------------|---------|
phrase       | text    |

**Passed JSON**

*NONE*

*Response Codes*
- 200 - okay
- 401 - unauthorized
- 500 - server error

**Returned JSON**

```json
{
  "status": "success",
  "details": "found matches",
  "results": [
    {
      "location_id": 2,
      "name": "UVA",
      "latitude": "38.04",
      "longitude": "-78.51",
      "logo_url": "http://community.brcc.edu/hs/wp-content/uploads/uvaLogo.gif",
      "party": true
    },
    {
      "location_id": 3,
      "name": "University South Carolina",
      "latitude": "34.00",
      "longitude": "-81.03",
      "logo_url": "",
      "party": true
    }
  ]
}
```


<a name="searchUser"></a>
###GET /search/users

Find all usernames containing a given phrase. No location information given for privacy's sake.

**Headers Passed**

Key          | Type    |
-------------|---------|
username     | text    |
pin OR token | text    |
phrase       | text    |

**Passed JSON**

*NONE*

*Response Codes*
- 200 - okay
- 401 - unauthorized
- 500 - server error

**Returned JSON**

```json
{
  "status": "success",
  "details": "found matches",
  "results": [
    {
      "user_id": 9,
      "username": "newUser1"
    },
    {
      "user_id": 10,
      "username": "newUser2"
    }
  ]
}
```


<a name="getLocations"></a>
###GET /locations

Delete the logged-in user from the database

**Headers Passed**

*NONE*

**Passed JSON**

*NONE*

*Response Codes*
- 202 - user deleted
- 401 - unauthorized
- 500 - server error

**Returned JSON**

```json
{}
```

#####Comments

Server finds user id from session. No need to send it yourself. Returns blank object.


<a name="putLocation"></a>
###PUT /locations

Add a new location with given name, location, partyability, and (hopefully) logo URL


**Headers Passed**

Key          | Type    |
-------------|---------|
username     | text    |
pin OR token | text    |

**Passed JSON**

```json
{
  "name":"MIT",
  "party":"true",
  "latitude":42.3598,
  "longitude":-71.0921,
  "logo_url":"http:??miter.mit.edu..."
}

*Response Codes*
- 202 - user deleted
- 401 - unauthorized
- 500 - server error (duplicate?)

**Returned JSON**

```json
{
  "status": "success",
  "details": "location added"
}
```

#####Comments

Two locations may not have same position to hundredths of a degree.


<a name="changeUrl"></a>
###PATCH /locations/:location_id

Add or update a location's logo

**Headers Passed**

Key          | Type    |
-------------|---------|
username     | text    |
pin OR token | text    |

**Passed JSON**

```json
{
  "logo_url":"http://3.bp.blogspot..."
}

*Response Codes*
- 202 - user deleted
- 401 - unauthorized
- 500 - server error

**Returned JSON**

```json
{
  "status": "success",
  "details": "updated"
}
```







<a name="deleteuser"></a>
###DELETE /user

Delete the logged-in user from the database

**Headers Passed**

*NONE*

**Passed JSON**

*NONE*

*Response Codes*
- 202 - user deleted
- 401 - unauthorized
- 500 - server error

**Returned JSON**

```json
{}
```

#####Comments

Server finds user id from session. No need to send it yourself. Returns blank object.


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
