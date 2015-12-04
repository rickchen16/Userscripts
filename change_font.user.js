// ==UserScript==
// @name        change font
// @namespace   biquge
// @include     http://www.biquge.com/*
// @include     http://www.biquge.la/*
// @version     1
// @description  自動修改筆趣閣內文字型為微軟正黑體
// @grant       none
// ==/UserScript==
window.addEventListener('load', function() {
    var element = document.getElementById('content');
    element.style.fontFamily = "Microsoft JhengHei";
    element.style.fontWeight = "bold";
}, false);