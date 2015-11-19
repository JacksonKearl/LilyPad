/*jshint -W058 */

var bcrypt = require('bcrypt');
var pg = require('pg');
var config = require('../config.js');
var connectionString = config.url;
var secret = config.secret;
var cleanser = require('./format.js');
var jwt = require('jwt-simple');

auth = {};

auth.validate = function(req, onSucc, onErr) {

    if (!(req.get('username') && req.get('pin') || req.get('token'))) {
        //console.log('GET ERROR! Insufficient data.', req.body);
        return onErr({'status': 'error', 'details': 'Insufficient data'});
    }

    var name = req.get('username');
    var pin  = req.get('pin');


    var results = [];
    pg.connect(connectionString, function(err, client, done){
    var query = client.query(cleanser('SELECT * FROM lilypad.people '+
                                                ' WHERE username = %L',name));
        query.on('row', function(row) {
            results.push(row);
        });

        query.on('end', function(row) {
            client.end();

      if (!results[0]){
              return onErr({'status':'error', 'details':'invalid username'});
      }
      if (req.get('token')) {
        try {
          var decoded = jwt.decode(req.get('token'), secret);
          var curDaysSinceEpoch = Math.floor((new Date).getTime()/(1000*60*60*24));
          var timeIsValid = decoded.expires > curDaysSinceEpoch;
          //console.log(decoded, curDaysSinceEpoch);
          if (decoded.user == name && timeIsValid) {
            results[0].pin = null;
            return onSucc(results[0]);
          }
        }
        catch (err) {
          //console.log(err);
        }
      } else {
        var response = {'expires':Math.floor((new Date).getTime()/(1000*60*60*24))+3,
                           'user':results[0].username};


        results[0].token = jwt.encode(response, secret);
      }
      bcrypt.compare(pin, results[0].pin, function(err, res) {
        if (err) {
          return onErr({'status':'error', 'details':'some bcrypt error'});
        }
        if (res) {
          results[0].pin = null;
          return onSucc(results[0]);
        }
          return onErr({'status':'error', 'details':'invalid password'});
                });
        });
        query.on('error', function(error) {
            client.end();
            //console.log(error);
            return onErr({'status':'error', 'details':'unknown error'});
        });
    });
};

auth.mutualFriends = function(user_id_a, user_id_b, onYes, onNo) {
    user_id_a = cleanser.numberify(user_id_a);
    user_id_b = cleanser.numberify(user_id_b);
    results = [];
    pg.connect(connectionString, function(err, client, done) {
        var query = client.query('SELECT * FROM lilypad.friends WHERE '+
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
            //console.log(error);
            return onNo({'status':'error', 'details':'unknown error'});
        });
    });
};


auth.requestSentFriends = function(user_id_a, user_id_b, onYes, onNo) {
    user_id_a = cleanser.numberify(user_id_a);
    user_id_b = cleanser.numberify(user_id_b);
    results = [];
    pg.connect(connectionString, function(err, client, done) {
        var query = client.query('SELECT * FROM lilypad.friends WHERE '+
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
            //console.log(error);
            return onNo({'status':'error', 'details':'unknown error'});
        });
    });
};


auth.requestRecievedFriends = function(user_id_a, user_id_b, onYes, onNo) {
    user_id_a = cleanser.numberify(user_id_a);
    user_id_b = cleanser.numberify(user_id_b);
    results = [];
    pg.connect(connectionString, function(err, client, done) {
        var query = client.query('SELECT * FROM lilypad.friends WHERE '+
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
            //console.log(error);
            return onNo({'status':'error', 'details':'unknown error'});
        });
    });
};

module.exports = auth;
