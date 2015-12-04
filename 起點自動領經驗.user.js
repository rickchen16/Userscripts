// ==UserScript==
// @name       起點自動領經驗
// @namespace  http://yz.homepage/
// @version    0.1
// @description  打開起點 經驗值等級頁面(http://me.qidian.com/profile/score.aspx), 如果有可領取的經驗, 會自動領取
// @match      http://me.qidian.com/profile/score.aspx*
// @copyright  2015+, YZ
// @grant none
// ==/UserScript==
//the window reload function. you could of course do anything here
function forceMidnightPageReload() {
    window.location.reload(true);
}

//helper function to build up the desire time trigger
function forceMidnightPageReloadGetTargetTime(hour, minute) {
    var t = new Date();
    // 隔天
    t.setDate(t.getDate() + 1);
    t.setHours(hour);
    t.setMinutes(minute);
    t.setSeconds(0);
    t.setMilliseconds(0);
    return t;
}

$(document).ready(function() {
    //get your offset to wait value
    // var timetarget = forceMidnightPageReloadGetTargetTime(23,59).getTime();
    var timetarget = forceMidnightPageReloadGetTargetTime(0, 0).getTime();
    var timenow = new Date().getTime();
    var offsetmilliseconds = timetarget - timenow;

    console.log('offsetmilliseconds = ' + offsetmilliseconds);

    //if it isn't midnight yet, set a timeout.
    if (offsetmilliseconds >= 0) {
        setTimeout(function() {
            forceMidnightPageReload();
        }, offsetmilliseconds);
    }

    var clickEvent = document.createEvent('HTMLEvents');
    clickEvent.initEvent('click', true, true);
    var plusItems = $('.plus-items li a:contains("可领取")');
    if (plusItems.length > 0) {
        plusItems[0].dispatchEvent(clickEvent);
        var observer = new MutationObserver(function(mutations) {
            if ($('.[id^=btnClose]').length > 0) {
                $('.[id^=btnClose]')[0].dispatchEvent(clickEvent);
                observer.disconnect();
            }
        });
        var config = {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        };
        // var target = document.querySelector('*[id^=btnClose]');
        // 由於彈出的視窗是直接新增到body下的, 所以上面語句回傳為null導致fail
        var target = document.querySelector('body');
        observer.observe(target, config);
    }
});