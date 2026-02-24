const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始构建 NestJS 项目...');

try {
  // 1. 构建
  execSync('npx nest build', { stdio: 'inherit' });
  console.log('✅ 构建完成！');

  // 2. 复制 .env
  const envSource = '.env';
  const envProdSource = '.env.production';
  const envDest = 'dist/.env';
  const envProdDest = 'dist/.env.production';

  if (fs.existsSync(envSource)) {
    fs.copyFileSync(envSource, envDest);
    console.log(`✅ 已复制 ${envSource} 到 ${envDest}`);
  } else {
    console.warn(`⚠️  ${envSource} 不存在，跳过复制`);
  }

  if (fs.existsSync(envProdSource)) {
    fs.copyFileSync(envProdSource, envProdDest);
    console.log(`✅ 已复制 ${envProdSource} 到 ${envProdDest}`);
  } else if (fs.existsSync(envSource)) {
    fs.copyFileSync(envSource, envProdDest);
    console.log(`✅ 已复制 ${envSource} 到 ${envProdDest}`);
  } else {
    console.warn(`⚠️  ${envProdSource} 和 ${envSource} 都不存在，跳过复制`);
  }

  console.log('🎉 所有操作完成！');
} catch (error) {
  console.error('❌ 执行失败:', error.message);
  process.exit(1);
}