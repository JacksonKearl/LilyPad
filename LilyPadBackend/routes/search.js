var auth = require('./authentication.js');
var express = require('express');
var router = express.Router();
var pg = require('pg');
var config = require('../config.js');
var connectionString = config.url;
var cleanser = require('./format.js');


router.get('/locations', function(req, res) {
    var results = [];

    if (!req.get('phrase')) {
            console.log('GET ERROR! No headers.');
            return res.status(400).json({'status':'error',
                            			'details':'No headers'});
    }

    pg.connect(connectionString, function(err, client, done) {
        var searchPhrase = req.get('phrase');

        var query = client.query('SELECT * FROM lilypad.search_locations($1)', [searchPhrase]);

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
    });
});


router.get('/users', function(req, res) {
    var results = [];
    if (!req.get('phrase')) {
        console.log('GET ERROR! No headers.');
        return res.status(400).json({'status':'error',});
    }

    var searchPhrase = req.get('phrase');
    auth.validate(req,
        function(user) {
            pg.connect(connectionString,
                function(err, client, done) {
                    var query = client.query('SELECT * FROM lilypad.search_users($1)', [searchPhrase]);

                    query.on('row', function(row) {
                        results.push({'user_id':row.user_id, 'username':row.username});
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

module.exports = router;
