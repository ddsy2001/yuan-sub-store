const { type, name } = $arguments
const compatible_outbound = {
  tag: 'COMPATIBLE',
  type: 'direct',
}

let compatible
let config = JSON.parse($files[0])
let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
})

config.outbounds.push(...proxies)

config.outbounds.map(i => {
  if (['all', 'all-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies))
  }
  if (['hk', 'hk-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /港|hk|hongkong|hong kong|🇭🇰/i))
  }
  if (['tw', 'tw-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /台|tw|taiwan|🇹🇼/i))
  }
  if (['jp', 'jp-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /日本|jp|japan|🇯🇵/i))
  }
  if (['sg', 'sg-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /^(?!.*(?:us)).*(新|sg|singapore|🇸🇬)/i))
  }
  if (['us', 'us-auto'].includes(i.tag)) {
    i.outbounds.push(...getTags(proxies, /美|us|unitedstates|united states|🇺🇸/i))
  }
})

config.outbounds.forEach(outbound => {
  if (Array.isArray(outbound.outbounds) && outbound.outbounds.length === 0) {
    if (!compatible) {
      config.outbounds.push(compatible_outbound)
      compatible = true
    }
    outbound.outbounds.push(compatible_outbound.tag);
  }
});

// ================= 核心修改区 =================
// 强制复写 rule_set，全部走官方直连并使用 proxy 节点下载
if (!config.route) config.route = {};
config.route.rule_set = [
  {
    "tag": "google_play",
    "type": "remote",
    "format": "binary",
    "url": "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/SingBox/GooglePlay/GooglePlay.srs",
    "download_detour": "proxy"
  },
  {
    "tag": "google_fcm",
    "type": "remote",
    "format": "binary",
    "url": "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/SingBox/GoogleFCM/GoogleFCM.srs",
    "download_detour": "proxy"
  },
  {
    "tag": "openai",
    "type": "remote",
    "format": "binary",
    "url": "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/SingBox/OpenAI/OpenAI.srs",
    "download_detour": "proxy"
  },
  {
    "tag": "google_photos",
    "type": "remote",
    "format": "binary",
    "url": "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/SingBox/GooglePhotos/GooglePhotos.srs",
    "download_detour": "proxy"
  },
  {
    "tag": "telegram",
    "type": "remote",
    "format": "binary",
    "url": "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/SingBox/Telegram/Telegram.srs",
    "download_detour": "proxy"
  },
  {
    "tag": "youtube",
    "type": "remote",
    "format": "binary",
    "url": "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/SingBox/YouTube/YouTube.srs",
    "download_detour": "proxy"
  },
  {
    "tag": "gemini",
    "type": "remote",
    "format": "binary",
    "url": "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/SingBox/Gemini/Gemini.srs",
    "download_detour": "proxy"
  },
  {
    "tag": "cn_domain",
    "type": "remote",
    "format": "binary",
    "url": "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/SingBox/ChinaMax/ChinaMax.srs",
    "download_detour": "proxy"
  },
  {
    "tag": "cn_ip",
    "type": "remote",
    "format": "binary",
    "url": "https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/SingBox/ChinaIPs/ChinaIPs.srs",
    "download_detour": "proxy"
  }
];

// 转回字符串
$content = JSON.stringify(config, null, 2)

// 暴力清理 Sub-Store 可能强加的 jsdelivr 或其他 CDN 前缀，确保绝对直连 GitHub
$content = $content.replace(/https?:\/\/(?:fastly|cdn|gcore)\.jsdelivr\.net\/gh\/([^/]+)\/([^/@]+)(?:@[^/]+)?\//g, 'https://raw.githubusercontent.com/$1/$2/master/');
$content = $content.replace(/https?:\/\/[^\/]+\/(https:\/\/raw\.githubusercontent\.com)/g, '$1');
// ==============================================

function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag)
}
