// ==UserScript==
// @name         youtube-adb
// @name:zh-CN   YouTube去广告
// @name:zh-TW   YouTube去廣告
// @name:zh-HK   YouTube去廣告
// @name:zh-MO   YouTube去廣告
// @namespace    https://github.com/iamfugui/youtube-adb
// @version      6.20
// @description  A script to remove YouTube ads, including static ads and video ads, without interfering with the network and ensuring safety.
// @description:zh-CN   脚本用于移除YouTube广告，包括静态广告和视频广告。不会干扰网络，安全。
// @description:zh-TW   腳本用於移除 YouTube 廣告，包括靜態廣告和視頻廣告。不會干擾網路，安全。
// @description:zh-HK   腳本用於移除 YouTube 廣告，包括靜態廣告和視頻廣告。不會干擾網路，安全。
// @description:zh-MO   腳本用於移除 YouTube 廣告，包括靜態廣告和視頻廣告。不會干擾網路，安全。
// @match        *://*.youtube.com/*
// @exclude      *://accounts.youtube.com/*
// @exclude      *://www.youtube.com/live_chat_replay*
// @exclude      *://www.youtube.com/persist_identity*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=YouTube.com
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    let video;
    const cssSelectorArr = [
        `#masthead-ad`, // 首页顶部横幅广告
        `ytd-rich-item-renderer.style-scope.ytd-rich-grid-row #content:has(.ytd-display-ad-renderer)`, // 首页视频排版广告
        `.video-ads.ytp-ad-module`, // 播放器底部广告
        `tp-yt-paper-dialog:has(yt-mealbar-promo-renderer)`, // 播放页会员促销广告
        `ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]`, // 播放页右上方推荐广告
        `#related #player-ads`, // 播放页评论区右侧推广广告
        `#related ytd-ad-slot-renderer`, // 播放页评论区右侧视频排版广告
        `ytd-ad-slot-renderer`, // 搜索页广告
        `yt-mealbar-promo-renderer`, // 播放页会员推荐广告
        `ytd-popup-container:has(a[href="/premium"])`, // 会员拦截广告
        `ad-slot-renderer`, // M播放页第三方推荐广告
        `ytm-companion-ad-renderer`, // M可跳过的视频广告链接处
    ];
    window.dev = false; // 开发使用

    function moment(time) {
        let y = time.getFullYear();
        let m = (time.getMonth() + 1).toString().padStart(2, `0`);
        let d = time.getDate().toString().padStart(2, `0`);
        let h = time.getHours().toString().padStart(2, `0`);
        let min = time.getMinutes().toString().padStart(2, `0`);
        let s = time.getSeconds().toString().padStart(2, `0`);
        return `${y}-${m}-${d} ${h}:${min}:${s}`;
    }

    function log(msg) {
        if (!window.dev) {
            return; // 不输出日志
        }
        console.log(window.location.href);
        console.log(`${moment(new Date())}  ${msg}`);
    }

    function setRunFlag(name) {
        let style = document.createElement(`style`);
        style.id = name;
        (document.head || document.body).appendChild(style);
    }

    function getRunFlag(name) {
        return document.getElementById(name);
    }

    function checkRunFlag(name) {
        if (getRunFlag(name)) {
            return true;
        } else {
            setRunFlag(name);
            return false;
        }
    }

    function generateRemoveADHTMLElement(id) {
        if (checkRunFlag(id)) {
            log(`屏蔽页面广告节点已生成`);
            return false;
        }

        let style = document.createElement(`style`); 
        (document.head || document.body).appendChild(style); 
        style.appendChild(document.createTextNode(generateRemoveADCssText(cssSelectorArr)));
        log(`生成屏蔽页面广告节点成功`);
    }

    function generateRemoveADCssText(cssSelectorArr) {
        cssSelectorArr.forEach((selector, index) => {
            cssSelectorArr[index] = `${selector}{display:none!important}`;
        });
        return cssSelectorArr.join(` `);
    }

    function getVideoDom() {
        video = document.querySelector(`.ad-showing video`) || document.querySelector(`video`);
    }

    function playAfterAd() {
        if (video.paused && video.currentTime < 1) {
            video.play();
            log(`自动播放视频`);
        }
    }

    function closeOverlay() {
        const premiumContainers = [...document.querySelectorAll(`ytd-popup-container`)];

        const matchingContainers = premiumContainers.filter(container => container.querySelector(`a[href="/premium"]`));

        if (matchingContainers.length > 0) {
            matchingContainers.forEach(container => container.remove());
            log(`移除YT拦截器`);
        }

        const backdrops = document.querySelectorAll(`tp-yt-iron-overlay-backdrop`);
        const targetBackdrop = Array.from(backdrops).find(
            (backdrop) => backdrop.style.zIndex === `2201`
        );
        if (targetBackdrop) {
            targetBackdrop.className = ``; 
            targetBackdrop.removeAttribute(`opened`); 
            log(`关闭遮罩层`);
        }
    }

    function skipAd() {
        const skipButton = document.querySelector(`.ytp-ad-skip-button`) || document.querySelector(`.ytp-skip-ad-button`) || document.querySelector(`.ytp-ad-skip-button-modern`);
        const shortAdMsg = document.querySelector(`.video-ads.ytp-ad-module .ytp-ad-player-overlay`) || document.querySelector(`.ytp-ad-button-icon`);

        if ((skipButton || shortAdMsg) && window.location.href.indexOf(`https://m.youtube.com/`) === -1) {
            video.muted = true;
        }

        if (skipButton) {
            const delayTime = 0.5;
            setTimeout(skipAd, delayTime * 1000);
            if (video.currentTime > delayTime) {
                video.currentTime = video.duration; 
                log(`特殊账号跳过按钮广告`);
                return;
            }
            skipButton.click(); 
            log(`点击跳过广告按钮`);
        }
    }

    function removePlayerAD() {
        getVideoDom();
        if (video) {
            playAfterAd();
        }
        closeOverlay();
        skipAd();
    }

    function startObserver() {
        const observer = new MutationObserver((mutationsList) => {
            removePlayerAD();
            generateRemoveADHTMLElement(`adCss`);
        });

        observer.observe(document.body, { childList: true, subtree: true });
        log(`广告监测器已启动`);
    }

    function init() {
        generateRemoveADHTMLElement(`adCss`);
        startObserver();
    }

    window.addEventListener('load', init);
})();
