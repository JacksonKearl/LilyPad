var should = require('should');
var assert = require('assert');
var request = require('supertest');

describe('Routing', function() {
    var url = 'http://localhost:3000';

    //TEST USERS

    var myCreds            = {'username': 'me',
                                   'pin': '123321'};

    var myFriendCreds      = {'username': 'myFriend',
                                   'pin': '123321'};

    var requestedThemCreds = {'username': 'requestedThem',
                                   'pin': '123321'};

    var requestedMeCreds   = {'username': 'requestedMe',
                                   'pin': '123321'};

    var dontKnowCreds       = {'username': 'dontKnow',
                                   'pin': '123321'};


    //TEST LOCATIONS

    var MITLocationData    =
    {
        "name":"MIT",
        "party":"true",
        "latitude":42.3598,
        "longitude":-71.0921,
        "logo_url":"http://miter.mit.edu..."
    };

    var BULocationData    =
    {
        "name":"BU",
        "party":"true",
        "latitude":42.3598,
        "longitude":-71.0921,
        "logo_url":"http://miter.mit.edu..."
    };

    var HarvardLocationData    =
    {
        "name":"Harvard",
        "party":"false",
        "latitude":41.3598,
        "longitude":-71.0921,
        "logo_url":"http://miter.mit.edu..."
    };

    var UCLALocationData    =
    {
        "name":"UCLA",
        "party":"true",
        "latitude":42.3598,
        "longitude":-101.0921,
        "logo_url":"http://miter.mit.edu..."
    };

    var RandoLocationData    =
    {
        "name":"IDK",
        "party":"false",
        "latitude":40.3598,
        "longitude":-101.0921,
        "logo_url":"http://miter.mit.edu..."
    };

    describe('User Login Routes', function () {
        it('should allow me to make my user', function (done) {
            request(url)
        	.put('/users')
            .set(myCreds)
            // end handles the response
        	.end(function(err, res) {
                  if (err) {
                    throw err;
                  }
                  // this is should.js syntax, very clear
                  res.status.should.equal(201);
                  myCreds.token = res.body.token;

                  done();
                });
            });

        it('should not let me create another user with the same name', function (done) {
            request(url)
                .put('/users')
                .set(myCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(500);
                    done();
                });
        });

        it('should allow me to create another user', function (done) {
            request(url)
                .put('/users')
                .set(myFriendCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(201);
                    myFriendCreds.token = res.body.token;

                    done();
                });
        });

        it('should allow me to create another user', function (done) {
            request(url)
                .put('/users')
                .set(requestedThemCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(201);
                    requestedThemCreds.token = res.body.token;

                    done();
                });
        });

        it('should allow me to create another user', function (done) {
            request(url)
                .put('/users')
                .set(requestedMeCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(201);
                    requestedMeCreds.token = res.body.token;

                    done();
                });
        });

        it('should allow me to create another user', function (done) {
            request(url)
                .put('/users')
                .set(dontKnowCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(201);
                    dontKnowCreds.token = res.body.token;

                    done();
                });
        });

        it('should allow me to log in with pin, giving me a token', function (done) {
            delete myCreds.token;
            request(url)
                .get('/users')
                .set(myCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(200);
                    res.body.user.should.have.property('token');
                    myCreds.token = res.body.user.token;

                    done();
                });
        });

        it('should allow me to log in with token', function (done) {
            delete myCreds.pin;
            request(url)
                .get('/users')
                .set(myCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(200);
                    done();
                });
        });

        it('should not allow me to log in with other user\'s token', function (done) {

            var myHackCreds = JSON.parse(JSON.stringify(myFriendCreds));
            myHackCreds.username = 'me';
            delete myHackCreds.pin;

            request(url)
                .get('/users')
                .set(myHackCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(401);
                    done();
                });
        });

    });

    describe('Location Routes', function() {
        it('should allow a user to create a location', function(done) {
            request(url)
                .put('/locations')
                .set(myCreds)
                .send(MITLocationData)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(201);
                    done();
                });
        });

        it('should reject locations too close', function(done) {
            request(url)
                .put('/locations')
                .set(myCreds)
                .send(BULocationData)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(500);
                    done();
                });
        });

        it('should allow a user to create another location', function(done) {
            request(url)
                .put('/locations')
                .set(myCreds)
                .send(HarvardLocationData)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(201);
                    done();
                });
        });

        it('should allow a user to create another location', function(done) {
            request(url)
                .put('/locations')
                .set(myCreds)
                .send(UCLALocationData)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(201);
                    done();
                });
        });

        it('should not allow a rando to create a location', function(done) {
            request(url)
                .put('/locations')
                .send(RandoLocationData)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(401);
                    done();
                });
        });

        it('should allow me to add an image', function(done) {
            request(url)
                .patch('/locations/1')
                .set(myCreds)
                .send({"logo_url":"http://bit.ly/1X1dYfJ"})
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(200);
                    done();
                });
        });

        it('should not allow a rando to add an image', function(done) {
            request(url)
                .patch('/locations/1')
                .send({"logo_url":"http://bit.ly/1X1dYfJ"})
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(400);
                    done();
                });
        });

        it('should search for nearest locations correctly', function(done) {
            request(url)
                .get('/locations')
                .set({'latitude':42.35,'longitude':-71.09,'party':'true'})
                .send({"logo_url":"http://bit.ly/1X1dYfJ"})
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(200);
                    res.body.results[0].should.have.property('name','MIT');
                    done();
                });
        });

    });

    describe('Search Routes', function() {
        it('should search for users correctly', function(done) {
            var requestHeaders = JSON.parse(JSON.stringify(myFriendCreds));
            requestHeaders.phrase = "requested";

            request(url)
                .get('/search/users')
                .set(requestHeaders)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(200);
                    res.body.results.should.have.length(2);
                    done();
                });
        });

        it('should not allow randos to search users', function(done) {

            request(url)
                .get('/search/users')
                .set({'phrase':'requested'})
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(401);
                    done();
                });
        });

        it('should allow randos to search locations', function(done) {
            var requestHeaders = {};
            requestHeaders.phrase = "A";

            request(url)
                .get('/search/locations')
                .set(requestHeaders)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(200);
                    res.body.results.should.have.length(2);
                    done();
                });
        });
    });


});
