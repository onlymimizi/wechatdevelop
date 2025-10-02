Page({
  data: {
    // 主题设置
    theme: 'light', // light, dark, auto
    themeOptions: [
      { key: 'light', name: '浅色模式', icon: '☀️' },
      { key: 'dark', name: '深色模式', icon: '🌙' },
      { key: 'auto', name: '跟随系统', icon: '🔄' }
    ],
    
    // 单位设置
    defaultUnit: '㎡', // ㎡, 坪
    unitOptions: [
      { key: '㎡', name: '平方米(㎡)', desc: '国际标准单位' },
      { key: '坪', name: '坪', desc: '台湾地区常用' }
    ],
    
    // 损耗率设置
    defaultWasteRate: 8, // 默认损耗率
    wasteRateRange: [5, 20], // 损耗率范围
    
    // 通知设置
    notifications: {
      calculation: true, // 计算完成通知
      reminder: false,   // 定期提醒
      update: true       // 更新通知
    },
    
    // 数据设置
    autoSave: true,      // 自动保存
    cloudSync: false,    // 云端同步
    maxRecords: 50,      // 最大记录数
    
    // 隐私设置
    analytics: true,     // 数据分析
    crashReport: true,   // 崩溃报告
    
    // 显示设置
    showTips: true,      // 显示提示
    showAnimation: true, // 显示动画
    
    // 缓存信息
    cacheSize: '0MB',
    recordCount: 0
  },

  onLoad() {
    this.loadSettings()
    this.loadCacheInfo()
    
    // 埋点：页面访问
    this.trackEvent('page_view', { page: 'settings' })
  },

  onShow() {
    // 每次显示页面时应用主题
    this.applyTheme()
  },

  // 加载设置
  loadSettings() {
    try {
      const settings = wx.getStorageSync('app_settings') || {}
      
      this.setData({
        theme: settings.theme || 'light',
        defaultUnit: settings.defaultUnit || '㎡',
        defaultWasteRate: settings.defaultWasteRate || 8,
        notifications: {
          calculation: settings.notifications?.calculation !== false,
          reminder: settings.notifications?.reminder || false,
          update: settings.notifications?.update || false // 默认关闭更新通知
        },
        autoSave: settings.autoSave !== false,
        cloudSync: settings.cloudSync || false,
        maxRecords: settings.maxRecords || 50,
        analytics: settings.analytics !== false,
        crashReport: settings.crashReport !== false,
        showTips: settings.showTips !== false,
        showAnimation: settings.showAnimation !== false
      }, () => {
        // 数据设置完成后应用主题
        this.applyTheme()
      })
    } catch (error) {
      console.log('加载设置失败', error)
    }
  },

  // 保存设置
  saveSettings() {
    try {
      const settings = {
        theme: this.data.theme,
        defaultUnit: this.data.defaultUnit,
        defaultWasteRate: this.data.defaultWasteRate,
        notifications: this.data.notifications,
        autoSave: this.data.autoSave,
        cloudSync: this.data.cloudSync,
        maxRecords: this.data.maxRecords,
        analytics: this.data.analytics,
        crashReport: this.data.crashReport,
        showTips: this.data.showTips,
        showAnimation: this.data.showAnimation
      }
      
      wx.setStorageSync('app_settings', settings)
      
      // 应用主题设置
      this.applyTheme()
      
    } catch (error) {
      console.log('保存设置失败', error)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },

  // 加载缓存信息
  loadCacheInfo() {
    try {
      const records = wx.getStorageSync('calc_records') || []
      const storageInfo = wx.getStorageInfoSync()
      
      this.setData({
        recordCount: records.length,
        cacheSize: (storageInfo.currentSize / 1024).toFixed(2) + 'KB'
      })
    } catch (error) {
      console.log('加载缓存信息失败', error)
    }
  },

  // 主题切换
  onThemeChange(e) {
    const theme = e.currentTarget.dataset.theme
    this.setData({ theme })
    this.saveSettings()
    
    wx.showToast({
      title: `已切换到${this.data.themeOptions.find(t => t.key === theme).name}`,
      icon: 'success'
    })
    
    // 埋点：主题切换
    this.trackEvent('theme_change', { theme })
  },

  // 单位切换
  onUnitChange(e) {
    const unit = e.currentTarget.dataset.unit
    this.setData({ defaultUnit: unit })
    this.saveSettings()
    
    wx.showToast({
      title: `默认单位已设为${unit}`,
      icon: 'success'
    })
    
    // 埋点：单位切换
    this.trackEvent('unit_change', { unit })
  },

  // 损耗率调整
  onWasteRateChange(e) {
    const wasteRate = parseInt(e.detail.value)
    this.setData({ defaultWasteRate: wasteRate })
    this.saveSettings()
    
    // 埋点：损耗率调整
    this.trackEvent('waste_rate_change', { wasteRate })
  },

  // 通知设置切换
  onNotificationToggle(e) {
    const type = e.currentTarget.dataset.type
    const notifications = { ...this.data.notifications }
    notifications[type] = !notifications[type]
    
    this.setData({ notifications })
    this.saveSettings()
    
    // 埋点：通知设置
    this.trackEvent('notification_toggle', { type, enabled: notifications[type] })
  },

  // 开关切换
  onSwitchToggle(e) {
    const field = e.currentTarget.dataset.field
    const value = !this.data[field]
    
    this.setData({ [field]: value })
    this.saveSettings()
    
    wx.showToast({
      title: value ? '已开启' : '已关闭',
      icon: 'success'
    })
    
    // 埋点：开关切换
    this.trackEvent('switch_toggle', { field, value })
  },

  // 最大记录数调整
  onMaxRecordsChange(e) {
    const maxRecords = parseInt(e.detail.value)
    this.setData({ maxRecords })
    this.saveSettings()
    
    // 埋点：最大记录数调整
    this.trackEvent('max_records_change', { maxRecords })
  },

  // 清除缓存
  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？这将删除所有计算记录，操作不可恢复。',
      confirmColor: '#ff4444',
      success: (res) => {
        if (res.confirm) {
          this.performClearCache()
        }
      }
    })
  },

  // 执行清除缓存
  performClearCache() {
    wx.showLoading({ title: '清除中...' })
    
    try {
      // 清除计算记录
      wx.removeStorageSync('calc_records')
      
      // 重新加载缓存信息
      this.loadCacheInfo()
      
      wx.hideLoading()
      wx.showToast({
        title: '缓存已清除',
        icon: 'success'
      })
      
      // 埋点：清除缓存
      this.trackEvent('clear_cache')
      
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: '清除失败',
        icon: 'none'
      })
      console.log('清除缓存失败', error)
    }
  },

  // 导出数据
  exportData() {
    wx.showLoading({ title: '导出中...' })
    
    try {
      const records = wx.getStorageSync('calc_records') || []
      const settings = wx.getStorageSync('app_settings') || {}
      
      const exportData = {
        version: '1.1.0',
        exportTime: new Date().toISOString(),
        records: records,
        settings: settings
      }
      
      const dataStr = JSON.stringify(exportData, null, 2)
      
      wx.setClipboardData({
        data: dataStr,
        success: () => {
          wx.hideLoading()
          wx.showModal({
            title: '导出成功',
            content: '数据已复制到剪贴板，您可以保存到文件中备份。',
            showCancel: false,
            confirmText: '知道了'
          })
          
          // 埋点：导出数据
          this.trackEvent('export_data', { recordCount: records.length })
        }
      })
      
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: '导出失败',
        icon: 'none'
      })
      console.log('导出数据失败', error)
    }
  },

  // 重置设置
  resetSettings() {
    wx.showModal({
      title: '重置设置',
      content: '确定要重置所有设置为默认值吗？',
      confirmColor: '#ff4444',
      success: (res) => {
        if (res.confirm) {
          this.performResetSettings()
        }
      }
    })
  },

  // 执行重置设置
  performResetSettings() {
    try {
      wx.removeStorageSync('app_settings')
      this.loadSettings()
      
      wx.showToast({
        title: '设置已重置',
        icon: 'success'
      })
      
      // 埋点：重置设置
      this.trackEvent('reset_settings')
      
    } catch (error) {
      wx.showToast({
        title: '重置失败',
        icon: 'none'
      })
      console.log('重置设置失败', error)
    }
  },

  // 应用主题
  applyTheme() {
    const { theme } = this.data
    let isDark = false
    
    if (theme === 'dark') {
      isDark = true
    } else if (theme === 'auto') {
      // 跟随系统
      const systemInfo = wx.getSystemInfoSync()
      isDark = systemInfo.theme === 'dark'
    }
    
    // 设置页面主题类名
    this.setData({
      isDarkTheme: isDark
    })
    
    // 设置导航栏样式
    this.setNavigationBarStyle(isDark)
    
    // 全局应用主题
    const app = getApp()
    app.globalData.isDarkMode = isDark
    app.applyGlobalTheme(isDark)
    
    // 通知其他页面更新主题
    wx.setStorageSync('current_theme', isDark ? 'dark' : 'light')
  },

  // 设置导航栏样式
  setNavigationBarStyle(isDark) {
    wx.setNavigationBarColor({
      frontColor: isDark ? '#ffffff' : '#000000',
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff'
    })
  },

  // 云端同步数据
  async syncToCloud() {
    if (!this.data.cloudSync) {
      wx.showToast({
        title: '请先开启云端同步',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '同步中...' })
    
    try {
      const records = wx.getStorageSync('calc_records') || []
      const settings = wx.getStorageSync('app_settings') || {}
      
      // 调用云函数保存数据
      const result = await wx.cloud.callFunction({
        name: 'syncUserData',
        data: {
          action: 'upload',
          records: records,
          settings: settings,
          timestamp: Date.now()
        }
      })
      
      if (result.result.success) {
        wx.hideLoading()
        wx.showToast({
          title: '同步成功',
          icon: 'success'
        })
        
        // 更新最后同步时间
        wx.setStorageSync('last_sync_time', Date.now())
        
        // 埋点：云端同步
        this.trackEvent('cloud_sync', { 
          action: 'upload',
          recordCount: records.length 
        })
      } else {
        throw new Error(result.result.error || '同步失败')
      }
      
    } catch (error) {
      wx.hideLoading()
      wx.showModal({
        title: '同步失败',
        content: '网络连接异常或云端服务暂不可用，请稍后重试。',
        showCancel: false
      })
      console.log('云端同步失败', error)
    }
  },

  // 从云端恢复数据
  async restoreFromCloud() {
    wx.showModal({
      title: '恢复数据',
      content: '确定要从云端恢复数据吗？这将覆盖本地所有数据。',
      confirmColor: '#007aff',
      success: async (res) => {
        if (res.confirm) {
          await this.performRestoreFromCloud()
        }
      }
    })
  },

  // 执行云端恢复
  async performRestoreFromCloud() {
    wx.showLoading({ title: '恢复中...' })
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'syncUserData',
        data: {
          action: 'download'
        }
      })
      
      if (result.result.success && result.result.data) {
        const { records, settings } = result.result.data
        
        // 恢复数据到本地
        if (records) {
          wx.setStorageSync('calc_records', records)
        }
        if (settings) {
          wx.setStorageSync('app_settings', settings)
          this.loadSettings() // 重新加载设置
        }
        
        // 重新加载缓存信息
        this.loadCacheInfo()
        
        wx.hideLoading()
        wx.showToast({
          title: '恢复成功',
          icon: 'success'
        })
        
        // 埋点：数据恢复
        this.trackEvent('cloud_restore', { 
          recordCount: records ? records.length : 0 
        })
        
      } else {
        throw new Error('云端暂无数据或数据格式错误')
      }
      
    } catch (error) {
      wx.hideLoading()
      wx.showModal({
        title: '恢复失败',
        content: error.message || '网络连接异常或云端暂无数据。',
        showCancel: false
      })
      console.log('云端恢复失败', error)
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 埋点事件
  trackEvent(event, data = {}) {
    if (wx.cloud) {
      wx.cloud.callFunction({
        name: 'trackEvent',
        data: {
          event,
          data,
          timestamp: Date.now(),
          page: 'settings'
        }
      }).catch(err => {
        console.log('埋点失败', err)
      })
    }
  }
})