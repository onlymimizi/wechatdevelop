const app = getApp()

Page({
  data: {
    calculateData: {},
    result: {},
    interstitialAd: null
  },

  onLoad(options) {
    if (options.data) {
      const calculateData = JSON.parse(decodeURIComponent(options.data))
      this.setData({ calculateData })
      this.calculateResult()
    }

    // 初始化插屏广告
    this.initInterstitialAd()

    // 埋点：页面访问
    this.trackEvent('page_view', { page: 'result' })
  },

  onShow() {
    // 显示插屏广告
    this.showInterstitialAd()
  },

  // 初始化插屏广告
  initInterstitialAd() {
    if (wx.createInterstitialAd) {
      this.data.interstitialAd = wx.createInterstitialAd({
        unitId: 'REPLACE_INTERSTITIAL_ID' // 需要替换为真实的广告位ID
      })

      this.data.interstitialAd.onLoad(() => {
        console.log('插屏广告加载成功')
      })

      this.data.interstitialAd.onError((err) => {
        console.log('插屏广告加载失败', err)
      })

      this.data.interstitialAd.onClose(() => {
        console.log('插屏广告关闭')
      })
    }
  },

  // 显示插屏广告
  showInterstitialAd() {
    if (this.data.interstitialAd) {
      this.data.interstitialAd.show().catch((err) => {
        console.log('插屏广告显示失败', err)
      })
    }
  },

  // 计算结果
  calculateResult() {
    const { calculateData } = this.data
    const materialConfig = app.globalData.materialConfig[calculateData.material]
    
    let actualArea = calculateData.actualArea
    
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

    this.setData({ result })

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
      wasteRate: calculateData.wasteRate,
      layout: calculateData.layout,
      isAdvanced: calculateData.isAdvanced,
      rooms: calculateData.rooms,
      timestamp: Date.now(),
      createTime: new Date().toISOString()
    }

    wx.cloud.callFunction({
      name: 'saveCalcRecord',
      data: record,
      success: (res) => {
        wx.hideLoading()
        if (res.result.success) {
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
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
        console.log('保存记录失败', err)
      }
    })
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
  }
})