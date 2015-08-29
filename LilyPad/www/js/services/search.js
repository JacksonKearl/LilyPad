
  angular.module("lilypad.services")

  .factory('SearchFactory', function($http, appConfig) {
    var factory = {};

    factory.searchLocations = function(phrase) {
      var url = appConfig.baseUrl + '/search/locations';
      var req = {
        'method' :'GET',
        'url'    : url,
        'headers': { 'phrase' : phrase }
      };
      return $http(req);
    };

    factory.searchUsers = function(phrase) {
      var url = appConfig.baseUrl + '/search/users';
      var req = {
        'method' :'GET',
        'url'    : url,
        'headers': { 'phrase' : phrase }
      };
      return $http(req);
    };

    return factory;

  })
