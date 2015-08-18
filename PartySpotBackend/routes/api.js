var express = require('express');
var assert  = require('assert');
var router = express.Router();
var pg = require('pg');
var connectionString = 'postgres://uadmin:null@localhost:5432/uadmin?ssl=true';


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('Root API directory');
});

router.get('/locations', function(req, res) {
	var results = [];
	pg.connect(connectionString, function(err, client, done) {
		if (req.get('latitude') && req.get('longitude')) {
			var lat = req.get('latitude');
			var lon = req.get('longitude');
			
			var query = client.query('SELECT * FROM get_locations_nearest($1,$2)',[lat,lon]);
			
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


router.post('/locations', function(req, res) {
	var results = [];
	
	pg.connect(connectionString, function(err, client, done) {
		
		if (!(req.body.name && req.body.latitude && req.body.longitude)) {
			console.log('POST ERROR! Insufficient data.', req.body);
			client.end()
			return res.status(400).json({'status': 'error', 
						    'details': 'Insufficient data'});
		}

		var query = client.query("SELECT * FROM create_location($1,$2,$3,$4)", 
						[req.body.name, 
						req.body.latitude,
						req.body.longitude,
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
			console.log('POST ERROR! Possible repeat location');
			client.end();
			return res.status(500).json({'status':'error',
						    'details':'Possible repeat location'});
		});
		if(err) {
			console.log(err);
		}
	});
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


router.get('/people', function(req, res) {
	var results = [];
	pg.connect(connectionString, function(err, client, done) {
		if (req.get('phrase')) {
			var searchPhrase = req.get('phrase');
			
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


router.post('/people', function(req, res) {
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

router.get('/people/:user_id', function(req, res) {
	var results = [];

	var id = req.params.user_id;

	pg.connect(connectionString, function(err, client, done) {
		
		var query = client.query("SELECT * FROM get_user_location($1)", [id]);

		query.on('row', function(row) {
			results.push(row);
		});
		
		query.on('end', function(row) {
			if (results[0].name) {
				console.log('GET success! Found user.');
				client.end();
				return res.status(200).json({'status':'success',
							    'details':'found',
							    'results': results });
			} else {
				console.log('GET ERROR! User not found');
				client.end();
				return res.status(404).json({'status':'error',
							    'details':'user not found'});
			}
		});
		if(err) {
			console.log(err);
		}
	});
});



module.exports = router;
