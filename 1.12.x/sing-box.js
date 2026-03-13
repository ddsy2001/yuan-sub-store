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

// ================= 新增：自动将规则下载改为走代理 =================
if (config.route && Array.isArray(config.route.rule_set)) {
  config.route.rule_set.forEach(rs => {
    if (rs.type === 'remote') {
      rs.download_detour = 'proxy'; // 让所有远程规则走 'proxy' 节点组下载
    }
  });
}
// ==================================================================

// 将配置转回文本
$content = JSON.stringify(config, null, 2)

// ================= 强制替换 CDN 逻辑 =================
// 强制将 jsdelivr 替换回原始的 raw.githubusercontent.com
$content = $content.replace(/https?:\/\/(fastly|cdn)\.jsdelivr\.net\/gh\/([^/]+)\/([^/@]+)(?:@([^/]+))?\//g, 'https://raw.githubusercontent.com/$2/$3/$4/');
// 强制清理诸如 ghfast, ghproxy 等第三方加速前缀
$content = $content.replace(/https?:\/\/[^\/]+\/(https:\/\/raw\.githubusercontent\.com)/g, '$1');
// =====================================================

function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag)
}
