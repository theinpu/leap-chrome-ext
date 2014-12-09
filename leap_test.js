console.info('leap test started');

function getRightHand(gesture, frame) {
    var hand = {};
    var handIds = gesture.handIds;
    handIds.forEach(function (handId) {
        var h = frame.hand(handId);
        if (h.type == "right") {
            hand = h;
        }
    });
    return hand;
}

function isCircleClockwise(pointableId, normal, frame) {
    var clockwise = false;
    var direction = frame.pointable(pointableId).direction;
    var dotProduct = Leap.vec3.dot(direction, normal);

    if (dotProduct > 0) clockwise = true;
    return clockwise;
}

function reloadTab() {
    chrome.tabs.reload();
}

function closeTab() {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        if (tabs.length == 0) return;
        var tabId = tabs[0].id;
        chrome.tabs.remove(tabId);
    });
}

function onIndexFingerCircles(gesture, frame) {
    var hand = getRightHand(gesture, frame);
    var fid = -1;
    if (hand.indexFinger) {
        fid = gesture.pointableIds.indexOf(hand.indexFinger.id);
    }
    if (fid > -1) {
        var clockwise = this.isCircleClockwise(gesture.pointableIds[fid], gesture.normal, frame);
        if (gesture.progress >= 1 && gesture.radius > 30) {
            if (clockwise) {
                reloadTab();
            } else {
                closeTab();
            }
        }
    }
}
function goBack() {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        if (tabs.length == 0) return;
        var tabId = tabs[0].id;
        if (tabs[0].url.indexOf('chrome://') == -1) {
            chrome.tabs.executeScript(tabId, {
                code: "history.back();"
            });
        } else {
        }
    });
}
function goForward() {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        if (tabs.length == 0) return;
        var tabId = tabs[0].id;
        if (tabs[0].url.indexOf('chrome://') == -1) {
            chrome.tabs.executeScript(tabId, {
                code: "history.forward();"
            });
        } else {
            history.forward();
        }
    });
}
Leap.loop({enableGestures: true}, function (frame) {

    var gestures = frame.gestures.length;

    switch (gestures) {
        case 1:
            var gesture = frame.gestures[0];
            if (gesture.state != "stop") break;
            switch (gesture.type) {
                case "circle":
                    onIndexFingerCircles(gesture, frame);
                    break;
                case "swipe":
                    var dist = Leap.vec3.distance(gesture.startPosition, gesture.position);
                    if (dist < 100) break;
                    var hand = getRightHand(gesture, frame);
                    var fid = -1;
                    if (hand.indexFinger) {
                        fid = gesture.pointableIds.indexOf(hand.indexFinger.id);
                    }
                    if (fid > -1) {
                        var isHorizontal = Math.abs(gesture.direction[0]) > Math.abs(gesture.direction[1]);
                        var swipeDirection = '';
                        if (isHorizontal) {
                            if (gesture.direction[0] > 0) {
                                swipeDirection = "right";
                            } else {
                                swipeDirection = "left";
                            }
                        } else {
                            if (gesture.direction[1] > 0) {
                                swipeDirection = "up";
                            } else {
                                swipeDirection = "down";
                            }
                        }
                    }
                    break;
            }
            break;
        case 2:
            var gesture1 = frame.gestures[0];
            var gesture2 = frame.gestures[1];
        default:
            break;
    }

    /*
     if (gestures == 1) {
     frame.gestures.forEach(function (gesture) {
     if (gesture.state == "stop") {
     //console.log(gesture.type, gesture);
     switch (gesture.type) {
     case "circle":
     var hand = this.getRightHand(gesture, frame);
     var fid = -1;
     if (hand.indexFinger) {
     fid = gesture.pointableIds.indexOf(hand.indexFinger.id);
     }
     if (fid > -1) {
     var clockwise = this.isCircleClockwise(gesture.pointableIds[fid], gesture.normal, frame);
     if(gesture.progress >= 1 && gesture.radius > 30) {
     if (clockwise) {
     reloadTab();
     } else {
     closeTab();
     }
     }
     }
     break;
     case "swipe":
     break;
     }
     }
     });

     }
     */

});