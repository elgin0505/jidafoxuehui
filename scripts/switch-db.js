const fs = require('fs');
const path = require('path');

const target = process.argv[2];
if (!target || !['sqlite', 'postgres', 'postgresql'].includes(target)) {
  console.log('Usage: node scripts/switch-db.js [sqlite|postgres]');
  process.exit(1);
}

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

if (target === 'sqlite') {
  content = content.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  content = content.replace(/^\s*directUrl\s*=.*$/gm, '  // directUrl = env("DIRECT_URL")');
  fs.writeFileSync(schemaPath, content, 'utf8');
  console.log('✅ Prisma schema 数据源已切换为: sqlite (本地开发)');
} else {
  content = content.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  content = content.replace(/^\s*\/\/\s*directUrl\s*=.*$/gm, '  directUrl = env("DIRECT_URL")');
  fs.writeFileSync(schemaPath, content, 'utf8');
  console.log('✅ Prisma schema 数据源已切换为: postgresql (Vercel 部署)');
}
