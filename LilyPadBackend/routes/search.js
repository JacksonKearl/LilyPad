var auth = require('./authentication.js');
var express = require('express');
var router = express.Router();
var pg = require('pg');
var config = require('../config.js');
var connectionString = config.url;
var cleanser = require('./format.js');
var pgInterface = require('./postgres.js');


router.get('/locations', function(req, res) {

    var searchPhrase = req.get('phrase');

    if (!req.get('phrase')) {
            //console.log('GET ERROR! No headers.');
            return res.status(400).json({'status':'error',
                            			'details':'No headers'});
    }

    pgInterface.unauthenticated('SELECT * FROM lilypad.search_locations(\''+searchPhrase+'\')', req, res)
    .then(function (data) {
        return res.status(200).json({'status':'success',
                                    'details':'found matches',
                                    'results': data.result});
    })
    .catch(function (error) {
        return res.status(error.code).json({'status':error.status,
                                           'details':error.details});
    });

});


router.get('/users', function(req, res) {
    var results = [];
    var searchPhrase = req.get('phrase');

    if (!req.get('phrase')) {
        //console.log('GET ERROR! No headers.');
        return res.status(400).json({'status':'error',});
    }

    pgInterface.authenticated('SELECT * FROM lilypad.search_users(\''+searchPhrase+'\')', req, res)
    .then(function (data) {
        var results = [];
        for (var i = 0; i < data.result.length; i++) {
            results.push({user_id:data.result[i].user_id,
                         username:data.result[i].username});
        }
        return res.status(200).json({'status':'success',
                        'details':'found matches',
                        'results': results});
    })
    .catch(function (error) {
        return res.status(error.code).json({'status':error.status,
                                           'details':error.details});
    });
});

module.exports = router;
