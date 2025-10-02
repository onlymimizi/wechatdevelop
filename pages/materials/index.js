const app = getApp()

Page({
  data: {
    isDarkTheme: false,
    selectedMaterial: '',
    area: '',
    wasteRate: '',
    defaultWaste: 5,
    layoutIndex: 0,
    layoutOptions: ['正铺', '斜铺', '人字铺', '工字铺'],
    isAdvancedUnlocked: true, // 默认解锁高级功能，让用户先体验价值
    rewardedVideoAd: null
  },

  onLoad() {
    // 初始化激励视频广告
    this.initRewardedVideoAd()
    
    // 埋点：页面访问
    this.trackEvent('page_view', { page: 'materials' })

    // 应用主题
    this.applyTheme()
  },

  onShow() {
    // 检查主题
    this.checkTheme()
    
    // 更新 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }
  },

  // 检查并应用主题
  checkTheme() {
    const app = getApp()
    const isDark = app.globalData.isDarkMode
    this.setData({
      isDarkTheme: isDark
    })
    this.setNavigationBarStyle(isDark)
  },

  // 应用主题
  applyTheme() {
    this.checkTheme()
  },

  // 设置导航栏样式
  setNavigationBarStyle(isDark) {
    wx.setNavigationBarColor({
      frontColor: isDark ? '#ffffff' : '#000000',
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff'
    })
  },

  // 初始化激励视频广告
  initRewardedVideoAd() {
    if (wx.createRewardedVideoAd) {
      this.data.rewardedVideoAd = wx.createRewardedVideoAd({
        unitId: 'REPLACE_REWARDED_ID' // 需要替换为真实的广告位ID
      })

      this.data.rewardedVideoAd.onLoad(() => {
        console.log('激励视频广告加载成功')
      })

      this.data.rewardedVideoAd.onError((err) => {
        console.log('激励视频广告加载失败', err)
      })

      this.data.rewardedVideoAd.onClose((res) => {
        if (res && res.isEnded) {
          // 用户完整观看了广告
          this.setData({
            isAdvancedUnlocked: true
          })
          wx.showToast({
            title: '高级功能已解锁',
            icon: 'success'
          })
          // 埋点：广告观看完成
          this.trackEvent('ad_rewarded_complete', { 
            material: this.data.selectedMaterial 
          })
        } else {
          wx.showToast({
            title: '请完整观看广告',
            icon: 'none'
          })
        }
      })
    }
  },

  // 选择材料
  selectMaterial(e) {
    const material = e.currentTarget.dataset.material
    const config = app.globalData.materialConfig[material]
    
    this.setData({
      selectedMaterial: material,
      defaultWaste: Math.round(config.defaultWaste * 100),
      wasteRate: Math.round(config.defaultWaste * 100),
      isAdvancedUnlocked: true // 保持解锁状态，让用户继续体验高级功能
    })

    // 埋点：材料选择
    this.trackEvent('material_select', { material })
  },

  // 面积输入
  onAreaInput(e) {
    this.setData({
      area: e.detail.value
    })
  },

  // 损耗率输入
  onWasteRateInput(e) {
    this.setData({
      wasteRate: e.detail.value
    })
  },

  // 铺贴方式选择
  onLayoutChange(e) {
    this.setData({
      layoutIndex: e.detail.value
    })
  },

  // 解锁高级功能 - 当前版本默认解锁，让用户先体验价值
  unlockAdvanced() {
    if (this.data.isAdvancedUnlocked) {
      wx.showToast({
        title: '高级功能已可用',
        icon: 'success'
      })
      return
    }

    // 当前版本：直接解锁（后续可改为广告解锁提升观看率）
    this.setData({
      isAdvancedUnlocked: true
    })
    wx.showToast({
      title: '高级功能已解锁',
      icon: 'success'
    })

    // 埋点：高级功能解锁
    this.trackEvent('advanced_unlocked', {
      method: 'free', // 当前免费，后续可改为 'ad'
      material: this.data.selectedMaterial
    })

    // TODO: 后续版本改为广告解锁的代码
    // if (this.data.rewardedVideoAd) {
    //   this.data.rewardedVideoAd.show().catch(() => {
    //     this.data.rewardedVideoAd.load()
    //       .then(() => this.data.rewardedVideoAd.show())
    //       .catch(err => {
    //         wx.showToast({
    //           title: '广告加载失败，请稍后重试',
    //           icon: 'none'
    //         })
    //       })
    //   })
    // }
  },

  // 基础计算
  goToBasicCalc() {
    console.log('goToBasicCalc 被调用')
    
    if (!this.data.selectedMaterial || !this.data.area) {
      wx.showToast({
        title: '请完善基础信息',
        icon: 'none'
      })
      return
    }

    // 基础计算，直接跳转到结果页
    const calculateData = {
      material: this.data.selectedMaterial,
      actualArea: parseFloat(this.data.area),
      unit: '㎡',
      wasteRate: this.data.wasteRate || this.data.defaultWaste,
      layout: this.data.layoutOptions[this.data.layoutIndex],
      isAdvanced: false,
      rooms: [{
        name: '房间1',
        area: this.data.area,
        specialCoefficientIndex: 0
      }]
    }

    console.log('基础计算跳转数据:', calculateData)

    // 先存储数据到全局，然后跳转到tabBar页面
    getApp().globalData.pendingCalculateData = calculateData
    
    // 跳转到结果页（tabBar页面）
    wx.switchTab({
      url: '/pages/result/index',
      success: () => {
        console.log('基础计算跳转成功')
        setTimeout(() => {
          const pages = getCurrentPages()
          const currentPage = pages[pages.length - 1]
          if (currentPage.route === 'pages/result/index') {
            currentPage.checkAndUpdateData()
          }
        }, 100)
      },
      fail: (err) => {
        console.log('基础计算跳转失败:', err)
      }
    })

    // 埋点：基础计算
    this.trackEvent('basic_calculate', {
      material: this.data.selectedMaterial
    })
  },

  // 高级计算 - 跳转到多房间页面
  goToHouseInput() {
    console.log('goToHouseInput 被调用')
    
    if (!this.data.selectedMaterial || !this.data.area) {
      wx.showToast({
        title: '请完善基础信息',
        icon: 'none'
      })
      return
    }

    console.log('准备跳转，材料:', this.data.selectedMaterial, '面积:', this.data.area)

    // 高级计算，跳转到房间详情页
    const params = {
      material: this.data.selectedMaterial,
      area: parseFloat(this.data.area),
      wasteRate: (this.data.wasteRate || this.data.defaultWaste) / 100,
      layout: this.data.layoutOptions[this.data.layoutIndex],
      isAdvanced: true
    }

    console.log('跳转到多房间页面，参数:', params)
    console.log('编码后的参数:', encodeURIComponent(JSON.stringify(params)))

    wx.navigateTo({
      url: `/pages/input/house?params=${encodeURIComponent(JSON.stringify(params))}`,
      success: () => {
        console.log('跳转到多房间页面成功')
      },
      fail: (err) => {
        console.log('跳转到多房间页面失败:', err)
      }
    })

    // 埋点：高级计算
    this.trackEvent('advanced_calculate', {
      material: this.data.selectedMaterial
    })
  },

  // 跳转到历史页面
  goToHistory() {
    wx.switchTab({
      url: '/pages/history/index'
    })
  },

  // 显示帮助信息
  showHelp() {
    wx.showModal({
      title: '使用帮助',
      content: '1. 选择材料类型\n2. 输入基础参数\n3. 可选择解锁高级功能\n4. 点击开始计算即可获得精准结果',
      showCancel: false,
      confirmText: '知道了'
    })
    
    // 埋点：查看帮助
    this.trackEvent('help_view', {})
  },

  // 埋点事件
  trackEvent(event, data = {}) {
    wx.cloud.callFunction({
      name: 'trackEvent',
      data: {
        event,
        data,
        timestamp: Date.now(),
        page: 'materials'
      }
    }).catch(err => {
      console.log('埋点失败', err)
    })
  },

  // 自定义分享
  onShareAppMessage(e) {
    console.log('分享方法被调用', e);
    
    return {
      title: '装修材料计算器 - 精准计算装修用量',
      path: '/pages/materials/index',
      imageUrl: '/images/share-cover.jpg'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '装修材料计算器 - 精准计算装修用量',
      query: 'from=timeline',
      imageUrl: '/images/share-cover.jpg'
    }
  }
})