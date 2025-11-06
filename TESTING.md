# 测试指南

## 概述

本项目使用现代化的测试框架来确保代码质量和功能正确性：
- **后端**: Jest + Supertest
- **前端**: Vitest + React Testing Library

## 测试统计

当前测试覆盖情况：
- ✅ 后端测试: 16 个测试用例通过
- ✅ 前端测试: 21 个测试用例通过

## 快速开始

### 后端测试

```bash
cd backend

# 运行所有测试
npm test

# 监听模式（开发时使用）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# CI 环境运行
npm run test:ci
```

### 前端测试

```bash
cd frontend

# 运行所有测试
npm test

# 监听模式（开发时使用）
npm test -- --watch

# UI 模式（可视化测试界面）
npm run test:ui

# 生成覆盖率报告
npm run test:coverage

# CI 环境运行
npm run test:ci
```

## 测试结构

### 后端测试结构

```
backend/
├── tests/
│   ├── setup.ts              # 测试环境设置
│   ├── utils/                # 工具函数测试
│   │   ├── password.test.ts
│   │   └── jwt.test.ts
│   ├── routes/               # API 路由测试（待添加）
│   └── services/             # 服务层测试（待添加）
└── jest.config.js            # Jest 配置
```

### 前端测试结构

```
frontend/
├── src/
│   └── tests/
│       ├── setup.ts          # 测试环境设置
│       ├── utils/            # 工具函数测试
│       │   └── formatters.test.ts
│       └── components/       # 组件测试
│           └── Button.test.tsx
└── vite.config.ts            # Vitest 配置
```

## 编写测试

### 后端测试示例

#### 工具函数测试

```typescript
// tests/utils/example.test.ts
import { myFunction } from '../../src/utils/example';

describe('MyFunction', () => {
  it('应该返回正确的结果', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

#### API 路由测试

```typescript
// tests/routes/example.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('GET /api/example', () => {
  it('应该返回 200 状态码', async () => {
    const response = await request(app)
      .get('/api/example')
      .expect(200);

    expect(response.body).toHaveProperty('data');
  });
});
```

### 前端测试示例

#### 工具函数测试

```typescript
// src/tests/utils/example.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '../../utils/example';

describe('MyFunction', () => {
  it('应该返回正确的结果', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

#### 组件测试

```typescript
// src/tests/components/Example.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Example } from '../../components/Example';

describe('Example Component', () => {
  it('应该渲染正确的文本', () => {
    render(<Example text="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('应该处理点击事件', () => {
    const handleClick = vi.fn();
    render(<Example onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## 测试最佳实践

### 1. 测试命名

使用清晰的测试描述：
```typescript
// ✅ 好的命名
it('应该在密码错误时返回 401 状态码', () => {});

// ❌ 不好的命名
it('测试登录', () => {});
```

### 2. 测试组织

使用 `describe` 块组织相关测试：
```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('应该创建新用户', () => {});
    it('应该在邮箱重复时抛出错误', () => {});
  });

  describe('updateUser', () => {
    it('应该更新用户信息', () => {});
  });
});
```

### 3. 测试隔离

每个测试应该独立运行：
```typescript
beforeEach(() => {
  // 每个测试前重置状态
  cleanupDatabase();
});

afterEach(() => {
  // 每个测试后清理
  cleanup();
});
```

### 4. Mock 外部依赖

```typescript
// 前端 - Mock API 调用
vi.mock('../api/client', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: [] }),
}));

// 后端 - Mock 数据库
jest.mock('../utils/database', () => ({
  query: jest.fn().mockResolvedValue([]),
}));
```

### 5. 测试覆盖率目标

- 工具函数: 100%
- 服务层: > 80%
- 路由/控制器: > 70%
- 组件: > 70%

## CI/CD 集成

### GitHub Actions

测试会在以下情况自动运行：
- Push 到 `main` 或 `develop` 分支
- 创建 Pull Request

查看 `.github/workflows/test.yml` 了解详细配置。

### 本地运行 CI 测试

模拟 CI 环境运行测试：

```bash
# 后端
cd backend
npm run test:ci

# 前端
cd frontend
npm run test:ci
```

## 覆盖率报告

### 查看覆盖率报告

运行测试后，覆盖率报告会生成在：
- 后端: `backend/coverage/`
- 前端: `frontend/coverage/`

在浏览器中打开 HTML 报告：
```bash
# 后端
open backend/coverage/lcov-report/index.html

# 前端
open frontend/coverage/index.html
```

### 覆盖率指标

关注以下指标：
- **Statements**: 语句覆盖率
- **Branches**: 分支覆盖率
- **Functions**: 函数覆盖率
- **Lines**: 行覆盖率

## 故障排查

### 常见问题

#### 1. 测试超时

```typescript
// 增加特定测试的超时时间
it('长时间运行的测试', async () => {
  // ...
}, 30000); // 30秒超时
```

#### 2. 模块导入错误

确保在测试中正确设置环境变量：
```typescript
// tests/setup.ts
process.env.NODE_ENV = 'test';
```

#### 3. 前端组件渲染错误

检查是否正确 mock 了所有依赖：
```typescript
// src/tests/setup.ts
vi.mock('../config/sentry', () => ({
  initSentry: vi.fn(),
}));
```

## 持续改进

### 待添加的测试

- [ ] API 路由完整测试套件
- [ ] 数据库模型测试
- [ ] 中间件测试
- [ ] 复杂组件的集成测试
- [ ] E2E 测试（使用 Playwright）

### 测试优化

- 使用并行测试加快执行速度
- 添加更多的快照测试
- 实现视觉回归测试

## 相关资源

- [Jest 文档](https://jestjs.io/)
- [Vitest 文档](https://vitest.dev/)
- [React Testing Library 文档](https://testing-library.com/react)
- [Supertest 文档](https://github.com/visionmedia/supertest)
