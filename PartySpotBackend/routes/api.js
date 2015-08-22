var express = require('express');
var assert  = require('assert');
var router = express.Router();
var pg = require('pg');
var config = require('../config.js');
var connectionString = config.url; 
var format = require('pg-format');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('Root API directory');
});

var numberify = function(num) {
    return +(num) || -1;
}


var validate = function(req, onSucc, onErr) {
    
	if (!(req.get('username') && req.get('pin'))) {
		console.log('GET ERROR! Insufficient data.', req.body);
		return onErr({'status': 'error', 'details': 'Insufficient data'});
    }    
    
    var name = req.get('username');
    var pin  = req.get('pin');

    var results = []
    pg.connect(connectionString, function(err, client, done){
        var query = client.query(format('SELECT * FROM "PartySpot".people WHERE username = %L AND pin = %L',name, pin));
        query.on('row', function(row) {
            results.push(row);
        });

        query.on('end', function(row) {
		    client.end()
            if (results[0]) return onSucc(results[0]);
            return onErr({'status':'error', 'details':'invalid credentaials'});
        });
        query.on('error', function(error) {
            client.end();
            console.log(error);
            return onErr({'status':'error', 'details':'unknown error'});
        });
    });
};

var mutualFriends = function(user_id_a, user_id_b, onSucc, onErr) {
    user_id_a = numberify(user_id_a);
    user_id_b = numberify(user_id_b);
    results = [];
    pg.connect(connectionString, function(err, client, done) {
        var query = client.query('SELECT * FROM "PartySpot".friends WHERE status=\'mutual\' AND (partya = $1 AND partyb = $2 OR partya = $2 AND partyb = $1)',[user_id_a, user_id_b]);
        query.on('row', function(row) {
            results.push(row);
        });
        query.on('end', function(row) {
            client.end();
            if (results[0]) return onSucc();
            return onErr({'status':'error','details':'not friends'});
        });
        query.on('error', function(error) {
            client.end();
            console.log(error);
            return onErr({'status':'error', 'details':'unknown error'});
        });
    });
};


var requestSentFriends = function(user_id_a, user_id_b, onSucc, onErr) {
    user_id_a = numberify(user_id_a);
    user_id_b = numberify(user_id_b);
    results = [];
    pg.connect(connectionString, function(err, client, done) {
        var query = client.query('SELECT * FROM "PartySpot".friends WHERE status=\'pending\' AND partya = $1 AND partyb = $2)',[user_id_a, user_id_b]);
        query.on('row', function(row) {
            results.push(row);
        });
        query.on('end', function(row) {
            client.end();
            if (results[0]) return onSucc();
            return onErr({'status':'error','details':'no request sent'});
        });
        query.on('error', function(error) {
            client.end();
            console.log(error);
            return onErr({'status':'error', 'details':'unknown error'});
        });
    });
};


var requestRecievedFriends = function(user_id_a, user_id_b, onSucc, onErr) {
    user_id_a = numberify(user_id_a);
    user_id_b = numberify(user_id_b);
    results = [];
    pg.connect(connectionString, function(err, client, done) {
        var query = client.query('SELECT * FROM "PartySpot".friends WHERE status=\'pending\' AND partya = $1 AND partyb = $2',[user_id_b, user_id_a]);
        query.on('row', function(row) {
            results.push(row);
        });
        query.on('end', function(row) {
            client.end();
            if (results[0]) return onSucc();
            return onErr({'status':'error','details':'no request recived'});
        });
        query.on('error', function(error) {
            client.end();
            console.log(error);
            return onErr({'status':'error', 'details':'unknown error'});
        });
    });
};







router.put('/users', function(req, res) {
	var results = [];
	
	pg.connect(connectionString, function(err, client, done) {
		
		if (!(req.body.username && req.body.pin)) {
			console.log('POST ERROR! Insufficient data.', req.body);
			client.end()
			return res.status(400).json({'status': 'error', 
						    'details': 'Insufficient data'});
		}

		var query = client.query("SELECT * FROM create_user($1,$2)", 
						[req.body.username, 
						req.body.pin]
					);

		query.on('row', function(row) {
			results.push(row);
		});
		
		query.on('end', function(row) {
			console.log('POST success! Added user', req.body);
			client.end();
			return res.status(201).json({'status':'success',
						    'details':'user added'});
		});
		query.on('error', function(error) {
			console.log('POST ERROR! Possible repeat name');
			client.end();
			return res.status(500).json({'status':'error',
						    'details':'Possible repeat name'});
		});
		if(err) {
			console.log(err);
		}
	});
});

var findFavorites = function(user_id, results, onSuc){
	pg.connect(connectionString, function(err, client, done) {
		var favoriteQuery = client.query(format('SELECT * FROM "PartySpot".favorites WHERE user_id = ' + user_id));

		favoriteQuery.on('row', function(row) {
			results.favorites.push(row);
		});
		
		favoriteQuery.on('end', function(row) {
		    client.end()
            return onSuc(results);
		});


    });
}

var findFriends = function(user_id, results, onSuc){
	pg.connect(connectionString, function(err, client, done) {
		var friendQuery = client.query(format('SELECT * FROM "PartySpot".friends WHERE partyA = '+
                                                    user_id + ' OR partyB = ' + user_id));

		friendQuery.on('row', function(row) {
			if (row.status === 'mutual') {
                results.friends.mutual.push(row);
            }
            if (row.status === 'pending'){
                if (row.partya === user_id) {
                    results.friends.requested.push(row);
                } else {
                    results.friends.pending.push(row);
                }
            }
		});
		
		friendQuery.on('end', function(row) {
		    client.end()
            return findFavorites(user_id, results, onSuc);
		});
    });
};

var findMeetUps = function(user_id, results, onSuc){
	pg.connect(connectionString, function(err, client, done) {
        var meetUpQuery = client.query('SELECT * FROM "PartySpot".meets WHERE requestee = ' + user_id );

		meetUpQuery.on('row', function(row) {
			results.meets.push(row);
		});
		
		meetUpQuery.on('end', function(row) {
		    client.end()
            return findFriends(user_id, results, onSuc);
		});
    });
};

router.get('/users', function(req, res) {
	var results = {'meets':[], 'favorites':[], 'friends':{'mutual':[],'pending':[],'requested':[]}};
	
    validate(req, function(user) {
        findMeetUps(user.user_id, results, function() { 
            return res.status(200).json({'status':'success',
                                        'details':'data retrived',
                                           'user':user,
                                        'results':results}); 
        });
    }, function(err){
        return res.status(401).json(err);
    });
});



router.get('/locations', function(req, res) {
	var results = [];
	pg.connect(connectionString, function(err, client, done) {
		if (req.get('latitude') && req.get('longitude') && req.get('party')) {
			var lat = req.get('latitude');
			var lon = req.get('longitude');
			var party = req.get('party');
            var query;
            if (party === 'true') {
                query = client.query('SELECT * FROM "PartySpot". get_parties_nearest($1,$2)',[lat,lon]);
			} else {
			    query = client.query('SELECT * FROM "PartySpot". get_locations_nearest($1,$2)',[lat,lon]);
            }


			query.on('row', function(row) {
				results.push(row);
			});
			
			query.on('end', function(row) {
				console.log('GET success!');
				client.end();
				return res.status(200).json({'status':'success',
							    'details':'locations found',
							    'results':results});
			});

			query.on('error', function(error) {
				console.log('GET ERROR! Unknown cause');
				client.end();
				return res.status(500).json({'status':'error',
							    'details':'unknown'});
			});

			if(err) {
				console.log(err);
			}

		} else {
			client.end();
			console.log('GET ERROR! No headers.');
			return res.status(400).json({'status':'error',
						    'details':'No headers'});
		}
	});
});



router.get('/search/locations', function(req, res) {
	var results = [];
	pg.connect(connectionString, function(err, client, done) {
		if (req.get('phrase')) {
			var searchPhrase = req.get('phrase');
			
			var query = client.query('SELECT * FROM "PartySpot".search_locations($1)',[searchPhrase]);
			
			query.on('row', function(row) {
				results.push(row);
			});
			
			query.on('end', function(row) {
				console.log('GET success!');
				client.end();
				return res.status(200).json({'status':'success',
							    'details':'found matches',
							    'results': results});
			});

			query.on('error', function(error) {
				console.log('GET ERROR! Unknown cause');
				client.end();
				return res.status(500).json({'status':'error',
							    'details':'unknown'});
			});

			if(err) {
				console.log(err);
			}

		} else {
			client.end();
			console.log('GET ERROR! No headers.');
			return res.status(400).json({'status':'error',
						    'details':'No headers'});
		}
	});
});


router.put('/locations', function(req, res) {
	var results = [];
	
		
    if (!(req.body.name && req.body.latitude && req.body.longitude && req.body.party)) {
        console.log('PUT ERROR! Insufficient data.', req.body);
        client.end()
        return res.status(400).json({'status': 'error', 
                        'details': 'Insufficient data'});
    }

    validate(req, 
        function(user) {
            pg.connect(connectionString, function(err, client, done) {
                var query = client.query('SELECT * FROM "PartySpot".create_location($1,$2,$3,$4,$5)', 
                                [req.body.name, 
                                req.body.latitude,
                                req.body.longitude,
                                req.body.party,
                                req.body.logo_url ? req.body.logo_url : '']
                            );

                query.on('row', function(row) {
                    results.push(row);
                });
                
                query.on('end', function(row) {
                    console.log('POST success! Added location', req.body);
                    client.end();
                    return res.status(201).json({'status':'success',
                                    'details':'location added'});
                });
                query.on('error', function(error) {
                    console.log('Put ERROR! Possible repeat location');
                    client.end();
                    return res.status(500).json({'status':'error',
                                    'details':'Possible repeat location'});
                });
            })

        }, function(err) {
            return res.status(401).json(err)
        }
    );

});

router.put('/locations/:location_id', function(req, res) {
	var results = [];

	var id = req.params.location_id;

	var data = req.body.logo_url
	
	pg.connect(connectionString, function(err, client, done) {
		
		if (!(data)){
			console.log('PUT ERROR! Insufficient data.', req.body);
			return res.status(400).json({'status': 'error', 
						    'details': 'Insufficient data'});
		}

		var query = client.query("SELECT * FROM update_url($1,$2)", [data, id]);

		query.on('row', function(row) {
			results.push(row);
		});
		
		query.on('end', function(row) {
			console.log('PUT success! Updated URL');
			client.end();
			return res.status(200).json({'status':'success',
						    'details':'updated'});
		});
		if(err) {
			console.log(err);
		}
	});
});


router.get('/search/users', function(req, res) {
	var results = [];
    if (!req.get('phrase')) {
        client.end();
        console.log('GET ERROR! No headers.');
        return res.status(400).json({'status':'error',});
    }

    var searchPhrase = req.get('phrase');
    validate(req, 
        function(user) {	
            pg.connect(connectionString, 
                function(err, client, done) {
                    var query = client.query('SELECT * FROM search_user($1)',[searchPhrase]);
                    
                    query.on('row', function(row) {
                        results.push(row);
                    });
                    
                    query.on('end', function(row) {
                        console.log('GET success!');
                        client.end();
                        return res.status(200).json({'status':'success',
                                        'details':'found matches',
                                        'results': results});
                    });

                    query.on('error', function(error) {
                        console.log('GET ERROR! Unknown cause');
                        client.end();
                        return res.status(500).json({'status':'error',
                                        'details':'unknown'});
                    });
                }
            );
        }, function (err) {
            return res.status(401).json(err);
        }
    );
});

//Do not use
router.post('/users', function(req, res) {
	var results = [];
	
	pg.connect(connectionString, function(err, client, done) {
		
		if (!(req.body.username && req.body.latitude && req.body.longitude)) {
			console.log('POST ERROR! Insufficient data.', req.body);
			client.end()
			return res.status(400).json({'status': 'error', 
						    'details': 'Insufficient data'});
		}

		var query = client.query("SELECT * FROM create_user($1,$2,$3)", 
						[req.body.username, 
						req.body.latitude,
						req.body.longitude]);

		query.on('row', function(row) {
			results.push(row);
		});
		
		query.on('end', function(row) {
			console.log('POST success! Added person.', req.body);
			client.end();
			return res.status(201).json({'status':'success',
						    'details':'person added',
						   'location': results});
		});
		query.on('error', function(error) {
			console.log('POST ERROR! Possible repeat username');
			client.end();
			return res.status(500).json({'status':'error',
						    'details':'Possible repeat username'});
		});
		if(err) {
			console.log(err);
		}
	});
});

router.get('/users/:user_id', function(req, res) {
	var results = [];

	var id = req.params.user_id;
    validate(req, function(user){
        mutualFriends(user.user_id, id, function() {
            pg.connect(connectionString, function(err, client, done) {
                    
                var query = client.query('SELECT * FROM "PartySpot".get_user_location($1)', [id]);

                query.on('row', function(row) {
                    results.push(row);
                });
                
                query.on('end', function(row) {
                    console.log(results);
                    if (results[0].name) {
                        console.log('GET success! Found user.');
                        client.end();
                        return res.status(200).json({'status':'success',
                                        'details':'found',
                                        'results': results });
                    } else if (results){
                        console.log('GET ERROR! User no location');
                        client.end();
                        return res.status(404).json({'status':'error',
                                        'details':'user no location'});
                    } else {
                        console.log('GET ERROR! User not found');
                        client.end();
                        return res.status(404).json({'status':'error',
                                        'details':'user not found'});
                    }
                });
            })
        }, function(error) {
            return res.status(401).json(error);
        })
    }, function(error) {
        return res.status(401).json(error);
    });
});

router.put('/users/:user_id/favorites', function(req, res) {
    var id = parseInt(req.params.user_id,10);
    var target;  
    pg.connect(connectionString, function(err, client, done) {
        var idQuery = client.query('SELECT username FROM "PartySpot".people WHERE user_id =' + id)
        idQuery.on('row', function(row) {
            target = row.username;
        });
        idQuery.on('end', function(row) {
            if (target != req.get('username')) {
                return res.status(401).json({'status':'error','details':'cannot alter other user'});
            }
            validate(req, function(user) {
                var addFav = client.query('INSERT INTO "PartySpot".favorites (user_id,location_id) VALUES (' + user.user_id + ',' + req.get('location_id') + ')');
                addFav.on('end', function(row) {
                    client.end();
                    return res.status(201).json({'status':'success','details':'favorited location'});
                });
                addFav.on('error', function(row) {
                    client.end();
                    return res.status(500).json({'status':'error','details':'possible prevous fav'});
                });
            }, function (err) {
                client.end();
                return res.status(401).json(err);
            });
        });
    });
});


router.put('/users/:user_id/friends', function(req, res) {
    var id = parseInt(req.params.user_id,10);
    var target;  
    pg.connect(connectionString, function(err, client, done) {
        var idQuery = client.query('SELECT username FROM "PartySpot".people WHERE user_id =' + id)
        idQuery.on('row', function(row) {
            target = row.username;
        });
        idQuery.on('end', function(row) {
            if (target != req.get('username')) {
                return res.status(401).json({'status':'error','details':'cannot alter other user'});
            }
            validate(req, function(user) {
                requestRecievedFriends(user.user_id, req.get('requestee'), function() {
                    
                    var addFav = client.query('UPDATE "PartySpot".friends SET status=\'mutual\' WHERE partya = $1 and partyb = $2', [req.get('requestee'), user.user_id]);
                    addFav.on('end', function(row) {
                        client.end();
                        return res.status(201).json({'status':'success','details':'confirmed request'});
                    });
                    addFav.on('error', function(row) {
                        client.end();
                        return res.status(500).json({'status':'error','details':'unknown error'});
                    });
                    
                }, function(proceed){
                    var addFav = client.query('INSERT INTO "PartySpot".friends (partya,partyb, status) VALUES (' + user.user_id + ',' + req.get('requestee') + ',\'pending\')');
                    addFav.on('end', function(row) {
                        client.end();
                        return res.status(201).json({'status':'success','details':'request sent'});
                    });
                    addFav.on('error', function(row) {
                        client.end();
                        return res.status(500).json({'status':'error','details':'unknown error'});
                    });
                })
            }, function (err) {
                client.end();
                return res.status(401).json(err);
            });
        });
    });
});



router.delete('/users/:user_id/friends', function(req, res) {
    if (!req.get('req_id')) {
        return res.status(400).json({'status':'error','details':'no id to delete'});
    }
    pg.connect(connectionString, function(err, client, done) {
        validate(req, function(user) {
            var addFav = client.query('DELETE FROM "PartySpot".friends WHERE partya = $1 and partyb = $2', [parseInt(req.get('req_id'),10), user.user_id]);
            addFav.on('end', function(row) {
                client.end();
                return res.status(201).json({'status':'success','details':'request gone'});
            });
            addFav.on('error', function(row) {
                client.end();
                return res.status(500).json({'status':'error','details':'unknown error'});
            });
        }, function (err) {
            client.end();
            return res.status(401).json(err);
        });
    });
});



router.post('/users/:user_id/friends', function(req, res) {
    if (!req.get('req_id')) {
        return res.status(400).json({'status':'error','details':'no id to delete'});
    }
    pg.connect(connectionString, function(err, client, done) {
        validate(req, function(user) {
            var addFav = client.query('UPDATE "PartySpot".friends SET status=\'mutual\' WHERE partya = $1 and partyb = $2', [parseInt(req.get('req_id'),10), user.user_id]);
            addFav.on('end', function(row) {
                client.end();
                return res.status(201).json({'status':'success','details':'confirmed request'});
            });
            addFav.on('error', function(row) {
                client.end();
                return res.status(500).json({'status':'error','details':'unknown error'});
            });
        }, function (err) {
            client.end();
            return res.status(401).json(err);
        });
    });
});

router.post('/users/:user_id/requests', function(req, res) {
    if (!(req.body.name && req.body.deeplink)){
        return res.status(400).json({'status':'error','details':'insufficaint data'});
    }
    validate(req, 
        function(user) {
            mutualFriends(user.user_id, req.params.user_id, function() {
                pg.connect(connectionString, function(err, client, done) {
                    var query = client.query(format('INSERT INTO "PartySpot".meets VALUES (%L,%L,%L,%L);', 
                                    user.user_id, 
                                    parseInt(req.params.user_id,10),
                                    req.body.name,
                                    req.body.deeplink)
                                );

                    query.on('row', function(row) {
                        results.push(row);
                    });
                    
                    query.on('end', function(row) {
                        console.log('POST success! Invite sent!', req.body);
                        client.end();
                        return res.status(201).json({'status':'success',
                                        'details':'Invite Sent'});
                    });
                    query.on('error', function(error) {
                        console.log('Put ERROR! Unknown error', error);
                        client.end();
                        return res.status(500).json({'status':'error',
                                        'details':'Unknown error'});
                    });
                })}, function(err) {
                    return res.status(401).json(err);
                })

        }, function(err) {
            return res.status(401).json(err)
        }
    );

});
















module.exports = router;
