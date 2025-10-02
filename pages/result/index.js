const app = getApp()

Page({
  data: {
    calculateData: {},
    result: {},
    interstitialAd: null,
    isDark: false
  },

  onLoad(options) {
    // tabBar页面不能通过URL参数传递数据，从全局获取
    const app = getApp()
    if (app.globalData.pendingCalculateData) {
      const calculateData = app.globalData.pendingCalculateData
      this.setData({ calculateData })
      this.calculateResult()
      // 清除全局数据
      app.globalData.pendingCalculateData = null
    } else if (options.data) {
      // 兼容旧的URL参数方式
      const calculateData = JSON.parse(decodeURIComponent(options.data))
      this.setData({ calculateData })
      this.calculateResult()
    }

    // 初始化插屏广告 - 暂时注释，等申请广告位后启用
    // this.initInterstitialAd()

    // 埋点：页面访问
    this.trackEvent('page_view', { page: 'result' })

    // 应用主题
    this.applyTheme()
  },

  onShow() {
    console.log('result页面onShow被调用')
    this.checkAndUpdateData()

    // 显示插屏广告 - 暂时注释，等申请广告位后启用
    // this.showInterstitialAd()
    
    // 更新 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      })
    }

    // 应用主题
    this.applyTheme()
  },

  // 应用主题
  applyTheme() {
    const app = getApp()
    const isDark = app.globalData.isDarkMode
    this.setData({ isDark })
    this.setNavigationBarStyle(isDark)
  },

  // 设置导航栏样式
  setNavigationBarStyle(isDark) {
    wx.setNavigationBarColor({
      frontColor: isDark ? '#ffffff' : '#000000',
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff'
    })
  },

  // 检查并更新数据
  checkAndUpdateData() {
    console.log('checkAndUpdateData被调用')
    
    // 每次显示页面时检查是否有待处理的数据
    const app = getApp()
    if (app.globalData.pendingCalculateData) {
      console.log('发现新的计算数据，开始处理')
      const calculateData = app.globalData.pendingCalculateData
      
      // 清除旧的结果数据
      this.setData({ 
        calculateData: calculateData,
        result: {} // 清空旧结果
      })
      
      // 重新计算
      this.calculateResult()
      
      // 清除全局数据
      app.globalData.pendingCalculateData = null
      console.log('全局数据已清除')
    } else {
      console.log('没有新的计算数据')
    }
  },

  onHide() {
    // 页面隐藏时的处理
  },

  // 初始化插屏广告 - 暂时注释，等申请广告位后启用
  initInterstitialAd() {
    // if (wx.createInterstitialAd) {
    //   this.data.interstitialAd = wx.createInterstitialAd({
    //     unitId: 'YOUR_REAL_AD_UNIT_ID' // 申请广告位后替换为真实ID
    //   })

    //   this.data.interstitialAd.onLoad(() => {
    //     console.log('插屏广告加载成功')
    //   })

    //   this.data.interstitialAd.onError((err) => {
    //     console.log('插屏广告加载失败', err)
    //   })

    //   this.data.interstitialAd.onClose(() => {
    //     console.log('插屏广告关闭')
    //   })
    // }
  },

  // 显示插屏广告 - 暂时注释，等申请广告位后启用
  showInterstitialAd() {
    // if (this.data.interstitialAd) {
    //   this.data.interstitialAd.show().catch((err) => {
    //     console.log('插屏广告显示失败', err)
    //   })
    // }
  },

  // 计算结果
  calculateResult() {
    console.log('开始计算结果')
    const { calculateData } = this.data
    console.log('计算数据:', calculateData)
    
    if (!calculateData || !calculateData.material) {
      console.log('计算数据不完整')
      wx.showToast({
        title: '数据错误',
        icon: 'none'
      })
      return
    }
    
    const materialConfig = app.globalData.materialConfig[calculateData.material]
    console.log('材料配置:', materialConfig)
    
    if (!materialConfig) {
      console.log('找不到材料配置')
      wx.showToast({
        title: '材料配置错误',
        icon: 'none'
      })
      return
    }
    
    let actualArea = calculateData.actualArea
    console.log('实际面积:', actualArea)
    
    // 单位转换回平方米进行计算
    if (calculateData.unit === '坪') {
      actualArea = actualArea * 3.3058
    }

    // 基础用量计算
    let baseAmount = actualArea * materialConfig.coefficient
    
    // 高级场景系数调整
    if (calculateData.isAdvanced && calculateData.rooms) {
      let totalCoefficient = 0
      let totalArea = 0
      
      calculateData.rooms.forEach(room => {
        const roomArea = parseFloat(room.area) || 0
        const coefficientIndex = room.specialCoefficientIndex || 0
        const coefficients = [1.0, 1.2, 1.5]
        const coefficient = coefficients[coefficientIndex]
        
        totalCoefficient += roomArea * coefficient
        totalArea += roomArea
      })
      
      if (totalArea > 0) {
        const avgCoefficient = totalCoefficient / totalArea
        baseAmount = baseAmount * avgCoefficient
      }
    }

    // 损耗计算
    const wasteRate = parseFloat(calculateData.wasteRate) / 100
    const wasteAmount = baseAmount * wasteRate
    const totalAmount = baseAmount + wasteAmount

    // 包装数量计算（针对瓷砖）
    let packages = null
    if (calculateData.material === '瓷砖') {
      // 假设每箱20片，每片0.36㎡
      const piecesPerBox = 20
      const areaPerPiece = materialConfig.standardSize
      const totalPieces = Math.ceil(totalAmount / areaPerPiece)
      packages = Math.ceil(totalPieces / piecesPerBox)
    }

    // 详细说明
    const details = [
      { label: '计算公式', value: `面积 × 系数 × (1 + 损耗率)` },
      { label: '材料系数', value: materialConfig.coefficient },
      { label: '损耗率', value: `${calculateData.wasteRate}%` },
      { label: '铺贴方式', value: calculateData.layout || '标准' }
    ]

    if (calculateData.isAdvanced) {
      details.push({ label: '高级场景', value: '已启用复杂计算' })
    }

    const result = {
      baseAmount: baseAmount.toFixed(2),
      wasteAmount: wasteAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      unit: materialConfig.unit,
      packages,
      details
    }

    console.log('计算结果:', result)
    this.setData({ result })
    console.log('页面数据已更新')

    // 自动保存记录
    this.saveRecord()

    // 埋点：计算完成
    this.trackEvent('calculate_complete', {
      material: calculateData.material,
      totalAmount: result.totalAmount,
      unit: result.unit
    })
  },

  // 复制结果
  copyResult() {
    const { calculateData, result } = this.data
    const text = `【装修材料计算结果】
材料：${calculateData.material}
面积：${calculateData.actualArea}${calculateData.unit}
建议购买：${result.totalAmount}${result.unit}
${result.packages ? `包装数量：${result.packages}包/箱` : ''}

*结果仅供参考，具体以实物为准`

    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        })
        // 埋点：复制结果
        this.trackEvent('copy_result', { material: calculateData.material })
      }
    })
  },

  // 生成分享图
  shareResult() {
    wx.showLoading({ title: '生成中...' })
    
    const ctx = wx.createCanvasContext('shareCanvas')
    const { calculateData, result } = this.data
    
    // 绘制背景
    ctx.setFillStyle('#ffffff')
    ctx.fillRect(0, 0, 375, 500)
    
    // 绘制标题
    ctx.setFillStyle('#2E8B57')
    ctx.setFontSize(24)
    ctx.setTextAlign('center')
    ctx.fillText('装修材料用量计算', 187.5, 50)
    
    // 绘制材料信息
    ctx.setFillStyle('#333333')
    ctx.setFontSize(20)
    ctx.fillText(`材料：${calculateData.material}`, 187.5, 100)
    ctx.fillText(`面积：${calculateData.actualArea}${calculateData.unit}`, 187.5, 130)
    
    // 绘制结果
    ctx.setFillStyle('#2E8B57')
    ctx.setFontSize(28)
    ctx.fillText(`建议购买：${result.totalAmount}${result.unit}`, 187.5, 180)
    
    if (result.packages) {
      ctx.setFillStyle('#666666')
      ctx.setFontSize(16)
      ctx.fillText(`包装数量：${result.packages}包/箱`, 187.5, 210)
    }
    
    // 绘制提示
    ctx.setFillStyle('#999999')
    ctx.setFontSize(14)
    ctx.fillText('*结果仅供参考，具体以实物为准', 187.5, 250)
    
    // 绘制小程序码占位
    ctx.setFillStyle('#f0f0f0')
    ctx.fillRect(137.5, 280, 100, 100)
    ctx.setFillStyle('#999999')
    ctx.setFontSize(12)
    ctx.fillText('小程序码', 187.5, 335)
    
    ctx.draw(false, () => {
      wx.canvasToTempFilePath({
        canvasId: 'shareCanvas',
        success: (res) => {
          wx.hideLoading()
          wx.previewImage({
            urls: [res.tempFilePath],
            success: () => {
              // 埋点：分享图生成
              this.trackEvent('share_image_generate', { 
                material: calculateData.material 
              })
            }
          })
        },
        fail: (err) => {
          wx.hideLoading()
          wx.showToast({
            title: '生成失败',
            icon: 'none'
          })
          console.log('生成分享图失败', err)
        }
      })
    })
  },

  // 保存记录
  saveRecord() {
    wx.showLoading({ title: '保存中...' })
    
    const { calculateData, result } = this.data
    const record = {
      material: calculateData.material,
      area: calculateData.actualArea,
      unit: calculateData.unit,
      result: result.totalAmount,
      resultUnit: result.unit,
      wasteRate: calculateData.wasteRate, // 保持原始百分比格式
      layout: calculateData.layout,
      isAdvanced: calculateData.isAdvanced,
      rooms: calculateData.rooms,
      timestamp: Date.now(),
      createTime: new Date().toISOString(),
      // 添加估算费用用于统计
      totalCost: this.estimateCost(calculateData.material, calculateData.actualArea)
    }

    // 如果云开发不可用，使用本地存储
    if (!wx.cloud) {
      this.saveToLocal(record)
      return
    }

    wx.cloud.callFunction({
      name: 'saveCalcRecord',
      data: record,
      success: (res) => {
        wx.hideLoading()
        if (res.result && res.result.success) {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          })
          // 埋点：保存记录
          this.trackEvent('save_record', { 
            material: calculateData.material,
            recordId: res.result.recordId
          })
        } else {
          // 云函数调用失败，使用本地存储
          this.saveToLocal(record)
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.log('云函数调用失败，使用本地存储', err)
        // 云函数调用失败，使用本地存储
        this.saveToLocal(record)
      }
    })
  },

  // 保存到本地存储
  saveToLocal(record) {
    try {
      // 生成本地ID
      record._id = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      
      // 获取现有记录
      const existingRecords = wx.getStorageSync('calc_records') || []
      
      // 添加新记录到开头
      existingRecords.unshift(record)
      
      // 只保留最近50条记录
      if (existingRecords.length > 50) {
        existingRecords.splice(50)
      }
      
      // 保存到本地
      wx.setStorageSync('calc_records', existingRecords)
      
      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      // 埋点：本地保存记录
      this.trackEvent('save_record_local', { 
        material: record.material,
        recordId: record._id
      })
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
      console.log('本地保存失败', error)
    }
  },

  // 返回上一页
  goBack() {
    // 由于结果页面是tabBar页面，无法使用navigateBack
    // 改为跳转到材料选择页面重新开始计算
    wx.switchTab({
      url: '/pages/materials/index'
    })
  },

  // 跳转到高级计算
  goToAdvancedCalc() {
    // 如果有当前计算数据，使用当前数据；否则使用默认参数
    let params
    
    if (this.data.material && this.data.actualArea) {
      // 使用当前计算数据
      params = {
        material: this.data.material,
        area: this.data.actualArea,
        wasteRate: this.data.wasteRate / 100,
        layout: this.data.layout || '正铺',
        isAdvanced: true
      }
    } else {
      // 使用默认参数，让用户在多房间页面重新设置
      params = {
        material: '瓷砖',
        area: 0,
        wasteRate: 0.05,
        layout: '正铺',
        isAdvanced: true
      }
    }

    console.log('跳转到高级计算，参数:', params)

    wx.navigateTo({
      url: `/pages/input/house?params=${encodeURIComponent(JSON.stringify(params))}`
    })
  },

  // 跳转到成本分析
  goToCostAnalysis() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 跳转到选材指南
  goToMaterialGuide() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 跳转到附近商家
  goToSupplierMap() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 保存结果
  saveResult() {
    this.saveRecord()
  },

  // 分享结果
  shareResult() {
    this.copyResult()
  },

  // 估算费用
  estimateCost(material, area) {
    // 简单估算：瓷砖100元/㎡，地板150元/㎡，腻子30元/㎡
    const unitPrice = material === '瓷砖' ? 100 : 
                     material === '地板' ? 150 : 30
    return Math.round(area * unitPrice)
  },

  // 埋点事件
  trackEvent(event, data = {}) {
    wx.cloud.callFunction({
      name: 'trackEvent',
      data: {
        event,
        data,
        timestamp: Date.now(),
        page: 'result'
      }
    }).catch(err => {
      console.log('埋点失败', err)
    })
  },

  // 自定义分享
  onShareAppMessage(e) {
    console.log('分享方法被调用', e);
    
    let title = '装修材料计算器 - 计算结果';
    let path = '/pages/materials/index';
    
    // 如果有计算结果，显示具体信息
    if (this.data.result && this.data.result.totalAmount) {
      const material = this.data.calculateData.material || '材料';
      const area = this.data.calculateData.actualArea || '';
      const amount = this.data.result.totalAmount || '';
      const unit = this.data.result.unit || '';
      title = `【${material}】面积${area}㎡，建议用量${amount}${unit}`;
    }
    
    return {
      title: title,
      path: path,
      imageUrl: '/images/share-cover.jpg'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    let title = '装修材料计算器 - 精准计算结果';
    
    if (this.data.result && this.data.result.totalAmount) {
      const material = this.data.calculateData.material || '材料';
      const amount = this.data.result.totalAmount || '';
      const unit = this.data.result.unit || '';
      title = `【${material}】计算结果：${amount}${unit}`;
    }
    
    return {
      title: title,
      query: 'from=timeline',
      imageUrl: '/images/share-cover.jpg'
    }
  }
})