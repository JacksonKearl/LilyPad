  angular.module("lilypad.services")

  .factory('LocationFactory', function($http, appConfig) {
    var factory = {};

    factory.getLocations = function(latitude, longitude, party) {
      var url = appConfig.baseUrl + '/locations';
      var req = {
        'method' :'GET',
        'url'    : url,
        'headers': {
          'latitude'  : latitude,
          'longitude' : longitude,
          'party'     : party}
        };
        return $http(req);
    };

    factory.addLocation = function(locationInfo) {
      var url = appConfig.baseUrl + '/locations';
      var req = {
        'method':'PUT',
        'url'   : url,
        'data'  : locationInfo
      };
      return $http(req);
    };

    factory.addLocation = function(locationId, newURL) {
      var url = appConfig.baseUrl + '/locations/' + locationId;
      var req = {
        'method':'PATCH',
        'url'   : url,
        'data'  : {'logo_url':newURL}
      };
      return $http(req);
    };

    return factory;
  })
