"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var application = require("tns-core-modules/application");
var types = require("tns-core-modules/utils/types");
application.on(application.resumeEvent, function (args) {
    setTimeout(function () {
        if (TNSPusherBeams._messageCallback && TNSPusherBeams._cachedMessage) {
            TNSPusherBeams._messageCallback(TNSPusherBeams._cachedMessage);
            TNSPusherBeams._cachedMessage = undefined;
        }
    });
});
var InterestsChangedDelegateImpl = (function (_super) {
    __extends(InterestsChangedDelegateImpl, _super);
    function InterestsChangedDelegateImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    InterestsChangedDelegateImpl.prototype.interestsSetOnDeviceDidChangeWithInterests = function (interests) {
        if (TNSPusherBeams._interestsCallback) {
            var items = [];
            if (interests instanceof NSArray) {
                items = deserialize(interests);
            }
            else {
                items = interests;
            }
            TNSPusherBeams._interestsCallback(items);
        }
    };
    InterestsChangedDelegateImpl = __decorate([
        ObjCClass(InterestsChangedDelegate)
    ], InterestsChangedDelegateImpl);
    return InterestsChangedDelegateImpl;
}(NSObject));
var TNSPusherBeams = (function () {
    function TNSPusherBeams() {
    }
    TNSPusherBeams.getMessage = function (notification) {
        var message = deserialize(notification) || undefined;
        var aps = notification.objectForKey('aps');
        if (aps !== null && message) {
            var alert_1 = aps.objectForKey('alert');
            if (alert_1 !== null && alert_1.objectForKey) {
                message.title = alert_1.objectForKey('title');
                message.body = alert_1.objectForKey('body');
            }
        }
        if (message) {
            if (message.data) {
                Object.keys(message.data).forEach(function (key) {
                    message[key] = message.data[key];
                });
            }
            if (message.aps && message.aps.data) {
                Object.keys(message.aps.data).forEach(function (key) {
                    message[key] = message.aps.data[key];
                });
            }
            delete message.aps;
            delete message.data;
        }
        return message;
    };
    TNSPusherBeams.registerForPushNotifications = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._registerResolveCallback = resolve;
            _this._registerRejectCallback = reject;
            var doRegistration = function () {
                var opts = 4 | 2 | 1;
                UNUserNotificationCenter.currentNotificationCenter().requestAuthorizationWithOptionsCompletionHandler(opts, function (granted, error) {
                    console.log('granted', granted, 'error', error, UIApplication.sharedApplication.registeredForRemoteNotifications);
                    if (granted) {
                        UIApplication.sharedApplication.registerForRemoteNotifications();
                    }
                    else if (error) {
                        reject(error.localizedDescription);
                        _this._registerRejectCallback = undefined;
                        _this._registerResolveCallback = undefined;
                    }
                });
            };
            if (UIApplication.sharedApplication) {
                doRegistration();
            }
            else {
                application.on(application.launchEvent, function (args) {
                    doRegistration();
                });
            }
        });
    };
    TNSPusherBeams.unregisterForPushNotifications = function () {
        return new Promise(function (resolve, reject) {
            try {
                UIApplication.sharedApplication.unregisterForRemoteNotifications();
                resolve();
            }
            catch (e) {
                reject(e);
            }
        });
    };
    TNSPusherBeams.start = function (instanceId) {
        var _this = this;
        if (application.ios.delegate === undefined) {
            var UIApplicationDelegateImpl = (function (_super) {
                __extends(UIApplicationDelegateImpl, _super);
                function UIApplicationDelegateImpl() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                UIApplicationDelegateImpl = __decorate([
                    ObjCClass(UIApplicationDelegate)
                ], UIApplicationDelegateImpl);
                return UIApplicationDelegateImpl;
            }(UIResponder));
            application.ios.delegate = UIApplicationDelegateImpl;
        }
        application.ios.delegate.prototype.applicationDidFinishLaunchingWithOptions = function (application, launchOptions) {
            PushNotifications.shared.startWithInstanceId(instanceId);
            var notification = launchOptions ? launchOptions.objectForKey(UIApplicationLaunchOptionsRemoteNotificationKey) : null;
            if (notification) {
                var message = _this.getMessage(notification);
                if (_this._messageCallback) {
                    _this._messageCallback(message);
                }
                else {
                    _this._cachedMessage = message;
                }
            }
            return true;
        };
        application.ios.delegate.prototype.applicationDidRegisterForRemoteNotificationsWithDeviceToken = function (application, deviceToken) {
            if (application.currentUserNotificationSettings.types > 0) {
                if (_this._registerResolveCallback) {
                    _this._registerResolveCallback();
                    _this._registerResolveCallback = undefined;
                    _this._registerRejectCallback = undefined;
                }
            }
            else {
                if (_this._registerRejectCallback) {
                    _this._registerRejectCallback();
                    _this._registerRejectCallback = undefined;
                    _this._registerResolveCallback = undefined;
                }
            }
            console.log('deviceToken', deviceToken);
            PushNotifications.shared.registerDeviceToken(deviceToken);
        };
        application.ios.delegate.prototype.applicationDidReceiveRemoteNotificationFetchCompletionHandler = function (application, userInfo, completionHandler) {
            var message = _this.getMessage(userInfo);
            var type = PushNotifications.shared.handleNotificationWithUserInfo(userInfo);
            completionHandler(0);
            if (_this._messageCallback && message) {
                _this._messageCallback(message);
            }
        };
        application.ios.delegate.prototype.applicationDidFailToRegisterForRemoteNotificationsWithError = function (application, error) {
            if (error) {
                if (error.localizedDescription.indexOf('not supported in the simulator') > -1) {
                    if (_this._registerResolveCallback) {
                        _this._registerResolveCallback();
                    }
                    else {
                        if (_this._registerRejectCallback) {
                            _this._registerRejectCallback(error.localizedDescription);
                        }
                    }
                }
                else {
                    if (_this._registerRejectCallback) {
                        _this._registerRejectCallback(error.localizedDescription);
                    }
                }
            }
        };
        if (!PushNotifications.shared.delegate) {
            PushNotifications.shared.delegate = this.delegate;
        }
    };
    TNSPusherBeams.addDeviceInterest = function (interest) {
        var error = new interop.Reference();
        PushNotifications.shared.addDeviceInterestWithInterestError(interest, error);
    };
    TNSPusherBeams.addOnInterestsChangeCallback = function (callback) {
        this._interestsCallback = callback;
    };
    TNSPusherBeams.addOnMessageReceivedCallback = function (callback) {
        this._messageCallback = callback;
        if (this._cachedMessage) {
            callback(this._cachedMessage);
            this._cachedMessage = undefined;
        }
    };
    TNSPusherBeams.addOnPushTokenReceivedCallback = function (callback) {
        this._tokenCallback = callback;
    };
    TNSPusherBeams.getDeviceInterests = function () {
        return deserialize(PushNotifications.shared.getDeviceInterests());
    };
    TNSPusherBeams.removeDeviceInterest = function (interest) {
        var error = new interop.Reference();
        PushNotifications.shared.removeDeviceInterestWithInterestError(interest, error);
    };
    TNSPusherBeams.clearDeviceInterests = function () {
        var error = new interop.Reference();
        PushNotifications.shared.clearDeviceInterestsAndReturnError(error);
    };
    TNSPusherBeams.clearAllState = function () {
        PushNotifications.shared.clearAllStateWithCompletion(null);
    };
    TNSPusherBeams.delegate = InterestsChangedDelegateImpl.new();
    return TNSPusherBeams;
}());
exports.TNSPusherBeams = TNSPusherBeams;
function deserialize(nativeData) {
    if (types.isNullOrUndefined(nativeData)) {
        return null;
    }
    else {
        switch (types.getClass(nativeData)) {
            case 'NSNull':
                return null;
            case 'NSMutableDictionary':
            case 'NSDictionary':
                var obj = {};
                var length_1 = nativeData.count;
                var keysArray = nativeData.allKeys;
                for (var i = 0; i < length_1; i++) {
                    var nativeKey = keysArray.objectAtIndex(i);
                    obj[nativeKey] = deserialize(nativeData.objectForKey(nativeKey));
                }
                return obj;
            case 'NSMutableArray':
            case 'NSArray':
                var array = [];
                var len = nativeData.count;
                for (var i = 0; i < len; i++) {
                    array[i] = deserialize(nativeData.objectAtIndex(i));
                }
                return array;
            default:
                return nativeData;
        }
    }
}
//# sourceMappingURL=beams.ios.js.map