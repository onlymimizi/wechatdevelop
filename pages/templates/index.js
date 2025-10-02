Page({
  data: {
    isDarkTheme: false,
    templates: [
      {
        id: 1,
        name: '90㎡三室两厅全屋地砖',
        material: '瓷砖',
        description: '800×800mm客厅+600×600mm卧室，预算12000-18000元',
        icon: '🏠',
        category: '全屋',
        wasteRate: 8,
        layout: '正铺',
        unit: '㎡',
        tips: '包含客厅、卧室、过道，扣除厨卫面积。建议选择一线品牌，质量稳定',
        popular: true,
        estimatedArea: '65-75㎡',
        difficulty: '简单',
        difficultyLevel: 'easy',
        costRange: '180-250元/㎡'
      },
      {
        id: 2,
        name: '小户型厨卫防水+瓷砖',
        material: '瓷砖',
        description: '厨房300×600mm墙砖+卫生间300×300mm地砖',
        icon: '🚿',
        category: '厨卫',
        wasteRate: 15,
        layout: '正铺',
        unit: '㎡',
        tips: '包含防水涂料用量。厨房墙砖建议选择易清洁款，卫生间选防滑砖',
        popular: true,
        estimatedArea: '15-25㎡',
        difficulty: '中等',
        difficultyLevel: 'medium',
        costRange: '150-300元/㎡'
      },
      {
        id: 3,
        name: '主卧实木地板铺装',
        material: '地板',
        description: '15-20㎡卧室，910×125mm实木地板',
        icon: '🛏️',
        category: '卧室',
        wasteRate: 12,
        layout: '正铺',
        unit: '㎡',
        tips: '包含地板、踢脚线、扣条。需要地面找平，建议预留5-7天安装周期',
        popular: true,
        estimatedArea: '15-20㎡',
        difficulty: '中等',
        difficultyLevel: 'medium',
        costRange: '300-800元/㎡'
      },
      {
        id: 4,
        name: '老房翻新墙面处理',
        material: '腻子粉',
        description: '铲除旧墙皮+重新批腻子+底漆面漆',
        icon: '🎨',
        category: '墙面',
        wasteRate: 10,
        layout: '正铺',
        unit: 'kg',
        tips: '老房翻新损耗大。包含铲墙、修补、腻子、油漆全套。建议选择环保材料',
        popular: false,
        estimatedArea: '按墙面积×2.5倍',
        difficulty: '复杂',
        difficultyLevel: 'hard',
        costRange: '40-80元/㎡'
      },
      {
        id: 5,
        name: '复式楼梯间瓷砖',
        material: '瓷砖',
        description: '楼梯踏步+侧面+平台，防滑处理',
        icon: '🪜',
        category: '楼梯',
        wasteRate: 20,
        layout: '正铺',
        unit: '㎡',
        tips: '楼梯施工复杂，损耗率高。需要专业切割，建议选择防滑系数高的砖',
        popular: false,
        estimatedArea: '按步数×0.8㎡',
        difficulty: '复杂',
        difficultyLevel: 'hard',
        costRange: '200-400元/㎡'
      },
      {
        id: 6,
        name: '阳台封装+地砖铺贴',
        material: '瓷砖',
        description: '6-10㎡阳台，包含防水+地砖+墙砖',
        icon: '🌞',
        category: '阳台',
        wasteRate: 12,
        layout: '正铺',
        unit: '㎡',
        tips: '露天阳台需要做防水。选择耐候性强的瓷砖，建议加装地漏',
        popular: false,
        estimatedArea: '6-10㎡',
        difficulty: '中等',
        difficultyLevel: 'medium',
        costRange: '120-200元/㎡'
      }
    ],
    selectedCategory: 'all',
    filteredTemplates: [],
    categories: [
      { key: 'all', name: '全部', icon: '📋' },
      { key: '全屋', name: '全屋', icon: '🏠' },
      { key: '厨卫', name: '厨卫', icon: '🚿' },
      { key: '卧室', name: '卧室', icon: '🛏️' },
      { key: '墙面', name: '墙面', icon: '🎨' },
      { key: '楼梯', name: '楼梯', icon: '🪜' },
      { key: '阳台', name: '阳台', icon: '🌞' }
    ]
  },

  onLoad() {
    // 初始化过滤模板
    this.updateFilteredTemplates()
    // 检查主题
    this.checkTheme()
    // 埋点：页面访问
    this.trackEvent('page_view', { page: 'templates' })
  },

  onShow() {
    // 每次显示时检查主题
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

  // 更新过滤后的模板列表
  updateFilteredTemplates() {
    const { templates, selectedCategory } = this.data
    const filteredTemplates = templates.filter(item => 
      selectedCategory === 'all' || item.category === selectedCategory
    )
    this.setData({ filteredTemplates })
  },

  // 切换分类
  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      selectedCategory: category
    })
    
    // 更新过滤后的模板列表
    this.updateFilteredTemplates()
    
    // 埋点：分类切换
    this.trackEvent('category_switch', { category })
  },

  // 使用模板
  useTemplate(e) {
    const template = e.currentTarget.dataset.template
    
    wx.showModal({
      title: '使用模板',
      content: `确定使用"${template.name}"模板进行计算吗？`,
      success: (res) => {
        if (res.confirm) {
          // 构造计算数据
          const calculateData = {
            material: template.material,
            wasteRate: template.wasteRate,
            layout: template.layout,
            unit: template.unit,
            isAdvanced: false,
            fromTemplate: true,
            templateName: template.name
          }
          
          // 存储到全局数据
          getApp().globalData.pendingCalculateData = calculateData
          
          // 跳转到输入页面
          wx.navigateTo({
            url: '/pages/input/house'
          })
          
          // 埋点：使用模板
          this.trackEvent('use_template', { 
            templateId: template.id,
            templateName: template.name,
            material: template.material
          })
        }
      }
    })
  },

  // 查看模板详情
  viewTemplate(e) {
    const template = e.currentTarget.dataset.template
    
    wx.showModal({
      title: template.name,
      content: `预算范围：${template.costRange}\n预估面积：${template.estimatedArea}\n施工难度：${template.difficulty}\n损耗率：${template.wasteRate}%\n\n💡 ${template.tips}`,
      showCancel: false,
      confirmText: '知道了'
    })
    
    // 埋点：查看详情
    this.trackEvent('view_template_detail', { 
      templateId: template.id,
      templateName: template.name
    })
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
          page: 'templates'
        }
      }).catch(err => {
        console.log('埋点失败', err)
      })
    }
  },

  // 自定义分享
  onShareAppMessage(e) {
    console.log('分享方法被调用', e);
    
    return {
      title: '装修材料计算器 - 模板库',
      path: '/pages/templates/index',
      imageUrl: '/images/share-cover.jpg'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '装修材料计算器 - 实用模板库',
      query: 'from=timeline',
      imageUrl: '/images/share-cover.jpg'
    }
  }
})