/**
 * UA 解析器测试脚本
 * 用于测试 UA 解析器和集成到 UrlAnalyzer 中的功能
 */

const UaParser = require('../src/parser/ua-parser');
const UrlAnalyzer = require('../src/parser/url-analyzer');

// 模拟配置对象
const config = {
  urlFilters: {
    allowedDomains: [],
    excludePatterns: []
  }
};

// 测试用例
const testCases = [
  {
    name: 'Chrome on Windows',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    expected: {
      browser: { name: 'Chrome', version: '91.0.4472.124' },
      os: { name: 'Windows', version: '10' },
      deviceType: 'desktop'
    }
  },
  {
    name: 'Safari on iPhone',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    expected: {
      browser: { name: 'Safari', version: '14.0' },
      os: { name: 'iOS', version: '14.6' },
      deviceType: 'mobile'
    }
  },
  {
    name: 'MDCrawl',
    userAgent: 'MDCrawl/1.0.0 (+https://github.com/yourusername/mdcrawl)',
    expected: {
      browser: { name: 'MDCrawl', version: '1.0.0' },
      os: { name: 'Unknown', version: 'Unknown' },
      deviceType: 'Unknown'
    }
  },
  {
    name: 'Empty User-Agent',
    userAgent: '',
    expected: {
      browser: { name: 'Unknown', version: 'Unknown' },
      os: { name: 'Unknown', version: 'Unknown' },
      deviceType: 'Unknown'
    }
  }
];

// 运行测试
function runTests() {
  console.log('开始运行 UA 解析器测试...\n');
  
  // 创建解析器实例
  const uaParser = new UaParser(config);
  const urlAnalyzer = new UrlAnalyzer(config);
  
  // 测试每个用例
  testCases.forEach(testCase => {
    console.log(`测试用例: ${testCase.name}`);
    console.log(`User-Agent: ${testCase.userAgent}`);
    
    // 使用 UaParser 解析
    const result = uaParser.parse(testCase.userAgent);
    console.log('解析结果:', JSON.stringify(result, null, 2));
    
    // 验证结果
    const isMatch = JSON.stringify(result) === JSON.stringify(testCase.expected);
    console.log(`预期结果: ${JSON.stringify(testCase.expected)}`);
    console.log(`测试结果: ${isMatch ? '通过' : '失败'}\n`);
    
    // 测试 UrlAnalyzer 集成方法
    console.log('测试 UrlAnalyzer 集成方法:');
    console.log('  浏览器信息:', JSON.stringify(urlAnalyzer.getBrowserInfo(testCase.userAgent)));
    console.log('  操作系统信息:', JSON.stringify(urlAnalyzer.getOSInfo(testCase.userAgent)));
    console.log('  设备类型:', urlAnalyzer.getDeviceType(testCase.userAgent));
    console.log('  是否为移动设备:', urlAnalyzer.isMobileDevice(testCase.userAgent));
    console.log('  是否为爬虫:', urlAnalyzer.isCrawler(testCase.userAgent));
    console.log('');
  });
  
  console.log('测试完成!');
}

// 运行测试
runTests();