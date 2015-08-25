# LilyPad
## Overview
Cordova-based app to find the most convenient party city for you and a friend. Targeting iOS and Andriod. 

Backend written in Node.js with express for routing, interfaces with a PostgreSQL database. 

Backend currently running on a spare desktop in my room running Ubuntu Server 14.04 LTS, as such HTTPS/SSL/whatever are nowhere to be seen. To aliviate the security responsibility, users will be allowed to only use 6 digit PINs, which (hopefully...) will be distinct from their inevitable 'everything' password, making the all too likely event of a data breach affect this service and only this service. 

Authentication using [bcrypt](https://github.com/ncb000gt/node.bcrypt.js/) with strength 13 for first contact, followed by an [simple-jwt](https://github.com/hokaccha/node-jwt-simple) JWT with 3 day expiration. Don't really know to what extent this secures anything, but if some poor soul were to attempt an online attack, it would take about a month to get through bcrypting all 1,000,000 possible passwords per account. 

However, in the all too likely event that the database is breached, someone not using glacial hardware, or only checking the 123456 and 808080 I'm sure 90% of users will use, will get through in about a second. #ohwell. Don't know why anyone would do that though, with full database access they'd already have the ability to form all the digital friends they're clearly lacking in the real world. 
Anyways, probably better off sniffing the plaintext PIN or JWT sent over plain HTTP requests.


##Installing
If you'd like to run the backend on your own computer for whatever reason, first `npm`, `nodejs`, and `psql` must be installed, then 

```
$ git clone https://github.com/JacksonKearl/LilyPad.git
$ cd LilyPad/LilyPadBackend/
$ npm install
$ cd models/postgres/
$ ./refresh.sh
$ vim config.js
$ npm start
````

The `config.js` file should look something like:
```javascript
module.exports = 
{
    "url":"postgres://[username]:[password]@[host]:[port]/[database name]",
    "secret":"ZfegJZVbb3GtAjkYf5rketps7LZkLaxCLHcUGUr...."
};
```

_____________________________________________________________
##API
####User Endpoints
Method                |        Path            | Summary                       | Protected?
----------------------|------------------------|-------------------------------|---------------------------
[PUT](#newuser)       | /users                 | create a user                 | N
[GET](#getuser)       | /users                 | get main user info            | Y
[PATCH](#locateuser)  | /users                 | update user's location        | Y
[PUT](#addFav)        | /users/favorites       | add a favorite location       | Y 
[PUT](#requestFriend) | /users/:userid/friends | friend request :userid        | Y 
[POST](#acceptFriend) | /users/:userid/friends | accept :userid's request      | Y  
[DELETE](#delFriend)  | /users/:userid/friends | reject :userid's request      | Y   
[POST](#meetUp)       | /users/:userid/meets   | arrange to meet with :userid  | Y   
[DELETE](#delMeet)    | /users/:userid/meets   | delete request to meet up     | Y 
[GET](#findUser)      | /users/:userid         | get :userid's location        | Y  

####Search Endpoints
Method                |        Path            | Summary                       | Protected?
----------------------|------------------------|-------------------------------|------------------------------
[GET](#searchLoc)     | /search/locations      | search locations matching term| N
[GET](#searchUser)    | /search/users          | search users matching term    | Y

####Location Endpoints
Method                |        Path            | Summary                                | Protected?
----------------------|------------------------|----------------------------------------|---------------------------
[GET](#getLocations)  | /locations             | get locations nearest a given location | N
[PUT](#putLocation)   | /locations             | create location                        | Y
[PATCH](#changeUrl)   | /locations/:locationid | update url of given location           | Y

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
- 200 - got user
- 401 - unauthorized
- 500 - server error

**Returned JSON**

```json
{
  "status": "success",
  "details": "data retrived",
  "user": {
    "user_id": 9,
    "username": "newUser1",
    "pin": null,
    "last_location": 1,
    "token": "eyJ0eXAiOiJKV1QiLHg..."
  },
  "results": {
    "meets": [
      {
        "requester": 10,
        "requestee": 9,
        "name": "Memphis",
        "deeplink": "http://api.maps.google.com/634g4g5"
      }
    ],
    "favorites": [
      {
        "user_id": 9,
        "location_id": 2
      }
    ],
    "friends": {
      "mutual": [
        {
          "partya": 9,
          "partyb": 10,
          "status": "mutual"
        }
      ],
      "pending": [
        {
          "partya": 12,
          "partyb": 9,
          "status": "pending"
        }
      ],
      "requested": [
        {
          "partya": 9,
          "partyb": 11,
          "status": "pending"
        }
      ]
    }
  }
}
```


<a name="locateuser"></a>
###PATCH /users

Set user's last_location to a given location_id.

**Headers Passed**

Key          | Type    |
-------------|---------|
username     | text    |
pin OR token | text    |
location_id  | serial  |

**Passed JSON**

*NONE*

*Response Codes*
- 200 - location changed
- 401 - unauthorized
- 500 - server error

**Returned JSON**

```json
{
  "status": "success",
  "details": "location set"
}
```

<a name="addFav"></a>
###PUT /users/favorites

Add a 'favorite' location that a user will have quick access to.

**Headers Passed**

Key          | Type    |
-------------|---------|
username     | text    |
pin OR token | text    |
location_id  | serial  |



**Passed JSON**

*NONE*

*Response Codes*
- 201 - favorited location
- 401 - unauthorized
- 500 - server error

**Returned JSON**

```json
{
  "status": "success",
  "details": "favorited location"
}
```

<a name="requestFriend"></a>
###PUT /users/:user_id/friends

Send a friend request to :user_id, such that you will be able to quickly acces them and view their last posted location information.

**Headers Passed**

Key          | Type    |
-------------|---------|
username     | text    |
pin OR token | text    |

**Passed JSON**

*NONE*

*Response Codes*
- 200 - request sent
- 401 - unauthorized
- 500 - server error

**Returned JSON**

```json
{
  "status": "success",
  "details": "request sent"
}
```

<a name="acceptFriend"></a>
###POST /users/:user_id/friends

Accept the friend request sent by :user_id, giving you both the ability to quickly see where the other is, and arrange meet ups.

**Headers Passed**

Key          | Type    |
-------------|---------|
username     | text    |
pin OR token | text    |

**Passed JSON**

*NONE*

*Response Codes*
- 200 - request accepted
- 401 - unauthorized
- 500 - server error

**Returned JSON**

```json
{
  "status": "success",
  "details": "confirmed request"
}
```

<a name="delFriend"></a>
###DELETE /users/:user_id/friends

Delete the friend request sent by :user_id

**Headers Passed**

Key          | Type    |
-------------|---------|
username     | text    |
pin OR token | text    |

**Passed JSON**

*NONE*

*Response Codes*
- 200 - request deleted
- 401 - unauthorized
- 500 - server error

**Returned JSON**

```json
{
  "status": "success",
  "details": "request gone"
}
```

<a name="meetUp"></a>
###POST /users/:user_id/meets

Send a request to meet up with a friend, at a given location, dictated by a deeplink to google maps.

**Headers Passed**

Key          | Type    |
-------------|---------|
username     | text    |
pin OR token | text    |

**Passed JSON**

```json
{
  "name":"Memphis",
  "deeplink":"http://api.maps.google.com/34t5g54"
}
```

*Response Codes*
- 200 - request sent
- 401 - unauthorized
- 500 - server error

**Returned JSON**

```json
{
  "status": "success",
  "details": "Invite Sent"
}
```

<a name="delMeet"></a>
###DELETE /users/:user_id/meets

Delete a request to meet up.

**Headers Passed**

Key          | Type    |
-------------|---------|
username     | text    |
pin OR token | text    |
location_name| text    |

**Passed JSON**

*NONE*

*Response Codes*
- 200 - deleted
- 401 - unauthorized
- 500 - server error

**Returned JSON**

```json
{
  "status": "success",
  "details": "Invite Deleted"
}
```

<a name="findUser"></a>
###GET /users/:user_id

Get the location info of a friend. You must be mutual to get each other's info.

**Headers Passed**

Key          | Type    |
-------------|---------|
username     | text    |
pin OR token | text    |

**Passed JSON**

*NONE*

*Response Codes*
- 200 - got info
- 401 - unauthorized
- 500 - server error

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
      "longitude": "-71.09",
      "logo_url": "http://miter.mit.edu/wp-content/uploads/2012/08/MIT_logo_black_red.jpg",
      "party": true
    }
  ]
}
```




















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

Find the locations, either at all, or only those that party, nearest a given location.

**Headers Passed**

Key          | Type    |
-------------|---------|
latitude     | text    |
longitude    | text    |
party        | text    |

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
  "details": "locations found",
  "results": [
    {
      "location_id": 1,
      "name": "MIT",
      "latitude": "42.36",
      "longitude": "-71.09",
      "logo_url": "http://miter.mit.edu/...",
      "party": true,
      "distance": "824"
    },
    {
      "location_id": 2,
      "name": "UVA",
      "latitude": "38.04",
      "longitude": "-78.51",
      "logo_url": "http://community.brcc.edu/...",
      "party": true,
      "distance": "846"
    },
    {
      "location_id": 3,
      "name": "University South Carolina",
      "latitude": "34.00",
      "longitude": "-81.03",
      "logo_url": "http://3.bp.blogspot.com/....",
      "party": true,
      "distance": "1011"
    }
  ]
}
```

#####Comments

Don't really know what units "distance" is in. Probably kilometers.


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
  "logo_url":"http://miter.mit.edu..."
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
