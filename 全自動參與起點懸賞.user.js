// ==UserScript==
// @name       全自動參與起點懸賞
// @namespace  http://yz.homepage/
// @version    0.1
// @description  每隔30分鐘,會自動refresh http://xuanshang.qidian.com/LuckList.aspx, 找到最後一筆參與的懸賞, 並由舊到新參加
// @match      http://xuanshang.qidian.com/luckquestion.aspx?id=*
// @match      http://xuanshang.qidian.com/LuckList.aspx?*
// @match      http://xuanshang.qidian.com/LuckList.aspx
// @copyright  2015+, YZ
// @grant      GM_getValue
// @grant      GM_setValue
// @grant      GM_deleteValue
// @require    http://xuanshang.qidian.com/js/jquery.js
// ==/UserScript==
window.addEventListener('load', function() {

    var spNickname = document.querySelector('span#spNickname a');
    if (spNickname != null) {
        var username = document.querySelector('span#spNickname a').text.split('Hi ')[1];
        console.log('username = ' + username);
        listGmValues(username);
        // deleteGmValues(username);
        main(username);
        setTimeout(function(){ location.reload(); }, 1800000);
    } else {
        alert('spNickname is null')
    }
}, false);

/*
var observer = new MutationObserver(function (mutations) {
  var spNickname = document.querySelector('span#spNickname a');
  if (spNickname != null) {
    var username =  document.querySelector('span#spNickname a').text.split('Hi ') [1];
    console.log('username = ' + username);
    main(username);
    observer.disconnect();
  }
});

//var target = document.querySelector('input[onclick^=checkJoin]');
// 由於彈出的視窗是直接新增到body下的, 所以上面語句回傳為null導致fail
var target = document.querySelector('body');
observer.observe(target, {
  childList: true,
  subtree: true,
  attributes: false,
  characterData: false
});
*/

function main(username) {
    var lastJoinedXsIdKey = getLastJoinedXsIdKey(username);
    var lastJoinedXsId = GM_getValue(lastJoinedXsIdKey);
    console.log(lastJoinedXsIdKey + ' = ' + lastJoinedXsId);
    if (lastJoinedXsId == undefined) {
        lastJoinedXsId = findLatestJoindXs(username);
        console.log('lastJoinedXsId = ' + lastJoinedXsId);
        if (lastJoinedXsId != null) {
            GM_setValue(lastJoinedXsIdKey, lastJoinedXsId);
            window.location = document.querySelector('div.stay a[href*=\'LuckList.aspx\']').href;
        }
    } else {
        findAndJoinXs(username, lastJoinedXsId);
    }
}

function findAndJoinXs(username, lastJoinedXsId) {
    console.log(username + ' lastJoinedXsId = ' + lastJoinedXsId);
    var currentUrl = window.location.href;
    if (currentUrl.indexOf('luckquestion.aspx') >= 0) {
        if (isCurrentXsJoined()) {
            var currentXsId = getCurrentXsId();
            GM_setValue(getLastJoinedXsIdKey(username), currentXsId);
            window.location = document.querySelector('div.stay a[href*=\'LuckList.aspx\']').href;
        } else {
            joinCurrentXs(username);
        }
    } else if (currentUrl.indexOf('LuckList') >= 0) {
        var xsList = document.querySelectorAll('div.list table tbody tr td a');
        var processLastIndexXsKey = getProcessLastIndexXsKey(username);
        var processLastIndexXs = GM_getValue(processLastIndexXsKey);
        console.log(processLastIndexXsKey + ' = ' + processLastIndexXs);
        if (processLastIndexXs == undefined || processLastIndexXs != true) {
            var lastFindIndex = null;
            for (var i = xsList.length - 1; i >= 0; i--) {
                if (xsList[i].getAttribute('href').split('id=')[1] <= lastJoinedXsId) {
                    lastFindIndex = i;
                } else {
                    break;
                }
            }
            if (lastFindIndex == null) {
                // 沒找到, 跳到下一頁
                var pagetors = document.querySelectorAll('div.pagetor a');
                var node = pagetors[pagetors.length - 1];
                if (node.innerHTML == '下一页') {
                    // window.location = node.href;   
                    // 不認得redirect這個div內的script
                    node.click();
                } else {
                    alert('最後一頁了');
                }
            } else if (lastFindIndex == 0) {
                var currentPage = getCurrentXsPage();
                if (currentPage == 1) {
                    // 已經跑到最新一筆了
                } else {
                    // 要從前1頁最後筆開始處理
                    GM_setValue(processLastIndexXsKey, true);
                    // window.location = document.querySelector('div.pagetor a[href*=\'(' + (currentPage - 1) + ')\']').href;
                    window.location = 'http://xuanshang.qidian.com/LuckList.aspx?type=1&page=' + (currentPage - 1);
                }
            } else {
                window.location = xsList[lastFindIndex - 1].href;
            }
        } else {
            GM_deleteValue(processLastIndexXsKey);
            window.location = xsList[xsList.length - 1].href;
        }
    } else {
        window.location = 'http://xuanshang.qidian.com/LuckList.aspx';
    }
}

function joinCurrentXs() {
    var button = document.evaluate('//*[text()=\'立即参加\']', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    if (button.singleNodeValue != null) {
        var observer = new MutationObserver(function(mutations) {
            var confirmButton = document.evaluate('//*[contains(@onclick, \'checkJoin\')]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            if (confirmButton.singleNodeValue != null) {
                confirmButton.singleNodeValue.click();
                observer.disconnect();
            }
        });
        //var target = document.querySelector('input[onclick^=checkJoin]');
        // 由於彈出的視窗是直接新增到body下的, 所以上面語句回傳為null導致fail
        var target = document.querySelector('body');
        observer.observe(target, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });
        button.singleNodeValue.click();
    }
}

function getCurrentXsPage() {
    return document.querySelector('span.cur').innerHTML;
}

function findLatestJoindXs(username) {
    var lastCheckedXsPageKey = getLastCheckedXsPageKey(username);
    var lastCheckedXsPage = GM_getValue(lastCheckedXsPageKey);
    console.log(lastCheckedXsPageKey + ' = ' + lastCheckedXsPage);
    var initPage = 'http://xuanshang.qidian.com/LuckList.aspx';
    var currentUrl = window.location.href;
    if (lastCheckedXsPage == undefined) {
        if (currentUrl.indexOf(initPage) >= 0 && getCurrentXsPage() == 1) {
            GM_setValue(lastCheckedXsPageKey, 1);
            window.location = document.querySelectorAll('div.list table tbody tr td a')[0].getAttribute('href');
        } else {
            window.location = initPage;
        }
    } else {
        var lastCheckedXsIdKey = getLastCheckedXsIdKey(username);
        var lastCheckedXsId = GM_getValue(lastCheckedXsIdKey);
        console.log(lastCheckedXsIdKey + ' = ' + lastCheckedXsId);
        if (lastCheckedXsId == undefined) {
            if (currentUrl.indexOf('luckquestion.aspx') >= 0) {
                var currentXsId = getCurrentXsId();
                if (isCurrentXsJoined()) {
                    return currentXsId;
                } else {
                    lastCheckedXsId = currentXsId;
                    GM_setValue(lastCheckedXsIdKey, lastCheckedXsId);
                    window.location = initPage;
                }
            } else if (currentUrl.indexOf('LuckList') >= 0) {
                window.location = document.querySelectorAll('div.list table tbody tr td a')[0].getAttribute('href');
            } else {
                window.location = initPage;
            }
        } else {
            if (currentUrl.indexOf('LuckList.aspx') >= 0) {
                var xsList = document.querySelectorAll('div.list table tbody tr td a');
                var findNext = false;
                var targetUrl = null;
                for (var i = 0; i < xsList.length; i++) {
                    if (xsList[i].getAttribute('href').split('id=')[1] < lastCheckedXsId) {
                        findNext = true;
                        targetUrl = xsList[i].getAttribute('href');
                        break;
                    }
                }
                if (findNext) {
                    window.location = targetUrl;
                } else {
                    // 沒找到比較小的id, 要換下一頁
                    lastCheckedXsPage++;
                    GM_setValue(lastCheckedXsPageKey, lastCheckedXsPage);
                    window.location = 'http://xuanshang.qidian.com/LuckList.aspx?type=1&page=' + lastCheckedXsPage;
                    // window.location = document.querySelector('div.pagetor a[href*=\'(' + lastCheckedXsPage + ')\']').href;
                    /*
                    var clickEvent = document.createEvent('HTMLEvents');
                    clickEvent.initEvent('click', true, true);
                    document.querySelector('div.pagetor a[href*=\'('+lastCheckedXsPage+')\']').dispatchEvent(clickEvent);
                    */
                }
            } else　 if (currentUrl.indexOf('question.aspx') >= 0) {
                // http://xuanshang.qidian.com/question.aspx?id=377044
                var currentXsId = getCurrentXsId();
                if (isCurrentXsJoined()) {
                    return currentXsId;
                } else {
                    lastCheckedXsId = currentXsId;
                    GM_setValue(lastCheckedXsIdKey, lastCheckedXsId);
                    window.location = 'http://xuanshang.qidian.com/LuckList.aspx?type=1&page=' + lastCheckedXsPage;
                }
            } else {
                alert('abnormal currentUrl = ' + currentUrl);
            }
        }
    }
}

function isCurrentXsJoined() {
    /*
    if ($('div#dvjoin p:contains(\'您已获得抽奖资格\')').length == 0) {
        // not joined
        return false;
    } else {
        // joined
        return true;
    }
    */
    if (document.querySelector('div#dvjoin p').innerHTML.indexOf('您已获得抽奖资格') >= 0) {
        // joined
        return true;
    } else {
        // not joined
        return false;
    }
}

function getCurrentXsId() {
    // get id at http://xuanshang.qidian.com/luckquestion.aspx?id=377031
    // var id = $('form#aspnetForm')[0].getAttribute("action").split('id=')[1];
    var id = document.querySelector('form#aspnetForm').getAttribute("action").split('id=')[1].match('^\\d*');
    console.log('id = ' + id);
    return id;
}

function getLastJoinedXsIdKey(username) {
    return username + '_' + 'last_joined_xs_id';
}

function getLastCheckedXsIdKey(username) {
    return username + '_' + 'last_checked_xs_id';
}

function getLastCheckedXsPageKey(username) {
    return username + '_' + 'last_checked_xs_page';
}

function getProcessLastIndexXsKey(username) {
    return username + '_' + 'last_process_last_index_xs';
}

function listGmValues(username) {
    var gmKeys = getAllGmKey(username);
    gmKeys.forEach(function(gmKey) {
        console.log(gmKey + " = " + GM_getValue(gmKey));
    });
}

function deleteGmValues(username) {
    var gmKeys = getAllGmKey(username);
    gmKeys.forEach(function(gmKey) {
        GM_deleteValue(gmKey);
        console.log('delete ' + gmKey);
    });
    listGmValues(username);
}

function getAllGmKey(username) {
    var gmKeys = [];
    var i = 0;
    gmKeys[i++] = getLastJoinedXsIdKey(username);
    gmKeys[i++] = getLastCheckedXsIdKey(username);
    gmKeys[i++] = getLastCheckedXsPageKey(username);
    gmKeys[i++] = getProcessLastIndexXsKey(username);
    return gmKeys;
}

// document.querySelectorAll('div.list table tbody tr td a')[0].getAttribute('href').split('id=')

//alert('test1');
//console.log('test2');
//console.log('test3' + GM_getValue("foo"));

/*
$(document).load(function() {
    //var tmp = GM_getValue('last_joined_xs_id');  
    alert(tmp)
    console.log(tmp);
    // GM_setValue( 'last_joined_xs_id', 1234 );
    // console.log(GM_getValue('last_joined_xs_id'));
})
*/