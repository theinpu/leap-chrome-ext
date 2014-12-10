console.info('leap test started');
var running = true;

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
function getDirection(direction) {
    var isHorizontal = Math.abs(direction[0]) > Math.abs(direction[1]);
    var swipeDirection = '';
    if (isHorizontal) {
        if (direction[0] > 0) {
            swipeDirection = "right";
        } else {
            swipeDirection = "left";
        }
    } else {
        if (direction[1] > 0) {
            swipeDirection = "up";
        } else {
            swipeDirection = "down";
        }
    }
    return swipeDirection;
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
function scroll(dist) {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        if (tabs.length == 0) return;
        var tabId = tabs[0].id;
        if (tabs[0].url.indexOf('chrome://') == -1) {
            chrome.tabs.executeScript(tabId, {
                code: "window.scrollBy(0, window.innerHeight * " + dist + ");"
            });
        }
    });
}
function scrollToTop() {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        if (tabs.length == 0) return;
        var tabId = tabs[0].id;
        if (tabs[0].url.indexOf('chrome://') == -1) {
            chrome.tabs.executeScript(tabId, {
                code: "window.scrollTo(0, 0);"
            });
        }
    });
}

function createNewTab() {
    chrome.tabs.create({});
}

function switchTab(dir) {
    chrome.tabs.getAllInWindow(function (tabs) {
        var currentId = -1;
        if (tabs.length > 0) {
            tabs.forEach(function (tab, id) {
                if (tab.highlighted) {
                    currentId = id;
                }
            });
        }
        if (currentId == -1) return;
        currentId += dir;
        if (currentId < 0) {
            currentId = tabs.length - 1;
        }
        if (currentId >= tabs.length) {
            currentId = 0;
        }

        chrome.tabs.update(tabs[currentId].id, {highlighted: true, active: true});
    });
}

Leap.loop({enableGestures: true}, function (frame) {
    chrome.windows.getCurrent(function (window) {
        running = window.focused;
    });

    if (!running) return;

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
                        var swipeDirection = getDirection(gesture.direction);
                        switch (swipeDirection) {
                            case 'right':
                                goForward();
                                break;
                            case 'left':
                                goBack();
                                break;
                            case 'down':
                                scroll(1);
                                break;
                            case 'up':
                                scroll(-1);
                                break;
                        }
                    }
                    break;
            }
            break;
        case 2:
            var gesture1 = frame.gestures[0];
            var gesture2 = frame.gestures[1];

            if (gesture1.state != "stop" && gesture2.state != "stop") break;

            var hand = getRightHand(gesture1, frame);
            var fid1 = -1;
            var fid2 = -1;
            if (hand.indexFinger && hand.middleFinger) {
                fid1 = gesture1.pointableIds.indexOf(hand.indexFinger.id);
                fid2 = gesture2.pointableIds.indexOf(hand.middleFinger.id);
            }

            if (fid1 == -1 || fid2 == -1) break;
            if (gesture1.type == "swipe" && gesture2.type == "swipe") {
                var dist1 = Leap.vec3.distance(gesture1.startPosition, gesture1.position);
                var dist2 = Leap.vec3.distance(gesture2.startPosition, gesture2.position);

                if (dist1 < 100 || dist2 < 100) break;

                var dir1 = getDirection(gesture1.direction);
                var dir2 = getDirection(gesture2.direction);

                if (dir1 == 'up' && dir2 == 'up') {
                    scrollToTop();
                }

                if (dir1 == 'down' && dir2 == 'down') {
                    createNewTab();
                }

                if (dir1 == 'left' && dir2 == 'left') {
                    switchTab(-1);
                }
                if (dir1 == 'right' && dir2 == 'right') {
                    switchTab(1);
                }


            }

        default:
            break;
    }

});