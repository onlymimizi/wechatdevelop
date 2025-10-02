# 装修计算器 - 微信小程序

一个功能完整的装修材料用量计算微信小程序，支持多种材料类型计算、深色主题、云端同步等功能。

## 📱 功能特色

### 🏠 材料计算
- **瓷砖计算**：支持多种规格瓷砖，自动计算损耗
- **油漆计算**：墙面涂料用量精确计算
- **腻子计算**：墙面找平材料用量计算
- **多房间支持**：可添加多个房间进行批量计算

### ✨ 高级功能
- **复杂场景计算**：支持异型房间、复杂铺贴方式
- **智能损耗计算**：根据材料类型和铺贴方式自动调整损耗率
- **模板库**：预设常见装修场景模板
- **计算历史**：保存和管理历史计算记录

### 🎨 用户体验
- **深色主题**：完整的深色模式支持
- **iOS风格设计**：现代化的用户界面
- **触觉反馈**：丰富的交互体验
- **分享功能**：支持微信好友和朋友圈分享

### ☁️ 云端功能
- **数据同步**：计算记录云端备份
- **多设备同步**：不同设备间数据同步
- **设置同步**：主题偏好等设置云端保存

## 🛠️ 技术架构

### 前端技术
- **框架**：微信小程序原生开发
- **样式**：WXSS + CSS3动画
- **状态管理**：全局数据管理
- **本地存储**：wx.storage API

### 后端服务
- **云函数**：微信云开发
- **数据库**：云数据库
- **存储**：云存储

### 核心功能模块
```
├── pages/
│   ├── materials/     # 首页 - 材料选择
│   ├── input/         # 房屋信息输入
│   ├── result/        # 计算结果展示
│   ├── history/       # 计算历史
│   ├── templates/     # 模板库
│   ├── settings/      # 设置页面
│   └── profile/       # 个人中心
├── cloudfunctions/    # 云函数
│   ├── saveCalcRecord/      # 保存计算记录
│   ├── getCalcRecords/      # 获取计算记录
│   ├── deleteCalcRecord/    # 删除计算记录
│   ├── syncUserData/        # 用户数据同步
│   └── trackEvent/          # 事件统计
└── images/           # 静态资源
```

## 🚀 快速开始

### 环境要求
- 微信开发者工具 1.06.0+
- Node.js 16.0+
- 微信小程序账号

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/onlymimizi/wechatdevelop.git
cd wechatdevelop
```

2. **配置AppID**
在 `project.config.json` 中修改你的小程序AppID：
```json
{
  "appid": "你的小程序AppID"
}
```

3. **配置云开发**
- 在微信开发者工具中开启云开发
- 部署云函数到云端
- 配置数据库权限

4. **运行项目**
- 用微信开发者工具打开项目
- 点击编译运行

## 📋 核心算法

### 瓷砖用量计算
```javascript
// 基础用量计算
const basicAmount = Math.ceil(totalArea / tileArea);

// 损耗计算
const wasteAmount = Math.ceil(basicAmount * wasteRate / 100);

// 总用量
const totalAmount = basicAmount + wasteAmount;
```

### 涂料用量计算
```javascript
// 涂料覆盖面积计算
const coverage = 12; // 每升覆盖12平方米
const coats = 2; // 刷涂遍数

// 用量计算
const paintAmount = Math.ceil(totalArea * coats / coverage);
```

## 🎨 主题系统

### 深色主题实现
```css
/* 深色主题基础样式 */
.container.dark {
  background: #000000;
  color: #FFFFFF;
}

/* 组件深色样式 */
.card.dark {
  background: #1C1C1E;
  border-color: #2C2C2E;
}
```

### 主题切换
```javascript
// 全局主题状态管理
globalData: {
  isDarkMode: false
}

// 主题切换函数
switchTheme(isDark) {
  this.globalData.isDarkMode = isDark;
  wx.setStorageSync('isDarkMode', isDark);
}
```

## 📱 页面功能详解

### 首页 (materials)
- 材料类型选择
- 基础参数设置
- 高级功能解锁
- 快捷功能入口

### 房屋信息输入 (input/house)
- 多房间管理
- 尺寸输入
- 高级选项配置
- 实时面积计算

### 计算结果 (result)
- 详细用量展示
- 成本估算
- 购买建议
- 结果分享

### 计算历史 (history)
- 历史记录列表
- 记录详情查看
- 记录删除管理
- 数据导出

### 模板库 (templates)
- 预设场景模板
- 模板详情展示
- 一键应用模板
- 自定义模板

### 设置页面 (settings)
- 主题模式切换
- 通知设置
- 云端同步配置
- 关于信息

## 🔧 开发指南

### 添加新材料类型
1. 在 `materials/index.js` 中添加材料配置
2. 实现对应的计算算法
3. 添加材料特定的UI组件
4. 更新模板库

### 自定义主题
1. 在对应的 `.wxss` 文件中添加 `.dark` 样式
2. 在 `.wxml` 中绑定主题类名
3. 确保所有交互状态都有深色样式

### 云函数开发
```javascript
// 云函数基础结构
exports.main = async (event, context) => {
  const { action, data } = event;
  
  try {
    // 业务逻辑处理
    const result = await processData(data);
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
```

## 📊 数据结构

### 计算记录
```javascript
{
  id: "record_id",
  material: "瓷砖",
  area: 50,
  rooms: [
    {
      name: "客厅",
      length: 5,
      width: 4,
      area: 20
    }
  ],
  result: {
    totalAmount: 120,
    cost: 2400
  },
  createTime: "2024-01-01 12:00:00"
}
```

### 用户设置
```javascript
{
  userId: "user_id",
  settings: {
    isDarkMode: false,
    notifications: true,
    cloudSync: true
  },
  syncTime: "2024-01-01 12:00:00"
}
```

## 🐛 常见问题

### Q: 小程序无法正常显示？
A: 检查AppID配置是否正确，确保在微信开发者工具中正确设置。

### Q: 云函数调用失败？
A: 确保已开启云开发并正确部署云函数，检查网络连接。

### Q: 深色主题不生效？
A: 检查全局变量 `isDarkMode` 是否正确设置，确保所有页面都正确绑定主题类名。

### Q: 计算结果不准确？
A: 检查输入参数是否正确，确认损耗率设置合理。

## 📝 更新日志

### v1.1.0 (2024-01-02)
- ✨ 新增深色主题支持
- 🐛 修复房屋信息输入页面布局问题
- 🎨 优化首页按钮布局
- 📱 改进用户体验

### v1.0.0 (2024-01-01)
- 🎉 项目初始版本
- 📱 基础计算功能
- ☁️ 云端数据同步
- 🎨 iOS风格设计

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 👥 开发团队

- **主要开发者**: [onlymimizi](https://github.com/onlymimizi)
- **项目维护**: 装修计算器开发团队

## 📞 联系我们

- 项目地址: [https://github.com/onlymimizi/wechatdevelop](https://github.com/onlymimizi/wechatdevelop)
- 问题反馈: [Issues](https://github.com/onlymimizi/wechatdevelop/issues)

---

⭐ 如果这个项目对你有帮助，请给我们一个星标！