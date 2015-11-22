/*jshint -W058 */
var auth = require('./authentication.js');
var express = require('express');
var router = express.Router();
var pg = require('pg');
var config = require('../config.js');
var connectionString = config.url;
var cleanser = require('./format.js');
var bcrypt = require('bcrypt');
var jwt = require('jwt-simple');
var pgInterface = require('./postgres.js');

router.put('/', function (req, res) {

    bcrypt.hash(req.get('pin'), 10, function(err, hash) {
        if (err) {
            return res.status(500).json({'status':'error',
            'details':'bcrypt error'});
        }


        pgInterface.unauthenticated(
            cleanser('SELECT * FROM lilypad.create_user(%L,%L)', req.get('username'), hash), req, res)
            .then(function (result) {
                var curDaysSinceEpoch = Math.floor((new Date).
                getTime()/(1000*60*60*24));

                var expireDaysSinceEpoch = curDaysSinceEpoch + 3;
                var payload = {'user': req.get('username'),
                            'expires': expireDaysSinceEpoch};

                var token = jwt.encode(payload, config.secret);

                return res.status(201).json({'status':'success',
                                            'details':'user added',
                                              'token':token});
            }).catch(function (error) {
                if (error.code === 500) {
                    return res.status(500).json({'status':'error',
                                                'details':'Possible repeat name'});
                } else {
                    return res.status(error.code).json({'status':error.status,
                                                       'details':error.details});
                }
            });

    });
});

router.get('/', function(req, res) {
    var userData = {};

    pgInterface.authenticated('SELECT location_id FROM lilypad.favorites ' +
        'WHERE user_id = [user_id]', req, res)
        .then(function (data) {
            userData = data.user;
            userData.favorites = data.result;

            return pgInterface.unauthenticated('SELECT * FROM lilypad.friends ' +
            'WHERE partyA = [user_id] OR partyB = [user_id]', req, res, userData);
        })
        .then(function (friends) {
            friendsData = friends.result;
            userData.friends = {mutual:[], requested:[], pending:[]};

            for (var i = 0; i < friendsData.length; i++) {

                if (friendsData[i].status === 'mutual') {
                    userData.friends.mutual.push(friendsData[i]);
                }
                else if (friendsData[i].status === 'pending') {

                      if (friendsData[i].partya === userData.user_id) {
                         userData.friends.requested.push(friendsData[i]);
                     } else {
                         userData.friends.pending.push(friendsData[i]);
                     }

                 }
            }

            return pgInterface.unauthenticated('SELECT * FROM lilypad.meets ' +
            ' WHERE requestee = [user_id] OR requester = [user_id]', req, res, userData);
        })
        .then(function (meets) {

            userData.meets = meets.result;
            return res.status(200).json({'status':'success',
                                        'details':'data retrived',
                                           'user':userData});
        })
        .catch(function (error) {
            return res.status(error.code).json({'status':error.status,
                                               'details':error.details});
        });
});

router.patch('/', function(req, res) {
    pgInterface.authenticated('UPDATE lilypad.people SET last_location='+cleanser.numberify(req.get('location_id'))+' WHERE user_id = [user_id]', req, res)
    .then(function (data) {
        return res.status(201).json({'status':'success',
                                    'details':'location set'});
    });
});

router.delete('/', function(req, res) {
    pgInterface.authenticated('DELETE FROM lilypad.people WHERE user_id=[user_id]', req, res)
    .then(function (data) {
        return res.status(200).json({'status':'success',
                                    'details':'account deleted'});
    })
    .catch(function (error) {
        return res.status(error.code).json({'status':error.status,
                                           'details':error.details});
    });
});

router.get('/:user_id', function(req, res) {
    var id = cleanser.numberify(req.params.user_id);
    var other_name;
    pgInterface.unauthenticated('SELECT username FROM ' +
    'lilypad.people WHERE user_id = '+id, req, res)
    .then(function (data) {
        if (data.result[0]) {
            other_name = data.result[0].username;
        } else {
            return res.status(404).json({'status':'error',
                                        'details':'user not found'});
        }
        return pgInterface.friends('SELECT * FROM lilypad.get_user_location('+id+')',req,res,id);
    })
    .then(function (data) {
        var results = data.result;
        if (results[0].name) {
            return res.status(200).json({'status':'success',
                                        'details':'found',
                                           'name':other_name,
                                        'results': results });
        } else if (results){
            return res.status(404).json({'status':'error',
                                           'name':other_name,
                                        'details':'user no location'});
        } else {
            return res.status(404).json({'status':'error',
                                        'details':'user not found'});
        }
    })
    .catch(function (error) {
        return res.status(error.code).json({'status':error.status,
                                              'name':other_name,
                                           'details':error.details});
    });
});

router.put('/favorites', function(req, res) {
    var target;

    if(!(req.get('username') && req.get('location_id'))) {
        return res.status(500).json({'status':'error',
        'details':'no headers'});
    }

    pgInterface.authenticated('INSERT INTO lilypad.favorites (user_id,location_id) VALUES ([user_id],' + req.get('location_id') + ')')
    .then(function (data) {
        return res.status(201).json({'status':'success',
        'details':'favorited location'});
    })
    .catch(function (error) {
        return res.status(error.code).json({'status':error.status,
                                              'name':other_name,
                                           'details':error.details});
    });
});


router.put('/:user_id/friends', function(req, res) {
    var id = parseInt(req.params.user_id,10);
    var target;

    if(!(req.get('username'))) {
        return res.status(500).json({'status':'error',
        'details':'no headers'});
    }

    pg.connect(connectionString, function(err, client, done) {
        auth.validate(req, function(user) {
            auth.requestRecievedFriends(user.user_id, req.get('user_id'),
            function() {
                var addFav = client.query('UPDATE lilypad.friends SET '+
                ' status=\'mutual\' WHERE partya = $1 and partyb = $2',
                [id, user.user_id]);
                addFav.on('end', function(row) {
                    done();
                    return res.status(201).json({'status':'success',
                    'details':'confirmed request'});
                });
                addFav.on('error', function(row) {
                    done();
                    //console.log(row);
                    return res.status(500).json({'status':'error',
                    'details':'unknown error'});
                });

            }, function(proceed){
                var addFav = client.query('INSERT INTO lilypad.friends '+
                '(partya,partyb, status) VALUES ('+
                user.user_id + ',' + id +
                ',\'pending\')');

                addFav.on('end', function(row) {
                    done();
                    return res.status(201).json({'status':'success',
                    'details':'request sent'});
                });
                addFav.on('error', function(row) {
                    done();
                    //console.log(row);
                    return res.status(500).json({'status':'error',
                    'details':'unknown error'});
                });
            });
        }, function (err) {
            done();
            return res.status(401).json(err);
        });
    });
});

router.delete('/:user_id/friends', function(req, res) {
    var id = parseInt(req.params.user_id,10);
    pgInterface.authenticated('DELETE FROM lilypad.friends WHERE partya = '+id+' and partyb = [user_id]',req, res)
    .then(function (data) {
        return res.status(201).json({'status':'success',
                                    'details':'request gone'});
    })
    .catch(function (error) {
        return res.status(error.code).json({'status':error.status,
                                           'details':error.details});
    });
});

router.post('/:user_id/friends', function(req, res) {
    var id = parseInt(req.params.user_id,10);

    pgInterface.authenticated('UPDATE lilypad.friends SET status=\'mutual\' WHERE partya = '+id+' and partyb = [user_id]', req, res)
    .then(function () {
        return res.status(201).json({'status':'success',
                                    'details':'confirmed request'});
    })
    .catch(function () {
        return res.status(error.code).json({'status':error.status,
                                           'details':error.details});
    });
});

router.post('/:user_id/meets', function(req, res) {
    var friend_id = parseInt(req.params.user_id, 10);

    if (!(req.body.name && req.body.deeplink)){
        return res.status(400).json({'status':'error',
                                    'details':'insufficaint data'});
    }

    pgInterface.friends(cleanser(
        'INSERT INTO lilypad.meets VALUES ([user_id],%L,%L,%L)',
        friend_id,
        req.body.name,
        req.body.deeplink),req, res, friend_id)
    .then(function (data) {
        return res.status(201).json({'status':'success',
                                    'details':'Invite Sent'});
    })
    .catch(function (error) {
        return res.status(error.code).json({'status':error.status,
                                           'details':error.details});
    });
});

router.delete('/:user_id/meets', function(req, res) {
    var friend_id = parseInt(req.params.user_id, 10);

    if (!req.get('location_name')) {
        return res.status(400).json({'status':'error',
                                    'details':'need location_name header'});
    }

    pgInterface.friends(cleanser('DELETE FROM lilypad.meets WHERE ((requester = %s AND requestee = [user_id]) OR (requestee = %s AND requester = [user_id])) AND name = %L;', friend_id, friend_id, req.get('location_name')), req, res, friend_id)
    .then(function (data) {
        return res.status(201).json({'status':'success',
                                    'details':'Invite Deleted'});
    })
    .catch(function (error) {
        return res.status(error.code).json({'status':error.status,
                                           'details':error.details});
    });
});

module.exports = router;
