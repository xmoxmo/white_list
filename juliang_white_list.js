/*
new Env('巨量IP白名单');
35 0-23 * * * juliang_white_list.js
by:xmo
巨量白名单自动替换
WxPusher一对一：设置WP_APP_TOKEN_ONE和WP_APP_MAIN_UID自动启动
*/

// 定义trade_no(业务编号)和key(提取API页面最下面)
let trade_no = '';
let key = '';
if (process.env.juliang_trade_no) {
  trade_no = process.env.juliang_trade_no;
}
if (process.env.juliang_key) {
  key = process.env.juliang_key;
}
//console.log(trade_no + '\n' + key)

if (trade_no == '') {
  console.log('请先定义export juliang_trade_no=(业务编号)');
  process.exit(0);
}
if (key == '') {
  console.log('请先定义export juliang_key=(api key)');
  process.exit(0);
}

// 一对一通知
let WP_APP_TOKEN_ONE = '';
let WP_APP_MAIN_UID = '';
if (process.env.WP_APP_TOKEN_ONE) {
  WP_APP_TOKEN_ONE = process.env.WP_APP_TOKEN_ONE;
}
if (process.env.WP_APP_MAIN_UID) {
  WP_APP_MAIN_UID = process.env.WP_APP_MAIN_UID;
}

const fs = require('fs');
const request = require('request');
const notify = require('./sendNotify');
const crypto = require('crypto');
const ipFileName = 'juliangIp.txt';

function readSavedIp() {
  try {
    const data = fs.readFileSync(ipFileName, 'utf8');
    return data.trim();
  } catch (error) {
    return null;
  }
}

function saveIp(ip) {
  fs.writeFileSync(ipFileName, ip);
}

// 获取当前IP
async function getCurrentIp(checkipurl) {
  const getIpUrl = checkipurl;
  try {
    let currentIP = await new Promise((resolve, reject) => {
      request.get(getIpUrl, (getIpError, getIpResponse, currentIP) => {
        if (getIpError) {
          reject(getIpError);
        } else {
          resolve(currentIP);
        }
      });
    });
    emojis = ['😊', '😎', '🚀', '🎉', '👍', '💡'];
    randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    var reg = /((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})(\.((2(5[0-5]|[0-4]\d))|[0-1]?\d{1,2})){3}/g;
    const arrcurrentIP = currentIP.match(reg);
    if (arrcurrentIP) {
      currentIP = arrcurrentIP[0];
      console.log(randomEmoji + ' 当前IP:', currentIP);
      await delay(2000);
      return currentIP;
    } else {
      console.log('💡 未获取到公网IPV4地址，返回空信息。详情：', currentIP);
      return null;
    }
  } catch (error) {
    console.error('💡 获取当前IP发生错误:', error);
    return null;
  }
}

// 添加IP到白名单
async function addIpToWhiteList(currentIP) {
  const inputString  = `new_ip=${currentIP}&old_ip=${readSavedIp()}&trade_no=${trade_no}&key=${key}`;
  const sign = crypto.createHash('md5').update(inputString).digest('hex');
  const addIpUrl = `http://v2.api.juliangip.com/dynamic/replaceWhiteIp?new_ip=${currentIP}&old_ip=${readSavedIp()}&trade_no=${trade_no}&sign=${sign}`;
  try {
    const addIpResponse = await new Promise((resolve, reject) => {
      request.get(addIpUrl, (addIpError, addIpResponse, addIpBody) => {
        if (addIpError) {
          reject(addIpError);
        } else {
          resolve({ response: addIpResponse, body: addIpBody });
        }
      });
    });
    emojis = ['😊', '😎', '🚀', '🎉', '👍', '💡'];
    randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    successCondition = addIpResponse.body.includes('请求成功');
    message = successCondition ? `🎉 IP地址已更新：${currentIP}` : `💡 IP地址添加失败: ${addIpResponse.body}`;
    title = successCondition ? "巨量白名单更换成功 ✅" : "巨量白名单更换失败 ❌"; 
    console.log(randomEmoji + ' 添加IP到白名单的响应:', addIpResponse.body);
    await delay(2000);
    return { success: successCondition, title, message };
  } catch (error) {
    console.error('💡 添加IP到白名单发生错误:', error);
    message = `'💡 IP地址添加失败:',${error}`;
    return { success: false, title: "巨量白名单更换失败 ❌", message };
  }
}

// 获取白名单IP
async function getwhiteip() {
  const inputString  = `trade_no=${trade_no}&key=${key}`;
  const sign = crypto.createHash('md5').update(inputString).digest('hex');
  const getIpUrl = `http://v2.api.juliangip.com/dynamic/getwhiteip?trade_no=${trade_no}&sign=${sign}`;
  const getIpResponse = await new Promise((resolve, reject) => {
    request.get(getIpUrl, (getIpError, getIpResponse, getIpBody) => {
      if (getIpError) {
        reject(getIpError);
      } else {
        resolve({ response: getIpResponse, body: getIpBody });
      }
    });
  });
  console.log('💡 获取当前白名单的响应：', getIpResponse.body);
  await delay(2000);
  return getIpResponse.body;
}

// 发送通知
async function sendNotification(messageInfo) {
  console.log('')
  const { title, message } = messageInfo;
  notify.sendNotify(title, message);
}

async function main() {
  console.log('')
  let currentIP = null;
  if (!currentIP) {
    console.log('💡 使用ident.me获取当前IP……');
    currentIP = await getCurrentIp('http://ident.me/');
    if (!currentIP) {
      console.log('💡 使用ident.me返回当前IP为空！');
    }
  }
  if (!currentIP) {
    console.log('💡 使用ip-api.com获取当前IP……');
    currentIP = await getCurrentIp('http://ip-api.com/json');
    if (!currentIP) {
      console.log('💡 使用ip-api.com返回当前IP为空！');
    }
  }
  if (!currentIP) {
    console.log('💡 使用synology.com获取当前IP……');
    currentIP = await getCurrentIp('https://checkip.synology.com/');
    if (!currentIP) {
      console.log('💡 使用synology.com返回当前IP为空！');
    }
  }
  if (!currentIP) {
    console.log('💡 使用httpbin.org获取当前IP……');
    currentIP = await getCurrentIp('http://httpbin.org/ip');
    if (!currentIP) {
      console.log('💡 使用httpbin.org返回当前IP为空！');
    }
  }
  const oldip = await readSavedIp();
  if (currentIP) {
    const whiteip = await getwhiteip();
    if (whiteip.includes('请求成功') == false) {
      console.log('❌ 白名单请求失败，终止执行');
      process.exit(0);
    } 
    if (whiteip.includes(currentIP) == true) {
      console.log('😎 当前IP在白名单中，终止执行');
    } else {
      console.log('💡 当前IP不在白名单响应中，尝试添加');
      resultMessage = await addIpToWhiteList(currentIP);
      await sendNotification(resultMessage);
      const wxpusherResponse = await wxpusherNotify(
        resultMessage.title,
        resultMessage.message
      );
    }
    if (oldip) {
      if (oldip.includes(currentIP) == false) {
        saveIp(currentIP);
      } else {
        // console.log("存储IP与当前IP一致");
      }
    } else {
      saveIp(currentIP);
    }
  } else {
    resultMessage = { success: false, title: "巨量获取公网IP失败 ❌", message: "💡 获取公网IP返回空信息，终止执行！" };
    await sendNotification(resultMessage);
    const wxpusherResponse = await wxpusherNotify(
      resultMessage.title,
      resultMessage.message
    );
  }
}

main();

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function wxpusherNotify(text, desp, strsummary = "") {
    return new Promise((resolve) => {
        if (WP_APP_TOKEN_ONE && WP_APP_MAIN_UID) {
            var WPURL = "https://www.juliangip.com/";            
            if (strsummary && strsummary.length > 96) {
                strsummary = strsummary.substring(0, 95) + "...";
            }
            let uids = [];
            for (let i of WP_APP_MAIN_UID.split(";")) {
                if (i.length != 0)
                    uids.push(i);
            };
            let topicIds = [];
            //desp = `<font size="3">${desp}</font>`;
            desp = desp.replace(/[\n\r]/g, '<br>'); // 默认为html, 不支持plaintext
            desp = `<section style="width: 24rem; max-width: 100%;border:none;border-style:none;margin:2.5rem auto;" id="shifu_imi_57"
                        donone="shifuMouseDownPayStyle(&#39;shifu_imi_57&#39;)">
                        <section
                            style="margin: 0px auto;text-align: left;border: 2px solid #212122;padding: 10px 0px;box-sizing:border-box; width: 100%; display:inline-block;"
                            class="ipaiban-bc">
                            <section style="margin-top: 1rem; float: left; margin-left: 1rem; margin-left: 1rem; font-size: 1.3rem; font-weight: bold;">
                                <p style="margin: 0; color: black">
                                    ${text}
                                </p>
                            </section>
                            <section style="display: block;width: 0;height: 0;clear: both;"></section>
                            <section
                                style="margin-top:20px; display: inline-block; border-bottom: 1px solid #212122; padding: 4px 20px; box-sizing:border-box;"
                                class="ipaiban-bbc">
                                <section
                                    style="width:25px; height:25px; border-radius:50%; background-color:#212122;display:inline-block;line-height: 25px"
                                    class="ipaiban-bg">
                                    <p style="text-align:center;font-weight:1000;margin:0">
                                        <span style="color: #ffffff;font-size:20px;">📢</span>
                                    </p>
                                </section>
                                <section style="display:inline-block;padding-left:10px;vertical-align: top;box-sizing:border-box;">
                                </section>
                            </section>
                            <section style="margin-top:0rem;padding: 0.8rem;box-sizing:border-box;">
                                <p style=" line-height: 1.6rem; font-size: 1.1rem; ">
                                    ${desp} 
                                </p>            
                            </section>
                        </section>
                    </section>`;
            const body = {
                appToken: `${WP_APP_TOKEN_ONE}`,
                content: `${desp}`,
                summary: `${text} ${strsummary}`,
                contentType: 2,
                topicIds: topicIds,
                uids: uids,
                url: `${WPURL}`,
            };
            const options = {
                url: `http://wxpusher.zjiecode.com/api/send/message`,
                body: JSON.stringify(body),
                headers: {
                    "Content-Type": "application/json",
                },
                timeout: 15000,
            };
            request.post(options, (err, resp, data) => {
                try {
                    if (err) {
                        console.log("WxPusher 发送通知调用 API 失败！！\n");
                        console.log(err);
                    } else {
                        data = JSON.parse(data);
                        if (data.code === 1000) {
                            console.log("WxPusher 发送通知消息成功!\n");
                        }
                    }
                } catch (e) {
                    $.logErr(e, resp);
                }
                finally {
                    resolve(data);
                }
            });
        } else {
            resolve();
        }
    });
}
