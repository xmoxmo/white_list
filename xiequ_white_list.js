/*
new Env('携趣IP白名单');
35 0-23 * * * xiequ_white_list.js
by:xmo
携趣白名单自动替换
WxPusher一对一：设置WP_APP_TOKEN_ONE和WP_APP_MAIN_UID自动启动
*/

// 定义uid(业务编号)和ukey(提取API页面最下面)
let uid = '';
let ukey= '';
if (process.env.XIEQU_UID) {		
	uid = process.env.XIEQU_UID;
}
if (process.env.XIEQU_UKEY) {		
	ukey = process.env.XIEQU_UKEY;
}
//console.log(uid + '\n' + ukey)

if (uid == ''){
    console.log('请先定义export XIEQU_UID=(UID)');
    process.exit(0);
}
if (ukey == ''){
    console.log('请先定义export XIEQU_UKEY=(UKEY)');
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
const ipFileName = 'xiequIp.txt';

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
async function getCurrentIp() {
  const getIpUrl = 'http://ident.me';
  try {
    const currentIP = await new Promise((resolve, reject) => {
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
    console.log(randomEmoji + ' 当前IP:', currentIP);
    await delay(2000);
    return currentIP;
  } catch (error) {
    console.error('获取当前IP发生错误:', error);
    return null;
  }
}

// 添加IP到白名单
async function addIpToWhiteList(currentIP) {
  // `http://op.xiequ.cn/IpWhiteList.aspx?uid=${uid}&ukey=${ukey}&act=del&ip=${readSavedIp()}`
  const addIpUrl = `http://op.xiequ.cn/IpWhiteList.aspx?uid=${uid}&ukey=${ukey}&act=add&ip=${currentIP}`;
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
    successCondition = addIpResponse.body.includes('success');
    message = successCondition ? `IP地址已更新：${currentIP}` : `IP地址添加失败: ${addIpResponse.body}`;
    title = successCondition ? "携趣白名单更换成功 ✅" : "携趣白名单更换失败 ❌"; 
    console.log(randomEmoji + ' 添加IP到白名单的响应:', addIpResponse.body);
    await delay(1000);
    return { success: successCondition, title, message };
  } catch (error) {
    console.error('添加IP到白名单发生错误:', error);
    message = `'IP地址添加失败:',${error}`;
    return { success: false, title: "携趣白名单更换失败 ❌", message };
  }
}

// 获取白名单IP
async function getwhiteip() {
  const getIpUrl = `http://op.xiequ.cn/IpWhiteList.aspx?uid=${uid}&ukey=${ukey}&act=get`;
  const getIpResponse = await new Promise((resolve, reject) => {
    request.get(getIpUrl, (getIpError, getIpResponse, getIpBody) => {
        if (getIpError) {
            reject(getIpError);
        } else {
            resolve({ response: getIpResponse, body: getIpBody });
        }
    });
  });
  return getIpResponse.body;
}

// 删除白名单IP
async function delwhiteip() {
  const delIpUrl = `http://op.xiequ.cn/IpWhiteList.aspx?uid=${uid}&ukey=${ukey}&act=del&ip=${readSavedIp()}`;
  const delIpResponse = await new Promise((resolve, reject) => {
    request.get(delIpUrl, (delIpError, delIpResponse, delIpBody) => {
        if (delIpError) {
            reject(delIpError);
        } else {
            resolve({ response: delIpResponse, body: delIpBody });
        }
    });
  });
  console.log('💡 白名单删除失效IP的响应:', delIpResponse.body);
  return delIpResponse.body;
}

// 发送通知
async function sendNotification(messageInfo) {
  console.log('')
  const { title, message } = messageInfo;
  notify.sendNotify(title, message);
}

async function main() {
  const currentIP = await getCurrentIp();
  const oldip = await readSavedIp();
  if (currentIP) {
    const whiteip = await getwhiteip();
    if (whiteip.includes(currentIP) == true){
        console.log('😎 当前IP在白名单中，终止执行');
    } else {
        resultMessage = await addIpToWhiteList(currentIP);
        if (oldip){
            if (whiteip.includes(oldip) == true){
                await delwhiteip()
            }
        }
        await sendNotification(resultMessage);
        const wxpusherResponse = await wxpusherNotify(
            resultMessage.title,
            resultMessage.message
        );
    }
    if (oldip){
        if (oldip.includes(currentIP) == false){
            saveIp(currentIP);
        } else {
            // console.log('存储IP与当前IP一致');
        }
    } else {
        saveIp(currentIP);
    }
  } else {
	  resultMessage = { success: false, title: "携趣获取公网IP失败 ❌", message: "获取公网IP返回空信息，请检查！" };
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
            var WPURL = "";            
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
