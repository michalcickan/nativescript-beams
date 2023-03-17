"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@nativescript/core");
var messageHolder;
core_1.Application.android.on('activityNewIntent', function (args) {
    var intent = args.intent;
    if (intent) {
        var extras = intent.getExtras();
        var object = {};
        var fcm = {};
        if (extras) {
            var iterator = extras.keySet().iterator();
            while (iterator.hasNext()) {
                var key = iterator.next();
                if (key.startsWith('google.')) {
                    var new_key = key.replace('google.', '');
                    if (key === 'google.sent_time') {
                        fcm[new_key] = extras.getLong(key);
                    }
                    else if (key === 'google.ttl') {
                        fcm[new_key] = extras.getInt(key);
                    }
                    else {
                        fcm[new_key] = extras.get(key);
                    }
                }
                else {
                    object[key] = extras.get(key);
                }
            }
            object['fcm'] = fcm;
        }
        var pusher = extras ? extras.get('pusher') : null;
        if (pusher) {
            var pusherVal = void 0;
            try {
                pusherVal = JSON.parse(extras.get('pusher'));
            }
            catch (e) {
                pusherVal = pusher;
            }
            var message = __assign({ from: extras.get('from'), title: extras.get('title'), body: extras.get('body'), pusher: pusherVal }, object);
            if (TNSPusherBeams._messageCallback) {
                TNSPusherBeams._messageCallback(message);
            }
            else {
                messageHolder = message;
            }
        }
    }
});
core_1.Application.android.on('activityResumed', function (args) {
    if (TNSPusherBeams._messageCallback && messageHolder) {
        TNSPusherBeams._messageCallback(messageHolder);
        messageHolder = null;
    }
});
var TNSPusherBeams = (function () {
    function TNSPusherBeams() {
    }
    TNSPusherBeams.start = function (instanceId) {
        com.pusher.pushnotifications.PushNotifications.start(core_1.Utils.android.getApplicationContext(), instanceId);
    };
    TNSPusherBeams.addDeviceInterest = function (interest) {
        com.pusher.pushnotifications.PushNotifications.addDeviceInterest(interest);
    };
    TNSPusherBeams.addOnInterestsChangeCallback = function (callback) {
        this._interestsCallback = callback;
        if (callback) {
            com.pusher.pushnotifications.PushNotifications.setOnDeviceInterestsChangedListener(new com.pusher.pushnotifications.SubscriptionsChangedListener({
                onSubscriptionsChanged: function (interests) {
                    var iterator = interests.iterator();
                    var items = [];
                    while (iterator.hasNext()) {
                        items.push(iterator.next());
                    }
                    if (TNSPusherBeams._interestsCallback) {
                        TNSPusherBeams._interestsCallback(items);
                    }
                }
            }));
        }
        else {
            com.pusher.pushnotifications.PushNotifications.setOnDeviceInterestsChangedListener(null);
        }
    };
    TNSPusherBeams.addOnMessageReceivedCallback = function (callback) {
        this._messageCallback = callback;
        com.github.triniwiz.pusher.BeamsPlugin.setOnMessageListener(new com.github.triniwiz.pusher.BeamsPlugin.Listener({
            onSuccess: function (data) {
                var message;
                try {
                    message = JSON.parse(data);
                }
                catch (e) {
                    message = data;
                }
                callback(message);
            }
        }));
    };
    TNSPusherBeams.addOnPushTokenReceivedCallback = function (callback) {
        com.github.triniwiz.pusher.BeamsPlugin.setOnTokenListener(new com.github.triniwiz.pusher.BeamsPlugin.Listener({
            onSuccess: function (data) {
                callback(data);
            }
        }));
    };
    TNSPusherBeams.getDeviceInterests = function () {
        var set = com.pusher.pushnotifications.PushNotifications.getDeviceInterests();
        var items = [];
        if (set) {
            var iterator = set.iterator();
            while (iterator.hasNext()) {
                items.push(iterator.next());
            }
        }
        return items;
    };
    TNSPusherBeams.removeDeviceInterest = function (interest) {
        com.pusher.pushnotifications.PushNotifications.removeDeviceInterest(interest);
    };
    TNSPusherBeams.clearDeviceInterests = function () {
        com.pusher.pushnotifications.PushNotifications.clearDeviceInterests();
    };
    TNSPusherBeams.registerForPushNotifications = function () {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    };
    TNSPusherBeams.unregisterForPushNotifications = function () {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    };
    TNSPusherBeams.clearAllState = function () {
        com.pusher.pushnotifications.PushNotifications.clearAllState();
    };
    return TNSPusherBeams;
}());
exports.TNSPusherBeams = TNSPusherBeams;
//# sourceMappingURL=beams.android.js.map