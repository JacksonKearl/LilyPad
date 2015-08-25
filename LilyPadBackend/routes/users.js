var auth = require('./authentication.js')
var express = require('express');
var router = express.Router();
var pg = require('pg');
var config = require('../config.js');
var connectionString = config.url;
var cleanser = require('./format.js');
var bcrypt = require('bcrypt');
var jwt = require('jwt-simple');


router.put('/', function(req, res) {
	var results = [];

	if (!(req.get('username') && req.get('pin'))) {
		console.log('PUT ERROR! Insufficient data.', req.body);
		return res.status(400).json({'status': 'error',
						'details': 'Insufficient data'});
	}

	pg.connect(connectionString, function(err, client, done) {


    var pin = req.get('pin');

	  bcrypt.hash(pin, 13, function(err, hash) {
			if (err) {
				return res.status(500).json({'status':'error',
								'details':'bcrypt error'});
			}
			var query = client.query('SELECT * FROM lilypad.create_user($1,$2)',
							[req.get('username'),
							hash,]
						);

			query.on('row', function(row) {
				results.push(row);
			});

			query.on('end', function(row) {
				console.log('POST success! Added user', req.body);
				client.end();
				var curDaysSinceEpoch = Math.floor((new Date).
																			getTime()/(1000*60*60*24));
				var expireDaysSinceEpoch = curDaysSinceEpoch + 3;
				var payload = {'user': req.get('username'),
										'expires': expireDaysSinceEpoch};
				var token = jwt.encode(payload, config.secret);

				return res.status(201).json({'status':'success',
																		'details':'user added',
																			'token':token});
			});
			query.on('error', function(error) {

				console.log('PUT ERROR! Possible repeat name', error);
				client.end();
				return res.status(500).json({'status':'error',
								'details':'Possible repeat name'});
			});
		});
	});
});

var findFavorites = function(user_id, results, onSuc){
	pg.connect(connectionString, function(err, client, done) {
		var favoriteQuery = client.query('SELECT * FROM lilypad.favorites ' +
																							'WHERE user_id = ' + user_id);

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
		var friendQuery = client.query('SELECT * FROM lilypad.friends ' +
																						'WHERE partyA = ' + user_id +
																						' OR partyB = ' + user_id);

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
		var meetUpQuery = client.query('SELECT * FROM lilypad.meets ' +
																					' WHERE requestee = ' + user_id );

		meetUpQuery.on('row', function(row) {
			results.meets.push(row);
		});

		meetUpQuery.on('end', function(row) {
			client.end()
			return findFriends(user_id, results, onSuc);
		});
	});
};


router.get('/', function(req, res) {
	var results = {'meets':[],
						 'favorites':[],
							 'friends':{'mutual':[],
												 'pending':[],
											 'requested':[]}
								};

	auth.validate(req, function(user) {
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


router.patch('/', function(req, res) {
	if (!req.get('location_id')) {
		return res.status(400).json({'status':'error','details':'no location to join'});
	}
	pg.connect(connectionString, function(err, client, done) {
		auth.validate(req, function(user) {

			var addFav = client.query('UPDATE lilypad.people SET last_location=$1 '+
																					' WHERE user_id = $2',
																					[cleanser.numberify(req.get('location_id')),
																					user.user_id]);

			addFav.on('end', function(row) {
				client.end();
				return res.status(201).json({'status':'success',
																		'details':'location set'});
			});
			addFav.on('error', function(row) {
				client.end();
				return res.status(500).json({'status':'error',
																		'details':'unknown error'});
			});
		}, function (err) {
			client.end();
			return res.status(401).json(err);
		});
	});
});




router.get('/:user_id', function(req, res) {
	var results = [];

	var id = req.params.user_id;
	auth.validate(req, function(user){
		mutualFriends(user.user_id, id, function() {
			pg.connect(connectionString, function(err, client, done) {

				var query = client.query('SELECT * FROM ' +
																	'lilypad.get_user_location($1)', [id]);

				query.on('row', function(row) {
					results.push(row);
				});

				query.on('error', function(row) {
					client.end();
					return res.status(500).json({'status':'error',
																			'details':'unknown error'});
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

router.put('/:user_id/favorites', function(req, res) {
	var id = parseInt(req.params.user_id,10);
	var target;

	if(!(req.get('username') && req.get('location_id'))) {
		return res.status(500).json({'status':'error',
																'details':'no headers'});
	}

	pg.connect(connectionString, function(err, client, done) {
		var idQuery = client.query('SELECT username FROM lilypad.people WHERE '+
																														'user_id =' + id);
		idQuery.on('row', function(row) {
			target = row.username;
		});
		idQuery.on('end', function(row) {
			if (target != req.get('username')) {
				return res.status(401).json({'status':'error',
																		'details':'cannot alter other user'});
			}
			auth.validate(req, function(user) {
				var addFav = client.query('INSERT INTO lilypad.favorites '+
																				'(user_id,location_id) VALUES '+
																				'(' + user.user_id +
																				',' + req.get('location_id') +
																				')');
				addFav.on('end', function(row) {
					client.end();
					return res.status(201).json({'status':'success',
																			'details':'favorited location'});
				});
				addFav.on('error', function(row) {
					client.end();
					return res.status(500).json({'status':'error',
																			'details':'possible prevous fav'});
				});
			}, function (err) {
				client.end();
				return res.status(401).json(err);
			});
		});
	});
});


router.put('/:user_id/friends', function(req, res) {
	var id = parseInt(req.params.user_id,10);
	var target;

	if(!(req.get('username') && req.get('user_id'))) {
		return res.status(500).json({'status':'error',
																'details':'no headers'});
	}

	pg.connect(connectionString, function(err, client, done) {
		var idQuery = client.query('SELECT username FROM lilypad.people '+
																												'WHERE user_id =' + id);
		idQuery.on('row', function(row) {
			target = row.username;
		});
		idQuery.on('end', function(row) {
			if (target != req.get('username')) {
				return res.status(401).json({'status':'error',
																		'details':'cannot alter other user'});
			}
			auth.validate(req, function(user) {
				auth.requestRecievedFriends(user.user_id, req.get('user_id'),
																																	function() {
					var addFav = client.query('UPDATE lilypad.friends SET '+
												' status=\'mutual\' WHERE partya = $1 and partyb = $2',
												[req.get('user_id'), user.user_id]);
					addFav.on('end', function(row) {
						client.end();
						return res.status(201).json({'status':'success',
																				'details':'confirmed request'});
					});
					addFav.on('error', function(row) {
						client.end();
						return res.status(500).json({'status':'error',
																				'details':'unknown error'});
					});

				}, function(proceed){
					var addFav = client.query('INSERT INTO lilypad.friends '+
																		'(partya,partyb, status) VALUES ('+
																		user.user_id + ',' + req.get('user_id') +
																		',\'pending\')');

					addFav.on('end', function(row) {
						client.end();
						return res.status(201).json({'status':'success',
																				'details':'request sent'});
					});
					addFav.on('error', function(row) {
						client.end();
						return res.status(500).json({'status':'error',
																				'details':'unknown error'});
					});
				})
			}, function (err) {
				client.end();
				return res.status(401).json(err);
			});
		});
	});
});



router.delete('/:user_id/friends', function(req, res) {
	if (!req.get('req_id')) {
		return res.status(400).json({'status':'error','details':'no id to delete'});
	}
	pg.connect(connectionString, function(err, client, done) {
		auth.validate(req, function(user) {
			var addFav = client.query('DELETE FROM lilypad.friends '+
																					' WHERE partya = $1 and partyb = $2',
																					[parseInt(req.get('req_id'),10),
																					user.user_id]);

			addFav.on('end', function(row) {
				client.end();
				return res.status(201).json({'status':'success',
																		'details':'request gone'});
			});
			addFav.on('error', function(row) {
				client.end();
				return res.status(500).json({'status':'error',
																		'details':'unknown error'});
			});
		}, function (err) {
			client.end();
			return res.status(401).json(err);
		});
	});
});



router.post('/:user_id/friends', function(req, res) {
	if (!req.get('req_id')) {
		return res.status(400).json({'status':'error','details':'no id to confirm'});
	}
	pg.connect(connectionString, function(err, client, done) {
		auth.validate(req, function(user) {
			var addFav = client.query('UPDATE lilypad.friends '+
										' SET status=\'mutual\' WHERE partya = $1 and partyb = $2',
										 [parseInt(req.get('req_id'),10), user.user_id]);
			addFav.on('end', function(row) {
				client.end();
				return res.status(201).json({'status':'success',
																		'details':'confirmed request'});
			});
			addFav.on('error', function(row) {
				client.end();
				return res.status(500).json({'status':'error',
																		'details':'unknown error'});
			});
		}, function (err) {
			client.end();
			return res.status(401).json(err);
		});
	});
});

router.post('/:user_id/requests', function(req, res) {
	if (!(req.body.name && req.body.deeplink)){
		return res.status(400).json({'status':'error',
																'details':'insufficaint data'});
	}
	auth.validate(req,
		function(user) {
			auth.mutualFriends(user.user_id, req.params.user_id, function() {
				pg.connect(connectionString, function(err, client, done) {
					var query = client.query(cleanser(
						'INSERT INTO lilypad.meets VALUES (%L,%L,%L,%L);',
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


router.delete('/:user_id/requests', function(req, res) {
	auth.validate(req,
		function(user) {
			auth.mutualFriends(user.user_id, req.params.user_id, function() {
				pg.connect(connectionString, function(err, client, done) {
					console.log(cleanser(
						'DELETE FROM lilypad.meets WHERE requester = %s AND requestee = %s AND name = %L;',
									user.user_id,
									parseInt(req.params.user_id,10),
                  req.get('location_name')
								));


          var query = client.query(cleanser(
						'DELETE FROM lilypad.meets WHERE requester = %s AND requestee = %s AND name = %L;',
									parseInt(req.params.user_id,10),
                  user.user_id,
                  req.get('location_name')
								));

					query.on('row', function(row) {
						results.push(row);
					});

					query.on('end', function(row) {
						console.log('POST success! Invite sent!', req.body);
						client.end();
						return res.status(201).json({'status':'success',
										'details':'Invite Deleted'});
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
