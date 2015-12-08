# LilyPad [![Build Status](https://travis-ci.org/JacksonKearl/LilyPad.svg?branch=master)](https://travis-ci.org/JacksonKearl/LilyPad)
## Overview
Cordova-based app to find the most convenient party city for you and a friend. Targeting iOS and Andriod.

Backend written in Node.js with express for routing, interfaces with a PostgreSQL database.

Backend currently running on a spare desktop in my room running Ubuntu Server 14.04 LTS, as such HTTPS/SSL/whatever are nowhere to be seen. To aliviate the security responsibility, users will be allowed to only use 6 digit PINs, which (hopefully...) will be distinct from their inevitable 'everything' password, making the all too likely event of a data breach affect this service and only this service.

Full integration testing with Mocha, Supertest, and Should.js. Continuous integration testing provided by [TravisCI](https://travis-ci.org/JacksonKearl/LilyPad).

Authentication using [bcrypt](https://github.com/ncb000gt/node.bcrypt.js/) with strength 13 for first contact, followed by an [simple-jwt](https://github.com/hokaccha/node-jwt-simple) JWT with 3 day expiration. Don't really know to what extent this secures anything, but if some poor soul were to attempt an online attack, it would take about a month to get through bcrypting all 1,000,000 possible passwords per account.

However, in the all too likely event that the database is breached, someone not using glacial hardware, or only checking the 123456 and 808080 I'm sure 90% of users will use, will get through in about a second. #ohwell. Don't know why anyone would do that though, with full database access they'd already have the ability to form all the digital friends they're clearly lacking in the real world.
Anyways, probably better off sniffing the plaintext PIN or JWT sent over plain HTTP requests.


##Installing
If you'd like to run the backend on your own computer for whatever reason, first `npm`, `nodejs`, and `psql` must be installed, then

```bash
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

Where `secret` is some random string that will be used as the JSON Web Token key.

####Fun tip! 

```bash
$ xxd -l 28 -p /dev/urandom
```
Will generate a good `secret` string for you. You must have vim for this to work. But lets be real, you'd better have vim no matter what. 😉

##Testing
Integration testing through `mocha` and `supertest`. Tests by default run off of dev server at `lilypaddev.ddns.net`, but this can be configured in `LilyPad/test/tests.js`.

To run tests:

```bash
$ cd LilyPadBackend/
$ npm test
```

Well that wasn't too bad. 🙃
