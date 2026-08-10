# CYSO Editor Packager

CYSO Editor 的项目打包器，可将 CYSO Editor 项目转换为 HTML 文件、ZIP 压缩包或可执行程序。基于 [TurboWarp/packager](https://github.com/TurboWarp/packager) 深度定制。

## 主要改动

- **CYSO 品牌**：`src/packager/brand.js` 等适配 CYSO 品牌。
- **安全集成**：`generate-standalone.js` 集成 CYSO Core 安全校验，打包产物包含权限保护。
- **自定义脚手架**：`scaffolding.js` 支持 CYSO 自定义脚手架。
- **本地化**：更新 zh-cn / en 文案。
- **新模块**：新增 `src/cyso/` 权限相关模块。

## 开发

```bash
npm ci
npm run build  # 构建打包器 bundle
```

## 与 Desktop 的关系

CYSO Editor Desktop 在运行时通过 `tw-packager://./standalone.html` 加载打包器界面，该文件是 packager 仓库的构建产物。自定义打包器的逻辑应修改本仓库源码后重新构建，并将产物同步至 desktop 的 `src-renderer/packager/`。

## 相关仓库

- [CYSO-Editor/desktop](https://github.com/CYSO-Editor/desktop)：桌面客户端

## License

[MPL-2.0](./LICENSE)
