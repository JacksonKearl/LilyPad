var bcrypt = require('bcrypt');
var pg = require('pg');
var config = require('../config.js');
var connectionString = config.url;
var cleanser = require('./format.js');


auth = {};

auth.validate = function(req, onSucc, onErr) {

	if (!(req.get('username') && req.get('pin'))) {
		console.log('GET ERROR! Insufficient data.', req.body);
		return onErr({'status': 'error', 'details': 'Insufficient data'});
	}

	var name = req.get('username');
	var pin  = req.get('pin');

	if (req.get('token')) {
		try {
	  	var decoded = jwt.decode(jwt.encode(payload, 'badSecret'), secret);
			var curDaysSinceEpoch = Math.floor((new Date).getTime()/(1000*60*60*24));
			var timeIsValid = decoded.expires <= curDaysSinceEpoch;
			if (decoded.user == name && timeIsValid) {
				return onSucc();
			}
		}
		catch (err) {

		}
	}


	var results = []
	pg.connect(connectionString, function(err, client, done){
		var query = client.query(format('SELECT * FROM "PartySpot".people '+
																						' WHERE username = %L',name));
		query.on('row', function(row) {
			results.push(row);
		});

		query.on('end', function(row) {
			client.end()
			if (results[0]) {
				bcrypt.compare(pin, results[0].pin, function(err, res) {
					if (err) {
						return onErr({'status':'error', 'details':'some bcrypt error'});
					}
					if (res) {
						return onSucc();
					}
					return onErr({'status':'error', 'details':'invalid password'})
				});
      }
			return onErr({'status':'error', 'details':'invalid username'});
		});
		query.on('error', function(error) {
			client.end();
			console.log(error);
			return onErr({'status':'error', 'details':'unknown error'});
		});
	});
};

auth.mutualFriends = function(user_id_a, user_id_b, onYes, onNo) {
	user_id_a = cleanser.numberify(user_id_a);
	user_id_b = cleanser.numberify(user_id_b);
	results = [];
	pg.connect(connectionString, function(err, client, done) {
		var query = client.query('SELECT * FROM "PartySpot".friends WHERE '+
								' status=\'mutual\' AND '+
								'(partya = $1 AND partyb = $2 OR partya = $2 AND partyb = $1)',
								[user_id_a, user_id_b]);

		query.on('row', function(row) {
			results.push(row);
		});
		query.on('end', function(row) {
			client.end();
			if (results[0]) return onYes();
			return onNo({'status':'error','details':'not friends'});
		});
		query.on('error', function(error) {
			client.end();
			console.log(error);
			return onNo({'status':'error', 'details':'unknown error'});
		});
	});
};


auth.requestSentFriends = function(user_id_a, user_id_b, onYes, onNo) {
	user_id_a = cleanser.numberify(user_id_a);
	user_id_b = cleanser.numberify(user_id_b);
	results = [];
	pg.connect(connectionString, function(err, client, done) {
		var query = client.query('SELECT * FROM "PartySpot".friends WHERE '+
												' status=\'pending\' AND partya = $1 AND partyb = $2)',
												[user_id_a, user_id_b]);
		query.on('row', function(row) {
			results.push(row);
		});
		query.on('end', function(row) {
			client.end();
			if (results[0]) return onYes();
			return onNo({'status':'error','details':'no request sent'});
		});
		query.on('error', function(error) {
			client.end();
			console.log(error);
			return onNo({'status':'error', 'details':'unknown error'});
		});
	});
};


auth.requestRecievedFriends = function(user_id_a, user_id_b, onYes, onNo) {
	user_id_a = cleanser.numberify(user_id_a);
	user_id_b = cleanser.numberify(user_id_b);
	results = [];
	pg.connect(connectionString, function(err, client, done) {
		var query = client.query('SELECT * FROM "PartySpot".friends WHERE '+
									' status=\'pending\' AND partya = $1 AND partyb = $2',
									[user_id_b, user_id_a]);

		query.on('row', function(row) {
			results.push(row);
		});
		query.on('end', function(row) {
			client.end();
			if (results[0]) return onYes();
			return onNo({'status':'error','details':'no request recived'});
		});
		query.on('error', function(error) {
			client.end();
			console.log(error);
			return onNo({'status':'error', 'details':'unknown error'});
		});
	});
};

module.exports = auth;
