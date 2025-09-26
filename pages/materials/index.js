const app = getApp()

Page({
  data: {
    selectedMaterial: '',
    area: '',
    wasteRate: '',
    defaultWaste: 5,
    layoutIndex: 0,
    layoutOptions: ['正铺', '斜铺', '人字铺', '工字铺'],
    isAdvancedUnlocked: false,
    rewardedVideoAd: null
  },

  onLoad() {
    // 初始化激励视频广告
    this.initRewardedVideoAd()
    
    // 埋点：页面访问
    this.trackEvent('page_view', { page: 'materials' })
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
      isAdvancedUnlocked: false
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

  // 解锁高级功能
  unlockAdvanced() {
    if (this.data.isAdvancedUnlocked) {
      return
    }

    if (this.data.rewardedVideoAd) {
      this.data.rewardedVideoAd.show().catch(() => {
        // 广告加载失败，重新加载
        this.data.rewardedVideoAd.load()
          .then(() => this.data.rewardedVideoAd.show())
          .catch(err => {
            console.log('激励视频广告显示失败', err)
            wx.showToast({
              title: '广告加载失败，请稍后重试',
              icon: 'none'
            })
          })
      })
    }
  },

  // 前往房间输入页
  goToHouseInput() {
    if (!this.data.selectedMaterial || !this.data.area) {
      wx.showToast({
        title: '请完善基础信息',
        icon: 'none'
      })
      return
    }

    const params = {
      material: this.data.selectedMaterial,
      area: this.data.area,
      wasteRate: this.data.wasteRate || this.data.defaultWaste,
      layout: this.data.layoutOptions[this.data.layoutIndex],
      isAdvanced: this.data.isAdvancedUnlocked
    }

    wx.navigateTo({
      url: `/pages/input/house?params=${encodeURIComponent(JSON.stringify(params))}`
    })

    // 埋点：开始计算
    this.trackEvent('start_calculate', params)
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
  }
})