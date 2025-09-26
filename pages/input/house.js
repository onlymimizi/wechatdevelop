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
    specialCoefficientValues: [1.0, 1.2, 1.5]
  },

  onLoad(options) {
    if (options.params) {
      const params = JSON.parse(decodeURIComponent(options.params))
      this.setData({ params })
    }

    // 埋点：页面访问
    this.trackEvent('page_view', { page: 'house_input' })
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

    // 准备计算数据
    const calculateData = Object.assign({}, this.data.params, {
      rooms: this.data.rooms,
      unit: this.data.unit,
      totalArea: parseFloat(this.data.totalArea),
      actualArea: parseFloat(this.data.actualArea),
      timestamp: Date.now()
    })

    // 跳转到结果页
    wx.navigateTo({
      url: `/pages/result/index?data=${encodeURIComponent(JSON.stringify(calculateData))}`
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