angular.module("lilypad.services")

.factory('UserFactory', function($http, appConfig) {
    var factory = {};


    factory.makeUser = function() {
        var url = appConfig.baseUrl + '/users';
        var req = {
            'method' :'PUT',
            'url'    : url,
        };
        return $http(req);
    };

    factory.getUser = function(userData) {
        $http.defaults.headers.common = userData;

        var url = appConfig.baseUrl + '/users';
        var req = {
            'method' :'GET',
            'url'    : url,
            //'headers': {'username' : userData.username, 'pin' : userData.pin}

        };
        return $http(req);
    };

    factory.placeUser = function(location_id) {
        var url = appConfig.baseUrl + '/users';
        var req = {
            'method' :'PATCH',
            'url'    : url,
            'headers': {'location_id' : location_id}
        };
        return $http(req);
    };

    factory.favoriteLocation = function(location_id) {
        var url = appConfig.baseUrl + '/users/favorites';
        var req = {
            'method' :'PUT',
            'url'    : url,
            'headers': {'location_id' : location_id}
        };
        return $http(req);
    };

    factory.requestFriend = function(user_id) {
        var url = appConfig.baseUrl + '/users/' + user_id + '/friends';
        var req = {
            'method' :'PUT',
            'url'    : url,
        };
        return $http(req);
    };

    factory.acceptFriend = function(user_id) {
        var url = appConfig.baseUrl + '/users/' + user_id + '/friends';
        var req = {
            'method' :'PATCH',
            'url'    : url,
        };
        return $http(req);
    };

    factory.rejectFriend = function(user_id) {
        var url = appConfig.baseUrl + '/users/' + user_id + '/friends';
        var req = {
            'method' :'DELETE',
            'url'    : url,
        };
        return $http(req);
    };

    factory.sendMeet = function(user_id, meetInfo) {
        var url = appConfig.baseUrl + '/users/' + user_id + '/meets';
        var req = {
            'method' :'POST',
            'url'    : url,
            'data'   : meetInfo
        };
        return $http(req);
    };

    factory.deleteMeet = function(user_id, meetInfo) {
        var url = appConfig.baseUrl + '/users/' + user_id + '/meets';
        var req = {
            'method' :'DELETE',
            'url'    : url,
            'headers': meetInfo
        };
        return $http(req);
    };

    factory.getFriendInfo = function(user_id) {
        var url = appConfig.baseUrl + '/users/' + user_id;
        var req = {
            'method' :'GET',
            'url'    : url
        };
        return $http(req);
    };
    return factory;
});
