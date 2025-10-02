const app = getApp()

Page({
  data: {
    params: {},
    rooms: [
      { name: '客厅', length: '', width: '', area: 0, deductArea: '', specialCoefficientIndex: 0 }
    ],
    unit: '㎡',
    totalArea: 0,
    totalDeductArea: 0,
    actualArea: 0,
    canCalculate: false,
    specialCoefficientOptions: ['标准 (1.0)', '复杂 (1.2)', '超复杂 (1.5)'],
    specialCoefficientValues: [1.0, 1.2, 1.5],
    isDarkTheme: false
  },

  onLoad(options) {
    console.log('多房间页面onLoad，接收到的options:', options)
    
    // 检查是否有全局数据（来自模板库）
    const app = getApp()
    if (app.globalData.pendingCalculateData) {
      const templateData = app.globalData.pendingCalculateData
      console.log('从模板库接收到数据:', templateData)
      this.setData({ 
        params: templateData,
        fromTemplate: true,
        templateName: templateData.templateName || '未知模板'
      })
      // 清除全局数据
      app.globalData.pendingCalculateData = null
    } else if (options.params) {
      try {
        const params = JSON.parse(decodeURIComponent(options.params))
        console.log('解析后的params:', params)
        this.setData({ params })
      } catch (error) {
        console.log('参数解析失败:', error)
        console.log('原始params字符串:', options.params)
        // 参数解析失败，设置默认值
        this.setDefaultParams()
      }
    } else {
      console.log('没有接收到params参数，设置默认值')
      this.setDefaultParams()
    }

    // 检查主题
    this.checkTheme()

    // 埋点：页面访问
    this.trackEvent('page_view', { page: 'house_input' })
  },

  onShow() {
    // 检查主题
    this.checkTheme()
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

  // 设置导航栏样式
  setNavigationBarStyle(isDark) {
    wx.setNavigationBarColor({
      frontColor: isDark ? '#ffffff' : '#000000',
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff'
    })
  },

  // 设置默认参数
  setDefaultParams() {
    // 检查是否有模板数据
    const templateData = getApp().globalData.templateData
    
    const defaultParams = {
      material: templateData?.material || '瓷砖', // 优先使用模板材料
      area: 0,
      wasteRate: templateData?.wasteRate || 5,
      layout: templateData?.layout || '正铺',
      isAdvanced: true
    }
    console.log('设置默认参数:', defaultParams)
    this.setData({ params: defaultParams })
    
    // 只有在没有模板数据时才提示用户重新选择
    if (!templateData) {
      wx.showModal({
        title: '参数缺失',
        content: '未接收到材料参数，请返回重新选择材料',
        showCancel: true,
        cancelText: '继续使用',
        confirmText: '返回选择',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/materials/index'
            })
          }
        }
      })
    }
  },

  // 添加房间
  addRoom() {
    const rooms = this.data.rooms.slice()
    rooms.push({
      name: `房间${rooms.length + 1}`,
      length: '',
      width: '',
      area: 0,
      deductArea: '',
      specialCoefficientIndex: 0
    })
    this.setData({ rooms })
    this.calculateTotal()
  },

  // 删除房间
  deleteRoom(e) {
    const index = e.currentTarget.dataset.index
    const rooms = this.data.rooms.slice()
    rooms.splice(index, 1)
    this.setData({ rooms })
    this.calculateTotal()
  },

  // 房间名称输入
  onRoomNameInput(e) {
    const index = e.currentTarget.dataset.index
    const rooms = this.data.rooms.slice()
    rooms[index].name = e.detail.value
    this.setData({ rooms })
  },

  // 房间尺寸输入
  onRoomDimensionInput(e) {
    const index = e.currentTarget.dataset.index
    const field = e.currentTarget.dataset.field
    const value = parseFloat(e.detail.value) || 0
    
    const rooms = this.data.rooms.slice()
    rooms[index][field] = e.detail.value

    // 计算房间面积
    if (field === 'length' || field === 'width') {
      const length = parseFloat(rooms[index].length) || 0
      const width = parseFloat(rooms[index].width) || 0
      rooms[index].area = (length * width).toFixed(2)
    }

    this.setData({ rooms })
    this.calculateTotal()
  },

  // 特殊系数选择
  onSpecialCoefficientChange(e) {
    const index = e.currentTarget.dataset.index
    const rooms = this.data.rooms.slice()
    rooms[index].specialCoefficientIndex = parseInt(e.detail.value)
    this.setData({ rooms })
    this.calculateTotal()
  },

  // 单位切换
  switchUnit(e) {
    const unit = e.currentTarget.dataset.unit
    this.setData({ unit })
    this.calculateTotal()
  },

  // 计算总计
  calculateTotal() {
    let totalArea = 0
    let totalDeductArea = 0

    this.data.rooms.forEach(room => {
      const area = parseFloat(room.area) || 0
      const deductArea = parseFloat(room.deductArea) || 0
      
      totalArea += area
      totalDeductArea += deductArea
    })

    // 单位转换 (1坪 = 3.3058㎡)
    if (this.data.unit === '坪') {
      totalArea = (totalArea / 3.3058).toFixed(2)
      totalDeductArea = (totalDeductArea / 3.3058).toFixed(2)
    } else {
      totalArea = totalArea.toFixed(2)
      totalDeductArea = totalDeductArea.toFixed(2)
    }

    const actualArea = (totalArea - totalDeductArea).toFixed(2)
    const canCalculate = actualArea > 0

    this.setData({
      totalArea,
      totalDeductArea,
      actualArea,
      canCalculate
    })
  },

  // 开始计算
  calculate() {
    if (!this.data.canCalculate) {
      wx.showToast({
        title: '请输入有效面积',
        icon: 'none'
      })
      return
    }

    // 检查必要参数
    if (!this.data.params.material) {
      wx.showToast({
        title: '材料信息缺失，请重新选择',
        icon: 'none'
      })
      return
    }

    // 准备计算数据
    const calculateData = Object.assign({}, this.data.params, {
      rooms: this.data.rooms,
      unit: this.data.unit,
      totalArea: parseFloat(this.data.totalArea),
      actualArea: parseFloat(this.data.actualArea),
      timestamp: Date.now()
    })

    console.log('多房间计算：准备的数据', calculateData)
    console.log('原始params:', this.data.params)

    // 验证计算数据完整性
    if (!calculateData.material || !calculateData.actualArea) {
      console.log('计算数据不完整:', calculateData)
      wx.showToast({
        title: '计算数据不完整',
        icon: 'none'
      })
      return
    }

    // 跳转到结果页
    // 先存储数据到全局，然后跳转到tabBar页面
    console.log('多房间计算：存储数据到全局')
    getApp().globalData.pendingCalculateData = calculateData
    
    // 跳转到结果页（tabBar页面）
    wx.switchTab({
      url: '/pages/result/index',
      success: () => {
        console.log('多房间计算：跳转成功')
        // 延迟一下确保页面完全加载后再触发数据更新
        setTimeout(() => {
          const pages = getCurrentPages()
          const currentPage = pages[pages.length - 1]
          if (currentPage.route === 'pages/result/index') {
            console.log('多房间计算：手动触发result页面数据更新')
            currentPage.checkAndUpdateData()
          }
        }, 100)
      },
      fail: (err) => {
        console.log('多房间计算：跳转失败:', err)
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        })
      }
    })

    // 埋点：计算提交
    this.trackEvent('calculate_submit', {
      material: this.data.params.material,
      totalArea: this.data.totalArea,
      roomCount: this.data.rooms.length,
      unit: this.data.unit,
      isAdvanced: this.data.params.isAdvanced
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
        page: 'house_input'
      }
    }).catch(err => {
      console.log('埋点失败', err)
    })
  }
})