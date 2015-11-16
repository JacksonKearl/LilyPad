var should = require('should');
var assert = require('assert');
var request = require('supertest');
var config = require('../config.js');

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

    describe('Friend Routes', function (argument) {

        it('should allow me to request a friend', function (done) {
            request(url)
                .put('/users/3/friends')
                .set(myCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(201);
                    done();
                });
            });

        it('should update my requested list once I request a friend', function (done) {
            request(url)
                .get('/users')
                .set(myCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.results.friends.requested[0].should.eql({'partya':1,'partyb':3,'status':'pending'});
                    done();
                });
            });

        it('should update friend once I request them', function (done) {
            request(url)
                .get('/users')
                .set(myFriendCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.results.friends.pending[0].should.eql({'partya':1,'partyb':3,'status':'pending'});
                    done();
                });
            });

        it('should allow the other person to accept the request', function(done) {
            request(url)
                .post('/users/1/friends')
                .set(myFriendCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(201);
                    done();
                });
            });

        it('should update my friend list once they accept', function (done) {
            request(url)
                .get('/users')
                .set(myCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.results.friends.mutual[0].should.eql({'partya':1,'partyb':3,'status':'mutual'});
                    done();
                });
            });

        it('should update their friend list once they accept', function (done) {
            request(url)
                .get('/users')
                .set(myFriendCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.results.friends.mutual[0].should.eql({'partya':1,'partyb':3,'status':'mutual'});
                    done();
                });
            });

        it('should allow someone else to request me as a friend', function (done) {
            request(url)
                .put('/users/1/friends')
                .set(dontKnowCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(201);
                    done();
                });
            });

        it('should update their sent request list once I\'m requested', function (done) {
                request(url)
                    .get('/users')
                    .set(dontKnowCreds)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.results.friends.requested[0].should.eql({'partya':6,'partyb':1,'status':'pending'});
                        done();
                    });
                });

        it('should update my recieved requested list once I\'m requested', function (done) {
            request(url)
                .get('/users')
                .set(myCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.results.friends.pending[0].should.eql({'partya':6,'partyb':1,'status':'pending'});
                    done();
                });
            });

        it('should allow me to delete their request', function (done) {
            request(url)
                .delete('/users/6/friends')
                .set(myCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(201);
                    done();
                });
            });

        it('should update their sent request list once I delete', function (done) {
                    request(url)
                        .get('/users')
                        .set(dontKnowCreds)
                        .end(function (err, res) {
                            if (err) {
                                throw err;
                            }
                            res.body.results.friends.requested.length.should.equal(0);
                            done();
                        });
                    });

        it('should update my recieved requests list once I delete', function (done) {
                request(url)
                    .get('/users')
                    .set(myCreds)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.results.friends.pending.length.should.equal(0);
                        done();
                    });
                });

    });

    describe('User Location Routes', function() {
        it('should allow me to set a location', function(done) {
            var requestHeaders = JSON.parse(JSON.stringify(myCreds));
            requestHeaders.location_id = 1;

            request(url)
                .patch('/users')
                .set(requestHeaders)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(201);
                    done();
                });
        });

        it('should update my info when I set a location', function(done) {
            var requestHeaders = JSON.parse(JSON.stringify(myCreds));
            requestHeaders.location_id = 1;

            request(url)
                .get('/users')
                .set(requestHeaders)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.user.last_location.should.equal(1);
                    done();
                });
        });

        it('should let friends see my new location', function(done) {

            request(url)
                .get('/users/1')
                .set(myFriendCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.should.have.property('name','me');
                    res.body.results[0].should.have.property('name','MIT');
                    done();
                });
        });


        it('should not let randos see my new location', function(done) {

            request(url)
                .get('/users/1')
                .set(dontKnowCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(401);
                    done();
                });
        });
    });

    describe('Meet Up Routes', function () {
        it('should let me arrange to meet with a friend', function (done) {
            request(url)
                .post('/users/3/meets')
                .set(myCreds)
                .send({'name':'Memphis','deeplink':'https://api.googlemaps.../'})
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(201);
                    done();
                });
        });

        it('should let me arrange to meet with a friend agian', function (done) {
            request(url)
                .post('/users/3/meets')
                .set(myCreds)
                .send({'name':'Middle East','deeplink':'https://api.googlemaps.../'})
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(201);
                    done();
                });
        });

        it('should let a friend arrange to meet with me', function (done) {
            request(url)
                .post('/users/1/meets')
                .set(myFriendCreds)
                .send({'name':'Slavador','deeplink':'https://api.googlemaps.../'})
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(201);
                    done();
                });
        });

        it('should update my meets once I arrange', function (done) {
                request(url)
                    .get('/users')
                    .set(myCreds)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.results.meets.length.should.equal(3);
                        done();
                    });
                });

        it('should update their meets once I arrange', function (done) {
                request(url)
                    .get('/users')
                    .set(myFriendCreds)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.results.meets.length.should.equal(3);
                        done();
                    });
                });


        it('should not let me arrange to meet with a rando', function (done) {
            request(url)
                .post('/users/6/meets')
                .set(myCreds)
                .send({'name':'Middle East','deeplink':'https://api.googlemaps.../'})
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(401);
                    done();
                });
        });

        it('should let me delete my meet with a friend', function (done) {
            var requestHeaders = JSON.parse(JSON.stringify(myCreds));
            requestHeaders.location_name = 'Memphis';

            request(url)
                .delete('/users/3/meets')
                .set(requestHeaders)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(201);
                    done();
                });
        });

        it('should let my friend delete my meet with them', function (done) {
            var requestHeaders = JSON.parse(JSON.stringify(myFriendCreds));
            requestHeaders.location_name = 'Middle East';

            request(url)
                .delete('/users/1/meets')
                .set(requestHeaders)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(201);
                    done();
                });
        });

        it('should update my meets once we delete', function (done) {
                request(url)
                    .get('/users')
                    .set(myCreds)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.results.meets.length.should.equal(1);
                        done();
                    });
                });

        it('should update their meets once we delete', function (done) {
                request(url)
                    .get('/users')
                    .set(myFriendCreds)
                    .end(function (err, res) {
                        if (err) {
                            throw err;
                        }
                        res.body.results.meets.length.should.equal(1);
                        done();
                    });
                });
    });

    describe('Clean Up Routes', function () {
        it('should let people delete themselves', function (done) {
            request(url)
                .delete('/users')
                .set(requestedMeCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(200);
                    done();
                });
        });

        it('should let people delete themselves', function (done) {
            request(url)
                .delete('/users')
                .set(requestedThemCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(200);
                    done();
                });
        });

        it('should let people delete themselves', function (done) {
            request(url)
                .delete('/users')
                .set(dontKnowCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(200);
                    done();
                });
        });

        it('should let people delete themselves', function (done) {
            request(url)
                .delete('/users')
                .set(myFriendCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(200);
                    done();
                });
        });

        it('should cascade down to remove dead friends from my list', function (done) {
            request(url)
                .get('/users')
                .set(myCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.body.results.meets.length.should.equal(0);
                    res.body.results.friends.mutual.length.should.equal(0);
                    res.body.results.friends.pending.length.should.equal(0);
                    res.body.results.friends.requested.length.should.equal(0);

                    done();
                });
        });

        it('should let me delete me', function (done) {
            request(url)
                .delete('/users')
                .set(myCreds)
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(200);
                    done();
                });
        });


        it('should not let those not in power reset everything', function (done) {
            request(url)
                .delete('/locations')
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(401);
                    done();
                });
        });

        it('should let those in power reset everything', function (done) {
            request(url)
                .delete('/locations')
                .set({'key':config.secret})
                .end(function (err, res) {
                    if (err) {
                        throw err;
                    }
                    res.status.should.equal(200);
                    done();
                });
        });
    });


});
