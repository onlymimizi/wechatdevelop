Page({
  data: {
    totalCalculations: 0,
    totalArea: 0,
    savedMoney: 0
  },

  onLoad() {
    this.loadUserStats()
  },

  onShow() {
    // 更新 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3
      })
    }
    // 刷新统计数据
    this.loadUserStats()
  },

  // 加载用户统计数据
  loadUserStats() {
    // 从本地存储获取历史记录
    const records = wx.getStorageSync('calc_records') || []
    
    let totalArea = 0
    let totalCost = 0
    
    records.forEach(record => {
      totalArea += parseFloat(record.area) || 0
      // 如果有totalCost，直接使用；否则根据面积和材料估算
      if (record.totalCost && record.totalCost > 0) {
        totalCost += parseFloat(record.totalCost) || 0
      } else {
        // 简单估算：瓷砖100元/㎡，地板150元/㎡，腻子30元/㎡
        const unitPrice = record.material === '瓷砖' ? 100 : 
                         record.material === '地板' ? 150 : 30
        totalCost += (parseFloat(record.area) || 0) * unitPrice
      }
    })

    console.log('统计数据:', {
      recordsCount: records.length,
      totalArea: totalArea,
      totalCost: totalCost,
      records: records
    })

    this.setData({
      totalCalculations: records.length,
      totalArea: Math.round(totalArea),
      savedMoney: Math.round(totalCost * 0.1) // 假设节省10%费用
    })
  },

  // 跳转到开始计算
  goToCalculate() {
    wx.switchTab({
      url: '/pages/materials/index'
    })
  },

  // 跳转到计算历史
  goToHistory() {
    wx.switchTab({
      url: '/pages/history/index'
    })
  },

  // 分享应用
  shareApp() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    
    wx.showToast({
      title: '请点击右上角分享',
      icon: 'none'
    })
  },

  // 跳转到收藏夹
  goToFavorites() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 跳转到模板库
  goToTemplates() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 跳转到设置
  goToSettings() {
    wx.showModal({
      title: '设置',
      content: '个性化设置功能正在开发中，敬请期待！',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 跳转到帮助中心
  goToHelp() {
    wx.showModal({
      title: '使用帮助',
      content: '1. 在首页选择材料类型\n2. 输入房间面积和损耗率\n3. 点击开始计算获得结果\n4. 可在历史页面查看记录',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 意见反馈
  goToFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '如有问题或建议，请通过以下方式联系我们：\n\n微信客服：装修计算器\n邮箱：postmaster@taigongchain.com',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 关于我们
  goToAbout() {
    wx.showModal({
      title: '关于装修计算器',
      content: '版本：1.0.3\n\n专业的装修材料用量计算工具，帮您精准计算，省心装修。',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '装修计算器 - 精准计算，省心装修',
      path: '/pages/materials/index',
      imageUrl: '/images/share.jpg'
    }
  },

  onShareTimeline() {
    return {
      title: '装修计算器 - 精准计算，省心装修',
      query: 'from=timeline',
      imageUrl: '/images/share.jpg'
    }
  }
})