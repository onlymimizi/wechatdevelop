Page({
  data: {
    records: [],
    loading: true,
    loadingMore: false,
    hasMore: true,
    pageSize: 10,
    currentPage: 0
  },

  onLoad() {
    this.loadRecords()
    // 埋点：页面访问
    this.trackEvent('page_view', { page: 'history' })
  },

  onShow() {
    // 刷新数据
    this.refreshRecords()
  },

  // 加载记录
  loadRecords(isLoadMore = false) {
    if (!isLoadMore) {
      this.setData({ loading: true })
    } else {
      this.setData({ loadingMore: true })
    }

    const skip = isLoadMore ? this.data.currentPage * this.data.pageSize : 0

    wx.cloud.callFunction({
      name: 'getCalcRecords',
      data: {
        skip,
        limit: this.data.pageSize
      },
      success: (res) => {
        if (res.result.success) {
          const newRecords = res.result.records.map(record => ({
            ...record,
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
          this.setData({ 
            loading: false, 
            loadingMore: false 
          })
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        this.setData({ 
          loading: false, 
          loadingMore: false 
        })
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        console.log('加载记录失败', err)
      }
    })
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
    const record = e.currentTarget.dataset.record
    
    // 构造参数
    const params = {
      material: record.material,
      area: record.area,
      wasteRate: record.wasteRate,
      layout: record.layout || '正铺',
      isAdvanced: record.isAdvanced || false
    }

    // 跳转到房间输入页
    wx.navigateTo({
      url: `/pages/input/house?params=${encodeURIComponent(JSON.stringify(params))}`
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
          wx.showLoading({ title: '删除中...' })
          
          wx.cloud.callFunction({
            name: 'deleteCalcRecord',
            data: { recordId },
            success: (res) => {
              wx.hideLoading()
              if (res.result.success) {
                // 从列表中移除
                const records = this.data.records.filter(record => record._id !== recordId)
                this.setData({ records })
                
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                })

                // 埋点：删除记录
                this.trackEvent('delete_record', { recordId })
              } else {
                wx.showToast({
                  title: '删除失败',
                  icon: 'none'
                })
              }
            },
            fail: (err) => {
              wx.hideLoading()
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              })
              console.log('删除记录失败', err)
            }
          })
        }
      }
    })
  },

  // 前往计算页
  goToCalculate() {
    wx.switchTab({
      url: '/pages/materials/index'
    })
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
  }
})