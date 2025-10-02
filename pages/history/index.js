Page({
  data: {
    records: [],
    loading: true,
    loadingMore: false,
    hasMore: true,
    pageSize: 10,
    currentPage: 0,
    isDarkTheme: false
  },

  onLoad() {
    this.loadRecords()
    // 埋点：页面访问
    this.trackEvent('page_view', { page: 'history' })
  },

  onShow() {
    // 刷新数据
    this.refreshRecords()
    
    // 检查主题
    this.checkTheme()
    
    // 更新 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
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

  // 设置导航栏样式
  setNavigationBarStyle(isDark) {
    wx.setNavigationBarColor({
      frontColor: isDark ? '#ffffff' : '#000000',
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff'
    })
  },

  // 加载记录
  loadRecords(isLoadMore = false) {
    if (!isLoadMore) {
      this.setData({ loading: true })
    } else {
      this.setData({ loadingMore: true })
    }

    // 优先尝试云开发，失败则使用本地存储
    if (wx.cloud) {
      this.loadFromCloud(isLoadMore)
    } else {
      this.loadFromLocal(isLoadMore)
    }
  },

  // 从云开发加载记录
  loadFromCloud(isLoadMore) {
    const skip = isLoadMore ? this.data.currentPage * this.data.pageSize : 0

    wx.cloud.callFunction({
      name: 'getCalcRecords',
      data: {
        skip,
        limit: this.data.pageSize
      },
      success: (res) => {
        if (res.result && res.result.success) {
          const newRecords = res.result.records.map(record => ({
            ...record,
            wasteRate: this.fixWasteRate(record.wasteRate), // 修正损耗率
            formatTime: this.formatTime(record.timestamp)
          }))

          let records = []
          if (isLoadMore) {
            records = [...this.data.records, ...newRecords]
          } else {
            records = newRecords
          }

          this.setData({
            records,
            hasMore: newRecords.length === this.data.pageSize,
            currentPage: isLoadMore ? this.data.currentPage + 1 : 1,
            loading: false,
            loadingMore: false
          })
        } else {
          // 云开发失败，尝试本地存储
          this.loadFromLocal(isLoadMore)
        }
      },
      fail: (err) => {
        console.log('云开发加载失败，使用本地存储', err)
        // 云开发失败，使用本地存储
        this.loadFromLocal(isLoadMore)
      }
    })
  },

  // 从本地存储加载记录
  loadFromLocal(isLoadMore) {
    try {
      const allRecords = wx.getStorageSync('calc_records') || []
      const skip = isLoadMore ? this.data.currentPage * this.data.pageSize : 0
      const newRecords = allRecords.slice(skip, skip + this.data.pageSize).map(record => ({
        ...record,
        wasteRate: this.fixWasteRate(record.wasteRate), // 修正损耗率
        formatTime: this.formatTime(record.timestamp)
      }))

      let records = []
      if (isLoadMore) {
        records = [...this.data.records, ...newRecords]
      } else {
        records = newRecords
      }

      this.setData({
        records,
        hasMore: skip + newRecords.length < allRecords.length,
        currentPage: isLoadMore ? this.data.currentPage + 1 : 1,
        loading: false,
        loadingMore: false
      })
    } catch (error) {
      console.log('本地存储加载失败', error)
      this.setData({ 
        loading: false, 
        loadingMore: false,
        records: []
      })
    }
  },

  // 刷新记录
  refreshRecords() {
    this.setData({
      currentPage: 0,
      hasMore: true
    })
    this.loadRecords()
  },

  // 加载更多
  loadMore() {
    if (this.data.loadingMore || !this.data.hasMore) {
      return
    }
    this.loadRecords(true)
  },

  // 重新计算
  recalculate(e) {
    console.log('recalculate 被调用')
    const record = e.currentTarget.dataset.record
    console.log('记录数据:', record)
    
    if (!record) {
      wx.showToast({
        title: '数据错误',
        icon: 'none'
      })
      return
    }

    // 直接构造计算数据并跳转到结果页
    const calculateData = {
      material: record.material,
      actualArea: parseFloat(record.area),
      unit: record.unit || '㎡',
      wasteRate: record.wasteRate,
      layout: record.layout || '正铺',
      isAdvanced: record.isAdvanced || false,
      rooms: record.rooms || [{
        name: '房间1',
        area: record.area,
        specialCoefficientIndex: 0
      }]
    }

    console.log('跳转数据:', calculateData)

    // 先存储数据到全局，然后跳转到tabBar页面
    console.log('存储重新计算数据到全局')
    getApp().globalData.pendingCalculateData = calculateData
    
    // 跳转到结果页（tabBar页面）
    wx.switchTab({
      url: '/pages/result/index',
      success: () => {
        console.log('跳转成功')
        // 延迟一下确保页面完全加载后再触发数据更新
        setTimeout(() => {
          const pages = getCurrentPages()
          const currentPage = pages[pages.length - 1]
          if (currentPage.route === 'pages/result/index') {
            console.log('手动触发result页面数据更新')
            currentPage.checkAndUpdateData()
          }
        }, 100)
      },
      fail: (err) => {
        console.log('跳转失败:', err)
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        })
      }
    })

    // 埋点：重新计算
    this.trackEvent('recalculate', { 
      recordId: record._id,
      material: record.material 
    })
  },

  // 复制记录
  copyRecord(e) {
    const record = e.currentTarget.dataset.record
    
    let roomInfo = ''
    if (record.rooms && record.rooms.length > 1) {
      roomInfo = `\n房间：${record.rooms.map(room => room.name).join('、')}`
    }

    const text = `【装修材料计算记录】
材料：${record.material}
面积：${record.area}${record.unit}
建议用量：${record.result}${record.resultUnit}
损耗率：${record.wasteRate}%${record.layout ? `\n铺贴方式：${record.layout}` : ''}${roomInfo}
计算时间：${record.formatTime}

*结果仅供参考，具体以实物为准`

    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        })
        // 埋点：复制记录
        this.trackEvent('copy_record', { 
          recordId: record._id,
          material: record.material 
        })
      }
    })
  },

  // 删除记录
  deleteRecord(e) {
    const recordId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.performDelete(recordId)
        }
      }
    })
  },

  // 执行删除操作
  performDelete(recordId) {
    wx.showLoading({ title: '删除中...' })
    
    // 优先尝试云开发删除
    if (wx.cloud) {
      wx.cloud.callFunction({
        name: 'deleteCalcRecord',
        data: { recordId },
        success: (res) => {
          wx.hideLoading()
          if (res.result && res.result.success) {
            this.removeRecordFromList(recordId)
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            // 埋点：删除记录
            this.trackEvent('delete_record', { recordId })
          } else {
            // 云开发删除失败，尝试本地删除
            this.deleteFromLocal(recordId)
          }
        },
        fail: (err) => {
          console.log('云开发删除失败，尝试本地删除', err)
          // 云开发删除失败，尝试本地删除
          this.deleteFromLocal(recordId)
        }
      })
    } else {
      // 直接使用本地删除
      this.deleteFromLocal(recordId)
    }
  },

  // 从本地存储删除
  deleteFromLocal(recordId) {
    try {
      const allRecords = wx.getStorageSync('calc_records') || []
      const filteredRecords = allRecords.filter(record => record._id !== recordId)
      
      wx.setStorageSync('calc_records', filteredRecords)
      
      this.removeRecordFromList(recordId)
      
      wx.hideLoading()
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })
      
      // 埋点：删除记录
      this.trackEvent('delete_record', { recordId })
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      })
      console.log('本地删除失败', error)
    }
  },

  // 从列表中移除记录
  removeRecordFromList(recordId) {
    const records = this.data.records.filter(record => record._id !== recordId)
    this.setData({ records })
  },

  // 前往计算页
  goToCalculate() {
    wx.switchTab({
      url: '/pages/materials/index'
    })
  },

  // 修正损耗率数据
  fixWasteRate(wasteRate) {
    // 如果损耗率大于50，说明是错误的数据（被多乘了100）
    if (wasteRate > 50) {
      return Math.round(wasteRate / 100 * 10) / 10 // 除以100并保留1位小数
    }
    return wasteRate
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) { // 1分钟内
      return '刚刚'
    } else if (diff < 3600000) { // 1小时内
      return `${Math.floor(diff / 60000)}分钟前`
    } else if (diff < 86400000) { // 1天内
      return `${Math.floor(diff / 3600000)}小时前`
    } else if (diff < 2592000000) { // 30天内
      return `${Math.floor(diff / 86400000)}天前`
    } else {
      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
    }
  },

  // 埋点事件
  trackEvent(event, data = {}) {
    wx.cloud.callFunction({
      name: 'trackEvent',
      data: {
        event,
        data,
        timestamp: Date.now(),
        page: 'history'
      }
    }).catch(err => {
      console.log('埋点失败', err)
    })
  },

  // 自定义分享
  onShareAppMessage(e) {
    console.log('分享方法被调用', e);
    
    let title = '装修材料计算器 - 计算历史';
    let path = '/pages/history/index';
    let imageUrl = '/images/share-cover.jpg';

    if (e && e.from === 'button' && e.target && e.target.dataset && e.target.dataset.record) {
      const r = e.target.dataset.record;
      const unit = r.unit || '';
      const resultUnit = r.resultUnit || '';
      title = `【${r.material}】面积${r.area}${unit}，建议用量${r.result}${resultUnit}`;
      path = '/pages/history/index';
    }

    return {
      title: title,
      path: path,
      imageUrl: imageUrl
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '装修计算器 - 计算历史记录',
      query: 'from=timeline',
      imageUrl: '/images/share-cover.jpg'
    }
  }
})