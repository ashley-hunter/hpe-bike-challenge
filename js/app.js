/*! 
* element-seed-project - v1.4.0 
* © Copyright 2016  Hewlett-Packard Development Company, L.P
 */
angular.module('app', ['hpe.elements', 'app.challenge'])
  .run(function ($rootScope, $state, $stateParams) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
  });
angular.module('app')
  .config(['$stateProvider', '$urlRouterProvider', '$breadcrumbProvider',
    function ($stateProvider, $urlRouterProvider, $breadcrumbProvider) {

      //allow abstract states in breadcrumb
      $breadcrumbProvider.setOptions({
        includeAbstract: true
      });

      $urlRouterProvider.otherwise('/challenge/bike');
      $stateProvider
        .state('challenge', {
          abstract: 'true',
          url: '/challenge',
          template: '<ui-view />',
          ncyBreadcrumb: {
            label: 'Hewlett Packard Enterprise',
          }
        })
        .state('challenge.bike', {
          url: '/bike',
          templateUrl: 'app/views/challenge/challenge.html',
          controller: 'ChallengeCtrl as vm',
          ncyBreadcrumb: {
            label: 'Bike Challenge 2016'
          },
          data: {
            pageTitle: 'HPE Bike Challenge 2016'
          }
        })
        .state('challenge.update', {
          url: '/update',
          templateUrl: 'app/views/update/update.html',
          controller: 'UpdateCtrl as vm',
          ncyBreadcrumb: {
            label: 'Bike Challenge 2016'
          },
          data: {
            pageTitle: 'HPE Bike Challenge 2016'
          }
        });
    }
  ]);
(function () {
  angular.module("app.challenge", []);
})();
(function () {
  angular.module("app.challenge").controller("ChallengeCtrl", ChallengeCtrl);

  ChallengeCtrl.$inject = ['$interval', '$sce', '$scope'];

  function ChallengeCtrl($interval, $sce, $scope) {
    var vm = this;

    var intervalTime = 60000;

    var teamsDb = firebase.database().ref('Teams');
    var chatDb = firebase.database().ref('Chat');
    var streamsDb = firebase.database().ref('Streams');

    vm.messages = {};

    vm.name = '';
    vm.message = '';

    vm.teams = [{
      name: 'Belfast',
      distance: 0,
      stream: getStreamUrl('0'),
      winning: false
    }, {
      name: 'Cambridge',
      distance: 0,
      stream: getStreamUrl('0'),
      winning: false
    }, {
      name: 'Canberra',
      distance: 0,
      stream: getStreamUrl('0'),
      winning: false
    }, {
      name: 'Southborough',
      distance: 0,
      stream: getStreamUrl('0'),
      winning: false
    }, {
      name: 'Pleasanton',
      distance: 0,
      stream: getStreamUrl('0'),
      winning: false
    }, {
      name: 'Bangalore',
      distance: 0,
      stream: getStreamUrl('0'),
      winning: false
    }];

    vm.activeTeam = vm.teams[0];

    teamsDb.on('value', function (snapshot) {
      var latest = snapshot.val();

      // update values
      vm.teams.forEach(function (team) {
        team.distance = latest[team.name];
      });

      updateWinningTeam();

      // perform digest if required
      if (!$scope.$$phase) {
        $scope.$digest();
      }
    });


    chatDb.on('value', function (snapshot) {
      var latest = snapshot.val();

      vm.messages = latest;

      // perform digest if required
      if (!$scope.$$phase) {
        $scope.$digest();
      }
    });

    streamsDb.on('value', function (snapshot) {
      var latest = snapshot.val();

      for (var teamName in latest) {

        for (var idx = 0; idx < vm.teams.length; idx++) {
          if (vm.teams[idx].name === teamName) {
            vm.teams[idx].stream = getStreamUrl(latest[teamName]);
            break;
          }
        }

        // perform digest if required
        if (!$scope.$$phase) {
          $scope.$digest();
        }

      }

    });

    

    vm.sendMessage = function () {
      var newChildRef = chatDb.push();

      var date = new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString();

      newChildRef.set({
        Author: vm.name,
        Message: vm.message,
        Date: date
      });

      vm.message = '';
    };

    function getStreamUrl(stream) {
      return $sce.trustAsResourceUrl('https://www.ustream.tv/embed/' + stream + '?html5ui&autoplay=true&mute=true');
    }

    function updateWinningTeam() {

      // reset winning values
      vm.teams.forEach(function (team) {
        team.winning = false;
      });

      var sorted = vm.teams.slice(0).sort(function (a, b) {
        return a.distance < b.distance;
      });

      if (sorted[0].distance !== 0) {
        sorted[0].winning = true;
      }
    }

    updateTime();

    $interval(updateTime, 1000);

    // move to next team after 1 minute
    var changeTeamInterval = $interval(changeTeam, intervalTime);

    vm.selectTeam = function (team) {
      vm.activeTeam = team;

      // reset interval
      $interval.cancel(changeTeamInterval);

      // recreate interval
      changeTeamInterval = $interval(changeTeam, intervalTime);
    };

    function updateTime() {
      // get now
      var now = new Date().getTime();
      var end = 1479405600000;

      var diffSeconds = (end - now) / 1000;

      var hours = parseInt(diffSeconds / 3600);
      var minutes = parseInt((diffSeconds % 3600) / 60);
      var seconds = parseInt((((diffSeconds % 3600) / 60) - minutes) * 60);

      hours = Math.max(hours, 0);
      minutes = Math.max(minutes, 0);
      seconds = Math.max(seconds, 0);


      if (minutes.toString().length === 1) {
        minutes = '0' + minutes;
      }

      if (seconds.toString().length === 1) {
        seconds = '0' + seconds;
      }

      vm.timeRemaining = {
        hours: hours,
        minutes: minutes,
        seconds: seconds
      };

    }

    function changeTeam() {
      // find index of current team
      var index = vm.teams.indexOf(vm.activeTeam);

      // increment index
      index++;

      // check if out of bounds
      if (index >= vm.teams.length) {
        index = 0;
      }

      vm.activeTeam = vm.teams[index];
    }

  }

})();
(function () {
  angular.module("app").controller("PageHeaderCtrl", PageHeaderCtrl);

  PageHeaderCtrl.$inject = ['$scope', '$rootScope', '$state'];


  function PageHeaderCtrl($scope, $rootScope, $state) {
    var vm = this;
  }


})();
(function () {

    angular.module('app').controller('UpdateCtrl', UpdateCtrl);

    UpdateCtrl.$inject = ['$scope'];

    function UpdateCtrl($scope) {
        var vm = this;

        var teamsDB = firebase.database().ref('Teams');
        var streamsDB = firebase.database().ref('Streams');

        vm.teams = {
            Belfast: 0,
            Cambridge: 0,
            Canberra: 0,
            Southborough: 0,
            Pleasanton: 0,
            Bangalore: 0
        };

        vm.streams = {};

        teamsDB.on('value', function (snapshot) {
            var latest = snapshot.val();

            // update values
            for(var team in latest) {
                vm.teams[team] = latest[team];
            }

            // perform digest if required
            if (!$scope.$$phase) {
                $scope.$digest();
            }
        });

        streamsDB.on('value', function(snapshot) {
            vm.streams = snapshot.val();

             // perform digest if required
            if (!$scope.$$phase) {
                $scope.$digest();
            }
        });

        vm.update = function() {
            teamsDB.set(vm.teams);
        };

        vm.updateStreams = function() {
            streamsDB.set(vm.streams);
        };
    }

})();
