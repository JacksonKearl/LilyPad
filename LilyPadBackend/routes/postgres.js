/*jshint -W058 */

/*
*  Handle all user connections to the postgres database.
*     manges input cleansing and error handling
*  Promise based design
*/

var auth = require('./authentication.js');
var express = require('express');
var router = express.Router();
var pg = require('pg');
var config = require('../config.js');
var connectionString = config.url;
var cleanser = require('./format.js');
var bcrypt = require('bcrypt');
var jwt = require('jwt-simple');
var Q = require('q');

var postgres_interface = {};


postgres_interface.authenticated = function(query, req, res) {
    var deferred = Q.defer();

    if (!(req.get('username') && (req.get('pin') || req.get('token')))) {
        deferred.reject(
            {'code': 400, 'status':'error','details':'Insufficient Data'}
        );
        return deferred.promise;
    }

    auth.validate(req, function (user) {
        pg.connect(connectionString, function(err, client, done) {

            var to_evaluate = client.query(cleanser(query.replace(/\[user_id\]/g, user.user_id)));
            var result = [];
            to_evaluate.on('row', function(row) {
                result.push(row);
            });

            to_evaluate.on('end', function() {
                done();
                deferred.resolve({result:result, user:user});
            });

            to_evaluate.on('error', function(error) {
                done();
                console.log(error);
                deferred.reject(
                    {'code': 500, 'status':'error','details':'Internal Error'}

                );
            });
        });
    }, function (error) {
        deferred.reject(
            {'code': 401, 'status':'error','details':'Not Authenticated'}
        );
    });
    return deferred.promise;
};

postgres_interface.unauthenticated = function(query, req, res, user) {
    var deferred = Q.defer();
    pg.connect(connectionString, function(err, client, done) {
        var to_evaluate;

        if (user) {
            to_evaluate = client.query(cleanser(query.replace(/\[user_id\]/g, user.user_id)));

        } else {
            to_evaluate = client.query(query);
        }

        result = [];
        to_evaluate.on('row', function(row) {
            result.push(row);
        });

        to_evaluate.on('end', function() {
            done();
            deferred.resolve({result:result});
        });

        to_evaluate.on('error', function(error) {
            done();
            console.log(error);
            deferred.reject(
                {'code': 500, 'status':'error','details':'Internal Error'}
            );
        });
    });
    return deferred.promise;
};

postgres_interface.friends = function(query, req, res, friend_id) {
    var deferred = Q.defer();

    if (!(req.get('username') && (req.get('pin') || req.get('token')))) {
        deferred.reject(
            {'code': 400, 'status':'error','details':'Insufficient Data'}
        );
        return deferred.promise;
    }

    auth.validate(req, function (user) {
        auth.mutualFriends(user.user_id, friend_id, function() {
            pg.connect(connectionString, function(err, client, done) {
                var to_evaluate = client.query(cleanser(query.replace(/\[user_id\]/g, user.user_id)));
                var result = [];
                to_evaluate.on('row', function(row) {
                    result.push(row);
                });

                to_evaluate.on('end', function() {
                    done();
                    deferred.resolve({result:result, user:user});
                });

                to_evaluate.on('error', function(error) {
                    console.log(error);
                    done();
                    deferred.reject(
                        {'code': 500, 'status':'error','details':'Internal Error'}

                    );
                });
            });
        }, function () {
            deferred.reject(
                {'code': 401, 'status':'error','details':'Not Friends'}
            );
        });
    }, function (error) {
        deferred.reject(
            {'code': 401, 'status':'error','details':'Not Authenticated'}
        );
    });
    return deferred.promise;
};


module.exports = postgres_interface;
