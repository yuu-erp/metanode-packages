# 📦 Hướng dẫn publish package lên NPM

Việc public một package lên [npmjs.com](https://npmjs.com) thường đi qua
4 công đoạn chính: **chuẩn bị package → build → tăng version →
publish**.

## 1. Chuẩn bị package

### 1.1. Tạo tài khoản npm

-   Vào <https://www.npmjs.com/signup> để đăng ký tài khoản.
-   Nếu muốn publish package công khai thì không cần trả phí.
-   Cài npm CLI (có sẵn khi cài Node.js).

### 1.2. Login

Trong terminal, chạy:

``` sh
pnpm login
```

Sau đó nhập: - **username**\
- **password**\
- **email** (phải verify trước khi publish)\
- Nếu bật **2FA**, npm sẽ hỏi OTP.

### 1.3. Cấu hình `package.json`

Ví dụ trong `packages/exceptions/package.json`:

``` json
{
  "name": "@metanode/exceptions",
  "version": "0.1.0",
  "description": "Exception handling utilities for metanode",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsup src/index.ts --dts --format esm,cjs",
    "publish:npm": "pnpm build && pnpm publish --access public"
  },
  "keywords": ["exceptions", "error-handling", "metanode"],
  "author": "Em",
  "license": "MIT"
}
```

📌 Lưu ý: - `name`: nếu dùng scope (ví dụ `@metanode/`) thì phải public
với `--access public`.\
- `version`: phải **tăng** mỗi lần publish mới.\
- `files`: chỉ nên include thư mục `dist/` để tránh publish rác.

------------------------------------------------------------------------

## 2. Build package

Đảm bảo đã có lệnh build:

``` sh
pnpm build
```

Nó sẽ tạo ra folder `dist/` với: - `index.js` (CJS)\
- `index.mjs` (ESM)\
- `index.d.ts` (TypeScript types)

------------------------------------------------------------------------

## 3. Tăng version

NPM không cho publish trùng version. Tăng version bằng lệnh:

``` sh
pnpm version patch   # 0.1.0 -> 0.1.1
pnpm version minor   # 0.1.0 -> 0.2.0
pnpm version major   # 0.1.0 -> 1.0.0
```

Lệnh này sẽ tự động chỉnh `package.json` + tạo Git tag.

------------------------------------------------------------------------

## 4. Publish package

### 4.1. Di chuyển vào thư mục package

``` sh
cd packages/exceptions
```

### 4.2. Chạy publish

``` sh
pnpm publish --access public
```

Nếu muốn chạy trực tiếp từ workspace root:

``` sh
pnpm --filter @metanode/exceptions publish --access public
```

------------------------------------------------------------------------

## 5. Kiểm tra kết quả

-   Lên
    [https://www.npmjs.com/package/@metanode/exceptions](https://www.npmjs.com/package/@metanode/exceptions)\
-   Hoặc thử install:

``` sh
pnpm add @metanode/exceptions
```

------------------------------------------------------------------------

## 6. (Optional) Tự động publish qua GitHub Actions

Nếu muốn CI/CD, có thể setup action khi merge vào `main`:

``` yaml
name: Publish Package

on:
  push:
    branches:
      - main

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org/'
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @metanode/exceptions build
      - run: pnpm --filter @metanode/exceptions publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

📌 `NPM_TOKEN` tạo trong [npm Access
Tokens](https://www.npmjs.com/settings/tokens) → add vào GitHub repo
secrets.

------------------------------------------------------------------------

✅ Done! Package của Em giờ đã publish xịn sò trên npm.
