// ==UserScript==
// @name        起點自動取消關注
// @namespace   http://yz.homepage
// @match     http://t.qidian.com/Friend/Following.php*
// @version     1
// @description  打開起點 我關注的人 頁面(http://t.qidian.com/Friend/Following.php), 如果關注人數>1000(上限1000), 會按照條件取消關注, 直到關注的人數<900
//               目前條件為優先取消不是互相關注, 如果互相關注的人數很多, 則也取消關注不是作家的人
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// ==/UserScript==
window.addEventListener('load', function() {

    var node = document.querySelector('div.head-fl-left a');
    if (node != null) {
        var username = node.innerHTML;
        console.log('username = ' + username);

        listGmValues(username);
        // deleteGmValues(username);
        main(username);
    } else {
        alert('node is null');
    }
}, false);

function main(username) {
    var statusKey = getStatusKey(username);
    var status = GM_getValue(statusKey);
    // status分成 undefined, running
    console.log(statusKey + ' = ' + status);
    var relationship = getRelationship();
    console.log('relationship = ' + JSON.stringify(relationship));
    if (status == undefined) {
        if (relationship.following == 1000) {
            GM_setValue(statusKey, 'running');
            window.location = 'http://t.qidian.com/Friend/Following.php';
            deleteFollow(relationship, username);
        }
    } else if (status == 'running') {
        deleteFollow(relationship, username);
    } else {
        alert('abnormal status = ' + status);
    }
}

function deleteFollow(relationship, username) {
    var deleteMutal;
    // 有3個系統關注對象, 所以我的關注1000人時, 互為關注最多只有997
    // 在關注最高只想要900的情形下, 互為關注最多只有897
    if (relationship.mutual < 897) {
        // 無須取消互為關注
        deleteMutal = false;
    } else {
        // 要取消互為關注
        deleteMutal = true;
    }
    var allPeople = document.querySelectorAll('div.people-box ul li');
    var deletePeople = [];

    for (var i = allPeople.length - 1; i >= 0; i--) {
        var addToDelete = false;
        if (allPeople[i].querySelector('dl.manipulate dt img') != null) {
            // 是互為好友
            if (deleteMutal) {
                if (allPeople[i].querySelector('div.box img') != null) {
                    //是作家
                } else if (allPeople[i].querySelector('div.box > p').innerHTML.contains('女')) {
                    //是女的
                } else {
                    addToDelete = true;
                }
            } else {
                // 保留
            }
        } else {
            addToDelete = true;
        }
        if (addToDelete) {
            deletePeople.push(allPeople[i].querySelector('dl.manipulate a'));
        }
        /*
        if (deleteMutal) {
          // 先以不是作家的男生來動手
          if (allPeople[i].querySelector('div.box img') != null) {  
            //是作家
          }
          if (!allPeople[i].querySelector('div.box > p').innerHTML.contains('女')) {
            //不是女的
          }
        }
        */
    }
    var deletePeopleLength = deletePeople.length;
    if (deletePeopleLength > 0) {
        clickAndConfirmDeleteFollow(deletePeople, finalAction);
    } else {
        finalAction();
    }

    function finalAction() {
        if (relationship.following < 900) {
            deleteGmValues(username);
            alert('finish');
        } else {
            if (deletePeopleLength > 0) {
                window.location.reload();
            } else {
                var pagetors = document.querySelectorAll('div.pagetor a');
                var node = pagetors[pagetors.length - 1];
                if (node.innerHTML == '下一页') {
                    // window.location = node.href;   
                    // 不認得redirect這個div內的script
                    node.click();
                } else {
                    alert('最後一頁了');
                }
            }
        }
    }
}

function clickAndConfirmDeleteFollow(deleteNodes, callback) {
    var deleteNode = deleteNodes.splice(0, 1)[0];
    var clickEvent = document.createEvent('HTMLEvents');
    clickEvent.initEvent('click', true, true);
    deleteNode.dispatchEvent(clickEvent);
    //console.log(document.querySelector('div.linkbox a.link-button-green'));
    document.querySelector('div.linkbox a.link-button-green').dispatchEvent(clickEvent);

    var observer = new MutationObserver(function(mutations) {
        if (document.querySelector('div.linkbox a.link-button') != null) {
            document.querySelector('div.linkbox a.link-button').dispatchEvent(clickEvent);
            observer.disconnect();
            if (deleteNodes.length > 0) {
                clickAndConfirmDeleteFollow(deleteNodes, callback);
            } else {
                callback();
            }
        }
    });
    var config = {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    };
    // 由於彈出的視窗是直接新增到body下的, 所以上面語句回傳為null導致fail
    var target = document.querySelector('body');
    observer.observe(target, config);
}

function getRelationship() {
    var relationshipNodes = document.querySelectorAll('div.relationship-bar-top span.li i');
    var following = relationshipNodes[0].innerHTML;
    var follower = relationshipNodes[1].innerHTML;
    var mutual = relationshipNodes[2].innerHTML;
    var black = relationshipNodes[3].innerHTML;
    var relationship = {
        following: following.slice(1, following.length - 1),
        follower: follower.slice(1, follower.length - 1),
        mutual: mutual.slice(1, mutual.length - 1),
        black: black.slice(1, black.length - 1)
    };
    return relationship;
}

function getStatusKey(username) {
    return username + '_status';
}

function listGmValues(username) {
    var gmKeys = getAllGmKey(username);
    gmKeys.forEach(function(gmKey) {
        console.log(gmKey + ' = ' + GM_getValue(gmKey));
    });
}

function getAllGmKey(username) {
    var gmKeys = [];
    var i = 0;
    gmKeys[i++] = getStatusKey(username);
    return gmKeys;
}

function deleteGmValues(username) {
    var gmKeys = getAllGmKey(username);
    gmKeys.forEach(function(gmKey) {
        GM_deleteValue(gmKey);
        console.log('delete ' + gmKey);
    });
    listGmValues(username);
}