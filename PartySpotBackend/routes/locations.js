var auth = require('./authentication.js')
var express = require('express');
var router = express.Router();
var pg = require('pg');
var config = require('../config.js');
var connectionString = config.url;
var cleanser = require('./format.js');



router.get('/locations', function(req, res) {
	var results = [];

	if (!(req.get('latitude') && req.get('longitude') && req.get('party'))) {
			console.log('GET ERROR! No headers.');
			return res.status(400).json({'status':'error',
							'details':'No headers'});
		}

	pg.connect(connectionString, function(err, client, done) {
		var lat = req.get('latitude');
		var lon = req.get('longitude');
		var party = req.get('party');
		var query;
		if (party === 'true') {
			query = client.query('SELECT * FROM '+
													'"PartySpot".get_parties_nearest($1,$2)',[lat,lon]);
		} else {
			query = client.query('SELECT * FROM '+
												'"PartySpot".get_locations_nearest($1,$2)',[lat,lon]);
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
	});
});

router.put('/locations', function(req, res) {
	var results = [];


	if (!(req.body.name &&
		req.body.latitude &&
		req.body.longitude &&
		req.body.party)) {

		console.log('PUT ERROR! Insufficient data.', req.body);
		return res.status(400).json({'status': 'error',
						'details': 'Insufficient data'});
	}

	auth.validate(req,
		function(user) {
			pg.connect(connectionString, function(err, client, done) {
				var query = client.query('SELECT * FROM '+
																 '"PartySpot".create_location($1,$2,$3,$4,$5)',
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

	if (!(data)){
		console.log('PUT ERROR! Insufficient data.', req.body);
		return res.status(400).json({'status': 'error',
						'details': 'Insufficient data'});
	}

	auth.validate(req,
		function(user){
			pg.connect(connectionString, function(err, client, done) {
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

				query.on('error', function(error) {
					console.log('Put ERROR! unknown');
					client.end();
					return res.status(500).json({'status':'error',
									'details':'unknown'});
				});

			});
		}, function(error){
			return res.status(400).json(error);
		})

});

module.exports = router;
