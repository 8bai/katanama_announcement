// ------------ user rewritable param -------------- //
const URL = "https://com.nicovideo.jp/community/co5347666";
const SearchIntervalTimeMs = 60000;
const SearchTimeoutTimeMs = 30000;
const IsShowConsoleLog = false;
const IsSearchingForever = true;

// ------------ function ------------------ //

const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');
const notifier = require('node-notifier');
const open = require('open');

let counter = 1;
let searchedlives = [];
let username;

const scrapeing = async () => {
    const browser = await puppeteer.launch();
    try {
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(SearchTimeoutTimeMs);
        await page.goto(URL, { waitUntil: 'networkidle0' });
        if (IsShowConsoleLog) console.log(`${counter}回目 通信中...`);
        counter += 1;
        const target = 'body > header.area-communityInformation > div:nth-child(2) > section > a';
        const links = await page.$eval(target, links => {
            return links.href;
        });
        if (searchedlives.includes(links)) { throw new Error("SearchedLives") };
        console.log("生放送始まっとるわ！");
        notifier.notify({
            title: '片生通知',
            message: `${username}さんの生放送が始まりました`,
            icon: path.join(__dirname, 'icon.jpg'),
        }, function () {
            open(links);
        });
        if (IsSearchingForever) {
            searchedlives.push(links);
            console.log("引き続き監視を続けます。(今来た通知の生放送は無視されます)");
        } else {
            console.log("監視を終了します。");
            process.exit(1)
        }
    }
    catch (err) {
        if (IsShowConsoleLog) {
            if (err.message.startsWith("net::ERR")) {
                console.log("通信に失敗しました（タイムアウト）")
            } else if (err.message == "SearchedLives") {
                console.log("生放送は既に始まっています。")
            } else {
                console.log("生放送は開始されていません。")
            }
        }
    }
    browser.close();
}

const firstScrapeing = async () => {
    const browser = await puppeteer.launch();
    try {
        console.log('□□□');
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(SearchIntervalTimeMs);
        await page.goto(URL);
        console.log('■□□');
        const usernametarget = 'body > header.area-communityHeader > div > div.communityInfo > div.communityData > table.communityDetail > tbody > tr:nth-child(1) > td > a';
        username = await page.$eval(usernametarget, links => {
            return links.innerHTML;
        });
        username = username.trim();
        console.log('■■□');
        const imgtarget = 'body > header.area-communityHeader > div > div.communityInfo > div.communityThumbnail > a > img';
        const image = await page.$(imgtarget);
        const src = await image.getProperty('src');
        const source = await src.jsonValue();
        const viewer = await page.goto(source);
        console.log('■■■');
        await fs.writeFile('./icon.jpg', await viewer.buffer(), (err) => {
            if (err) {
                return console.log(err);
            }
        });
        console.log(`読み込み完了：${username}さんのコミュニティを見ます`);
    }
    catch (err) {
    }
    browser.close();
}

console.log("生放送の監視を開始します...C+Ctrlで終了");
console.log("初期データ取得")
firstScrapeing();
setInterval(scrapeing, SearchIntervalTimeMs);