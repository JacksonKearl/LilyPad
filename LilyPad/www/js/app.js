/**
* ==================  angular-ios9-uiwebview.patch.js v1.1.1 ==================
*
* This patch works around iOS9 UIWebView regression that causes infinite digest
* errors in Angular.
*
* The patch can be applied to Angular 1.2.0 – 1.4.5. Newer versions of Angular
* have the workaround baked in.
*
* To apply this patch load/bundle this file with your application and add a
* dependency on the "ngIOS9UIWebViewPatch" module to your main app module.
*
* For example:
*
* ```
* angular.module('myApp', ['ngRoute'])`
* ```
*
* becomes
*
* ```
* angular.module('myApp', ['ngRoute', 'ngIOS9UIWebViewPatch'])
* ```
*
*
* More info:
* - https://openradar.appspot.com/22186109
* - https://github.com/angular/angular.js/issues/12241
* - https://github.com/driftyco/ionic/issues/4082
*
*
* @license AngularJS
* (c) 2010-2015 Google, Inc. http://angularjs.org
* License: MIT
*/

angular.module('ngIOS9UIWebViewPatch', ['ng']).config(['$provide', function($provide) {
    'use strict';

    $provide.decorator('$browser', ['$delegate', '$window', function($delegate, $window) {

        if (isIOS9UIWebView($window.navigator.userAgent)) {
            return applyIOS9Shim($delegate);
        }

        return $delegate;

        function isIOS9UIWebView(userAgent) {
            return /(iPhone|iPad|iPod).* OS 9_\d/.test(userAgent) && !/Version\/9\./.test(userAgent);
        }

        function applyIOS9Shim(browser) {
            var pendingLocationUrl = null;
            var originalUrlFn= browser.url;

            browser.url = function() {
                if (arguments.length) {
                    pendingLocationUrl = arguments[0];
                    return originalUrlFn.apply(browser, arguments);
                }

                return pendingLocationUrl || originalUrlFn.apply(browser, arguments);
            };

            window.addEventListener('popstate', clearPendingLocationUrl, false);
            window.addEventListener('hashchange', clearPendingLocationUrl, false);

            function clearPendingLocationUrl() {
                pendingLocationUrl = null;
            }

            return browser;
        }
    }]);
}]);

// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('lilypad', ['ionic', 'lilypad.services', 'lilypad.controllers', 'ngIOS9UIWebViewPatch'])

.factory('appConfig', function() {
    return {
        'baseUrl': 'http://jkearl.ddns.net:3000',
    };
})


.run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);

        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }
    });
})


.config(function($stateProvider, $urlRouterProvider, $httpProvider) {

  $stateProvider

    .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  .state('app.search', {
    url: '/search',
    views: {
      'menuContent': {
        templateUrl: 'templates/search.html'
      }
    }
  })

  .state('app.browse', {
      url: '/browse',
      views: {
        'menuContent': {
          templateUrl: 'templates/browse.html'
        }
      }
    })
    .state('app.playlists', {
      url: '/playlists',
      views: {
        'menuContent': {
          templateUrl: 'templates/playlists.html',
          controller: 'PlaylistsCtrl'
        }
      }
    })

  .state('app.single', {
    url: '/playlists/:playlistId',
    views: {
      'menuContent': {
        templateUrl: 'templates/playlist.html',
        controller: 'PlaylistCtrl'
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/playlists');
});
