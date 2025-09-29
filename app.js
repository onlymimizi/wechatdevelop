// iOS 风格装修材料计算器
App({
  globalData: {
    // 材料配置
    materialConfig: {
      '瓷砖': {
        defaultWaste: 0.08, // 8% 损耗率
        coefficient: 1.0,   // 基础系数
        unit: '㎡',
        packageSize: 1.2,   // 每箱面积
        standardSize: 0.36, // 每片面积(60cm×60cm)
        description: '地砖、墙砖用量计算'
      },
      '油漆': {
        defaultWaste: 0.05, // 5% 损耗率
        coefficient: 0.35,  // 1㎡需要0.35L油漆
        unit: 'L',
        packageSize: 5,     // 每桶容量
        standardSize: 1,    // 每升覆盖面积
        description: '墙面涂料用量计算'
      },
      '腻子': {
        defaultWaste: 0.1,  // 10% 损耗率
        coefficient: 1.2,   // 1㎡需要1.2kg腻子
        unit: 'kg',
        packageSize: 20,    // 每袋重量
        standardSize: 1,    // 每公斤覆盖面积
        description: '墙面找平用量计算'
      }
    },
    
    // 用户信息
    userInfo: null,
    
    // 待处理的计算数据（用于tabBar页面间传递数据）
    pendingCalculateData: null,
    
    // 云环境ID - 您的真实环境ID
    cloudEnvId: 'dev-1-1g6gx22154b6f469' // 您的云开发环境ID
  },

  onLaunch() {
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: this.globalData.cloudEnvId,
        traceUser: true
      })
    }

    // 检查更新
    this.checkForUpdate()
    
    // 获取用户信息
    this.getUserInfo()
    
    // 埋点：应用启动
    this.trackEvent('app_launch', {
      timestamp: Date.now(),
      version: '2.0.0'
    })
  },

  onShow() {
    // 埋点：应用显示
    this.trackEvent('app_show', {
      timestamp: Date.now()
    })
  },

  onHide() {
    // 埋点：应用隐藏
    this.trackEvent('app_hide', {
      timestamp: Date.now()
    })
  },

  // 检查小程序更新
  checkForUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()
      
      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          console.log('发现新版本')
        }
      })

      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate()
            }
          }
        })
      })

      updateManager.onUpdateFailed(() => {
        console.log('新版本下载失败')
      })
    }
  },

  // 获取用户信息
  getUserInfo() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: (res) => {
              this.globalData.userInfo = res.userInfo
            }
          })
        }
      }
    })
  },

  // 全局埋点方法
  trackEvent(event, data = {}) {
    if (wx.cloud) {
      wx.cloud.callFunction({
        name: 'trackEvent',
        data: {
          event,
          data: {
            ...data,
            userInfo: this.globalData.userInfo,
            timestamp: Date.now()
          }
        }
      }).catch(err => {
        console.log('埋点失败', err)
      })
    }
  },

  // 计算材料用量的核心方法
  calculateMaterial(params) {
    const { material, area, wasteRate, layout = '正铺', isAdvanced = false } = params
    const config = this.globalData.materialConfig[material]
    
    if (!config) {
      throw new Error('不支持的材料类型')
    }

    // 基础用量计算
    let baseAmount = area * config.coefficient
    
    // 根据铺贴方式调整系数
    if (material === '瓷砖') {
      const layoutCoefficients = {
        '正铺': 1.0,
        '斜铺': 1.15,
        '人字铺': 1.2,
        '工字铺': 1.1
      }
      baseAmount *= (layoutCoefficients[layout] || 1.0)
    }

    // 损耗计算
    const wasteAmount = baseAmount * (wasteRate / 100)
    const totalAmount = baseAmount + wasteAmount
    
    // 包装数量计算
    const packages = Math.ceil(totalAmount / config.packageSize)

    return {
      baseAmount: baseAmount.toFixed(2),
      wasteAmount: wasteAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      packages,
      unit: config.unit,
      details: [
        { label: '计算面积', value: `${area}㎡` },
        { label: '材料系数', value: config.coefficient },
        { label: '铺贴方式', value: layout },
        { label: '损耗率', value: `${wasteRate}%` },
        { label: '包装规格', value: `${config.packageSize}${config.unit}/包` }
      ]
    }
  }
})