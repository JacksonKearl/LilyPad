/*jshint -W058 */
var auth = require('./authentication.js');
var express = require('express');
var router = express.Router();
var pg = require('pg');
var config = require('../config.js');
var connectionString = config.url;
var cleanser = require('./format.js');
var pgInterface = require('./postgres.js');


router.get('/', function(req, res) {
    var results = [];

    if (!(req.get('latitude') && req.get('longitude') && req.get('party'))) {
            //console.log('GET ERROR! No headers.');
            return res.status(400).json({'status':'error',
                            'details':'No headers'});
        }

    var lat = req.get('latitude');
    var lon = req.get('longitude');
    var party = req.get('party');
    var query;
    if (party === 'true') {
        query = 'SELECT * FROM lilypad.get_parties_nearest('+lat+','+lon+')';
    } else {
        query = 'SELECT * FROM lilypad.get_locations_nearest('+lat+','+lon+')';
    }

    pgInterface.unauthenticated(query, req, res)
    .then(function (data) {
        return res.status(200).json({'status':'success',
                        'details':'locations found',
                        'results':data.result});
    })
    .catch(function (error) {
        return res.status(error.code).json({'status':error.status,
                                           'details':error.details});
    });
});

router.put('/', function(req, res) {
    var results = [];


    if (!(req.body.name &&
        req.body.latitude &&
        req.body.longitude &&
        req.body.party)) {

        //console.log('PUT ERROR! Insufficient data.', req.body);
        return res.status(400).json({'status': 'error',
                        'details': 'Insufficient data'});
    }

    pgInterface.authenticated(cleanser('SELECT * FROM lilypad.create_location(%L,%L,%L,%L,%L)', req.body.name, req.body.latitude, req.body.longitude, req.body.party, req.body.logo_url ? req.body.logo_url : ''), req,res)
    .then(function () {
        return res.status(201).json({'status':'success',
                                    'details':'location added'});
    })
    .catch(function (error) {
        return res.status(error.code).json({'status':error.status,
                                           'details':error.details});
    });
});


router.patch('/:location_id', function(req, res) {
    var results = [];

    var id = req.params.location_id;

    var data = req.body.logo_url;

    if (!(data)){
        //console.log('PUT ERROR! Insufficient data.', req.body);
        return res.status(400).json({'status': 'error',
                        'details': 'Insufficient data'});
    }

    pgInterface.authenticated(cleanser('SELECT * FROM lilypad.update_url(%L,%L)',data, id), req, res)
    .then(function () {
        return res.status(200).json({'status':'success',
                        'details':'updated'});
    })
    .catch(function (error) {
        return res.status(error.code).json({'status':error.status,
                                           'details':error.details});
    });
});

router.delete('/alldata', function(req, res) {
    var key = req.get('key');
    if (key !== config.secret) {
        return res.status(401).json({'status':'error',
                        'details':'unauthorized'});
    }

    pgInterface.unauthenticated("SELECT * FROM lilypad.reset()", req, res)
    .then(function () {
        return res.status(200).json({'status':'success',
                                    'details':'deleted'});
    })
    .catch(function (error) {
        return res.status(500).json({'status':'error',
                                    'details':'unknown'});
    });
});


module.exports = router;
