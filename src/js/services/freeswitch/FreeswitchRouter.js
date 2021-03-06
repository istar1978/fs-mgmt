/*global angular, require */
(function () {
    'use strict';
    var module = angular.module('fsmgmt.services.freeswitch.FreeswitchRouter', [
        'fsmgmt.services.freeswitch.FreeswitchClient',
        'fsmgmt.services.freeswitch.models.Server',
        'fsmgmt.services.AllSettled'
    ]);

    module.factory('freeswitch', ['$q', 'FreeswitchClient', 'FreeswitchServer', function ($q, FreeswitchClient, FreeswitchServer) {
        var u = require('underscore');

        var FreeswitchRouter = function () {
            this.timeout = null;
        };

        FreeswitchRouter.prototype.setTimeout = function (timeout) {
            this.timeout = timeout;
        };

        FreeswitchRouter.prototype.listConferences = function(servers) {
            var self = this;
            return $q(function (resolve, reject) {
                if (servers.length == 0) {
                    resolve([]);
                } else {
                    var responses = [];

                    u.each(servers, function (server) {
                        var client = new FreeswitchClient(server, self.timeout);
                        responses.push(client.listConferences());
                    });

                    $q.allSettled(responses)
                        .then(function(allResponses) {
                            resolve(allResponses);
                        })
                        .catch(function(allResponses) {
                            resolve(u.map(allResponses, function (response) {
                                if (response instanceof FreeswitchServer) {
                                    return response;
                                } else {
                                    console.log(JSON.stringify(response));

                                    return {
                                        name: response.server.name,
                                        host: response.server.host,
                                        error: (response.status === 0 || response.status === -1)
                                            ? "Connection refused"
                                            : '(' + response.status + ') ' + response.statusText
                                    }
                                }
                            }));
                        });
                }
            });
        };

        FreeswitchRouter.prototype.listCalls = function(servers) {
            var self = this;
            return $q(function (resolve, reject) {
                var responses = [];

                u.each(servers, function (server) {
                    var client = new FreeswitchClient(server, self.timeout);
                    responses.push(client.listCalls());
                });

                $q.allSettled(responses)
                    .then(function(allResponses) {
                        resolve(allResponses);
                    })
                    .catch(function(allResponses) {
                        resolve(u.map(allResponses, function (response) {
                            if (response instanceof FreeswitchServer) {
                                return response;
                            } else {
                                return {
                                    name: response.server.name,
                                    host: response.server.host,
                                    error: (response.status === 0) ? "Connection refused" : '(' + response.status + ') ' + response.statusText
                                }
                            }
                        }));
                    });
            });
        };

        FreeswitchRouter.prototype.hangup = function(server, conference, member) {
            var client = new FreeswitchClient(server, this.timeout);
            return client.hangup(conference.name, (member) ? member.id : null);
        };

        FreeswitchRouter.prototype.recordingCheck = function(server, conference) {
            var client = new FreeswitchClient(server, this.timeout);
            return client.recordingCheck(conference.name);
        };

        FreeswitchRouter.prototype.kill = function(server, call) {
            var client = new FreeswitchClient(server, this.timeout);
            return client.kill(call);
        };

        return new FreeswitchRouter();
    }]);
}());