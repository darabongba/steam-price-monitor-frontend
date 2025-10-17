#!/usr/bin/env node

/**
 * B站视频信息抓取工具 - 获取首页视频信息
 * 用法：node bili-video-scraper.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const COZE_TOKEN='sat_DEdhkNFMSzv6Fq2WjQCYEsNgbyziEIlyzPX8U6yksPvYHRBXVbBmTzkNpUSzTSWz'
const axios = require('axios');
// 配置
const CONFIG = {
  // 目标页面
  targetUrl: 'https://www.bilibili.com/',
  DATA_DIR: path.join(__dirname, '../public/data'),
  // 视频卡片选择器
  videoCardSelector: '.bili-video-card__wrap',
  
  // 滚动配置
  scroll: {
    distance: 800,     // 每次滚动距离
    waitTime: 6000,    // 滚动后等待时间
    maxScrolls: 12     // 最大滚动次数
  },
  
  // 爬取限制
  limits: {
    maxNewVideos: 15   // 最大新增视频数量
  },
  
  // 浏览器配置
  browser: {
    headless: true,
    pageLoadTimeout: 60000,
    userDataDir: './bili-browser-data' // 用户数据目录
  },
  
  // 输出文件
  outputFile: 'bilibili-videos-data.json',
  outputTxtFile: 'bilibili-videos-list.txt'
};

// 存储收集的数据
let collectedVideos = [];
let processedVideoIds = new Set();
let scrollCount = 0;

// 获取随机延迟时间
function getRandomDelay(min = 1000, max = 3000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 格式化时间
function formatTime() {
  return new Date().toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// 等待指定时间
const sleep = (ms) => new Promise(resolve => {
  const randomDelay = getRandomDelay(ms * 0.8, ms * 1.2);
  console.log(`[${formatTime()}] 等待 ${randomDelay}ms`);
  return setTimeout(resolve, randomDelay);
});

// 确保目录存在
function ensureDirectoryExists(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`[${formatTime()}] 创建用户数据目录: ${dirPath}`);
    }
  } catch (error) {
    console.error(`[${formatTime()}] 创建目录失败:`, error.message);
  }
}

// 提取视频BV号
function extractBvId(url) {
  if (!url) return null;
  const match = url.match(/\/video\/(BV[a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

// 获取视频卡片元素
async function getVideoCards(page) {
  try {
    await page.waitForSelector(CONFIG.videoCardSelector, { timeout: 10000 });
    
    const cards = await page.$$(CONFIG.videoCardSelector);
    console.log(`[${formatTime()}] 找到 ${cards.length} 个视频卡片`);
    
    return cards;
  } catch (error) {
    console.error(`[${formatTime()}] 获取视频卡片失败:`, error.message);
    return [];
  }
}

// 根据视频信息筛选是否符合偏好
async function generateEval({author,title,cover,watchCount,duration}) {
    if(!title) return {};
    try {
      console.log(`正在为 "${title}" 生成分类及评价...`);
      const response = await axios.post('https://api.coze.cn/v1/workflow/run', {
        workflow_id: "7561708323479093248",
        parameters: {author,title,cover,watchCount,duration}
      }, {
        headers: {
          'Authorization': 'Bearer ' + COZE_TOKEN,
          'Content-Type': 'application/json'
        }
      });
  
      const evalInfo = JSON.parse(response.data.data);
      const ot =JSON.parse(evalInfo.output);
      return ot;
    } catch (error) {
      console.error('生成分类及评价失败:', error);
      return ot;
    }
  }

// 提取单个视频信息
async function extractVideoInfo(card) {
  try {
    
    const videoInfo = await card.evaluate(async el => {
      // 提取视频链接
      const videoLink = el.querySelector('.bili-video-card__image--link, .bili-video-card__info--tit a');
      const videoUrl = videoLink ? videoLink.href : null;
      
      // 提取标题
      const titleElement = el.querySelector('.bili-video-card__info--tit a, .bili-video-card__info--tit');
      const title = titleElement ? titleElement.textContent.trim() : null;
      let coverUrl = null;
      // 提取封面链接
      const coverElements = el.querySelectorAll('.bili-video-card__cover source');
      coverElements.forEach(element => {
        if (element.srcset.endsWith('.webp')||element.srcset.endsWith('.png')) {
          coverUrl = 'https:' + element.srcset;
        }
      });

      // 提取播放次数
      const playCountElement = el.querySelector('.bili-video-card__stats--text');
      const playCount = playCountElement ? playCountElement.textContent.trim() : null;
      
      // 提取时长
      const durationElement = el.querySelector('.bili-video-card__stats__duration');
      const duration = durationElement ? durationElement.textContent.trim() : null;
      
      // 提取作者信息
      const authorElement = el.querySelector('.bili-video-card__info--author');
      const author = authorElement ? authorElement.textContent.trim() : null;
      
      // 提取作者空间链接
      const authorLinkElement = el.querySelector('.bili-video-card__info--owner');
      let authorSpaceUrl = authorLinkElement ? authorLinkElement.href : null;
      
      // 处理相对链接
      if (authorSpaceUrl && authorSpaceUrl.startsWith('//')) {
        authorSpaceUrl = 'https:' + authorSpaceUrl;
      }


      // 提取发布日期
      const dateElement = el.querySelector('.bili-video-card__info--date');
      const publishDate = dateElement ? dateElement.textContent.replace('·', '').trim() : null;
     
      return {
        videoUrl,
        title,
        coverUrl,
        playCount,
        duration,
        author,
        authorSpaceUrl,
        publishDate
          };
    });
    
    // 提取BV号作为唯一标识
    const bvId = extractBvId(videoInfo.videoUrl);


    return {
      bvId,
      timestamp: new Date().toISOString(),
      ...videoInfo
    };
  } catch (error) {
    console.error(`[${formatTime()}] 提取视频信息失败:`, error.message);
    return null;
  }
}



// 处理视频卡片
async function processVideoCards(page, cards, maxNewVideos = Infinity) {
  let newVideosCount = 0;
  
  for (let i = 0; i < cards.length && newVideosCount < maxNewVideos; i++) {
    try {
      const card = cards[i];
      
      // 滚动到卡片位置确保可见
      await card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await sleep(500);
      
      let videoInfo = await extractVideoInfo(card);
      const res = await generateEval({author:videoInfo.author,
        title:videoInfo.title,
        cover:videoInfo.coverUrl,
        watchCount:videoInfo.playCount,
        duration:videoInfo.duration
    });
      console.log(videoInfo);
      console.log(res);
      if (videoInfo && videoInfo.bvId) {
        // 检查是否已处理过
        if (processedVideoIds.has(videoInfo.bvId)) {
          console.log(`[${formatTime()}] 跳过已处理的视频: ${videoInfo.bvId}`);
          continue;
        }
        if(res){
        // 添加新视频
        collectedVideos.push(videoInfo);
        processedVideoIds.add(videoInfo.bvId);
        newVideosCount++;
        
        console.log(`[${formatTime()}] 新增视频 [${i + 1}/${cards.length}]: ${videoInfo.title?.substring(0, 50)}...`);
        }else{
          console.log(`[${formatTime()}] 视频不符合筛选条件,跳过: ${videoInfo.title}`);
        }
      } else {
        console.log(`[${formatTime()}] 跳过无效视频卡片 [${i + 1}/${cards.length}]`);
      }
      
      // 随机延迟
      if (i < cards.length - 1) {
        await sleep(getRandomDelay(1000, 3000));
      }
      
    } catch (error) {
      console.error(`[${formatTime()}] 处理第 ${i + 1} 个视频卡片时出错:`, error.message);
    }
  }
  
  console.log(`[${formatTime()}] 本轮处理完成，新增 ${newVideosCount} 个视频`);
  return newVideosCount;
}

// 滚动加载更多内容
async function scrollAndLoadMore(page) {
  console.log(`[${formatTime()}] 开始滚动加载更多内容...`);
  
  const previousHeight = await page.evaluate(() => document.body.scrollHeight);
  
  // 滚动到页面底部
  await page.evaluate((distance) => {
    window.scrollBy(0, distance);
  }, CONFIG.scroll.distance);
  
  // 等待新内容加载
  await sleep(CONFIG.scroll.waitTime);
  
  const newHeight = await page.evaluate(() => document.body.scrollHeight);
  
  if (newHeight > previousHeight) {
    console.log(`[${formatTime()}] 成功加载更多内容 (高度: ${previousHeight} -> ${newHeight})`);
    return true;
  } else {
    console.log(`[${formatTime()}] 没有更多内容可加载 (高度保持: ${newHeight})`);
    return false;
  }
}

// 加载现有数据
function loadExistingData() {
  try {
    const outputPath = path.join(DATA_DIR, CONFIG.outputFile);
    if (fs.existsSync(outputPath)) {
      const data = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      console.log(`[${formatTime()}] 读取现有数据成功 (${data.length} 条记录)`);
      
      // 构建已处理视频ID集合
      data.forEach(video => {
        if (video.bvId) {
          processedVideoIds.add(video.bvId);
        }
      });
      
      console.log(`[${formatTime()}] 构建视频ID索引完成 (${processedVideoIds.size} 个唯一视频)`);
      return data;
    }
  } catch (error) {
    console.error(`[${formatTime()}] 读取现有数据失败:`, error.message);
  }
  return [];
}

// 保存数据
async function saveData(data, filename) {
  try {
    const outputPath = path.join(DATA_DIR, filename);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`[${formatTime()}] 数据已保存到: ${outputPath} (${data.length} 条记录)`);
  } catch (error) {
    console.error(`[${formatTime()}] 保存数据失败:`, error.message);
  }
}

// 保存文本格式列表
async function saveVideoList() {
  try {
    const txtContent = collectedVideos.map((video, index) => {
      return [
        `${index + 1}. ${video.title || '无标题'}`,
        `   BV号: ${video.bvId || 'N/A'}`,
        `   作者: ${video.author || '未知'} | 时长: ${video.duration || 'N/A'} | 播放: ${video.playCount || 'N/A'}`,
        `   链接: ${video.videoUrl || 'N/A'}`,
        `   作者空间: ${video.authorSpaceUrl || 'N/A'}`,
        `   发布时间: ${video.publishDate || 'N/A'}`,
        `   抓取时间: ${video.timestamp}`,
        ''
      ].join('\n');
    }).join('\n');
    
    const txtPath = path.join(DATA_DIR, CONFIG.outputTxtFile);
    fs.writeFileSync(txtPath, txtContent);
    
    console.log(`[${formatTime()}] 视频列表已保存到: ${txtPath}`);
  } catch (error) {
    console.error(`[${formatTime()}] 保存视频列表失败:`, error.message);
  }
}

// 主函数
async function main() {
  console.log(`\n=================================================`);
  console.log(`  B站视频信息抓取工具`);
  console.log(`=================================================`);
  console.log(`目标页面: ${CONFIG.targetUrl}`);
  console.log(`最大滚动次数: ${CONFIG.scroll.maxScrolls}`);
  console.log(`最大新增视频数量: ${CONFIG.limits.maxNewVideos}`);
  console.log(`输出文件: ${CONFIG.outputFile}`);
  console.log(`用户数据目录: ${CONFIG.browser.userDataDir}`);
  console.log(`=================================================\n`);
  
  // 加载现有数据
  collectedVideos = loadExistingData();
  
  // 确保用户数据目录存在
  ensureDirectoryExists(CONFIG.browser.userDataDir);
  
  // 启动浏览器
  console.log(`[${formatTime()}] 启动浏览器...`);
  const browser = await puppeteer.launch({
    headless: CONFIG.browser.headless,
    userDataDir: CONFIG.browser.userDataDir,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security'
    ],
    defaultViewport: null
  });
  
  try {
    const page = await browser.newPage();
    
    // 设置用户代理
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    
    // 访问B站首页
    console.log(`[${formatTime()}] 访问B站首页...`);
    await page.goto(CONFIG.targetUrl, {
      waitUntil: 'networkidle2',
      timeout: CONFIG.browser.pageLoadTimeout
    });
    
    // 等待页面完全加载
    await sleep(3000);
    
    let totalNewVideos = 0;
    
    // 主循环：获取视频、滚动加载更多
    while (scrollCount < CONFIG.scroll.maxScrolls && totalNewVideos < CONFIG.limits.maxNewVideos) {
      console.log(`\n[${formatTime()}] ========== 第 ${scrollCount + 1} 轮处理 ==========`);
      
      // 获取当前页面的视频卡片
      const cards = await getVideoCards(page);
      
      if (cards.length === 0) {
        console.log(`[${formatTime()}] 未找到视频卡片，可能页面未加载完成`);
        break;
      }
      
      // 处理视频卡片
      const newVideosInThisRound = await processVideoCards(page, cards, CONFIG.limits.maxNewVideos - totalNewVideos);
      totalNewVideos += newVideosInThisRound;
      
      // 实时保存数据
      await saveData(collectedVideos, CONFIG.outputFile);
      
      // 检查是否达到新增视频限制
      if (totalNewVideos >= CONFIG.limits.maxNewVideos) {
        console.log(`[${formatTime()}] 已达到最大新增视频数量限制 (${CONFIG.limits.maxNewVideos}个)，停止爬取`);
        break;
      }
      
      // 如果本轮没有新视频，尝试滚动
      if (newVideosInThisRound === 0) {
        console.log(`[${formatTime()}] 本轮无新视频，尝试滚动加载更多...`);
      }
      
      // 滚动加载更多内容
      const hasMoreContent = await scrollAndLoadMore(page);
      
      if (!hasMoreContent && newVideosInThisRound === 0) {
        console.log(`[${formatTime()}] 没有更多内容且无新视频，结束处理`);
        break;
      }
      
      scrollCount++;
      
      // 显示统计信息
      console.log(`[${formatTime()}] 当前统计: 本次新增 ${totalNewVideos}/${CONFIG.limits.maxNewVideos} 个视频, 总计 ${collectedVideos.length} 个视频, 滚动 ${scrollCount}/${CONFIG.scroll.maxScrolls} 次`);
    }
    
    // 最终统计
    console.log(`\n[${formatTime()}] ========== 抓取完成 ==========`);
    console.log(`- 本次新增视频: ${totalNewVideos} 个`);
    console.log(`- 总视频数量: ${collectedVideos.length} 个`);
    console.log(`- 唯一视频数量: ${processedVideoIds.size} 个`);
    console.log(`- 滚动轮次: ${scrollCount} 次`);
    let endReason = '没有更多内容';
    if (totalNewVideos >= CONFIG.limits.maxNewVideos) {
      endReason = '达到最大新增视频数量限制';
    } else if (scrollCount >= CONFIG.scroll.maxScrolls) {
      endReason = '达到最大滚动次数';
    }
    console.log(`- 结束原因: ${endReason}`);
    
    // 保存最终数据
    await saveData(collectedVideos, CONFIG.outputFile);
    
    // 保存文本格式列表
    await saveVideoList();
    
    // 生成统计报告
    generateReport();
    
  } catch (error) {
    console.error(`[${formatTime()}] 运行过程中发生错误:`, error);
  } finally {
    console.log(`[${formatTime()}] 关闭浏览器`);
    await browser.close();
  }
}

// 生成统计报告
function generateReport() {
  if (collectedVideos.length === 0) {
    console.log(`[${formatTime()}] 未收集到任何数据`);
    return;
  }
  
  console.log(`\n========== 数据统计报告 ==========`);
  
  // 统计作者数量
  const uniqueAuthors = new Set();
  collectedVideos.forEach(video => {
    if (video.author) {
      uniqueAuthors.add(video.author);
    }
  });
  console.log(`- 唯一作者数量: ${uniqueAuthors.size}`);
  
  // 统计有播放数据的视频
  const videosWithPlayCount = collectedVideos.filter(video => video.playCount && video.playCount !== 'N/A');
  console.log(`- 有播放数据的视频: ${videosWithPlayCount.length}`);
  
  // 统计有时长数据的视频
  const videosWithDuration = collectedVideos.filter(video => video.duration && video.duration !== 'N/A');
  console.log(`- 有时长数据的视频: ${videosWithDuration.length}`);
  
  console.log(`================================\n`);
}

// 运行脚本
main().catch(error => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});
