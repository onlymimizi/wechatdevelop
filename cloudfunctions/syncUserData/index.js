// 云函数：用户数据同步
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action, records, settings, timestamp } = event
  
  try {
    const collection = db.collection('user_data')
    const openid = wxContext.OPENID
    
    if (action === 'upload') {
      // 上传数据到云端
      const result = await collection.doc(openid).set({
        data: {
          openid,
          records: records || [],
          settings: settings || {},
          lastSyncTime: timestamp || Date.now(),
          updateTime: db.serverDate()
        }
      })
      
      return {
        success: true,
        message: '数据同步成功',
        syncTime: timestamp
      }
      
    } else if (action === 'download') {
      // 从云端下载数据
      const result = await collection.doc(openid).get()
      
      if (result.data) {
        return {
          success: true,
          data: {
            records: result.data.records || [],
            settings: result.data.settings || {},
            lastSyncTime: result.data.lastSyncTime
          }
        }
      } else {
        return {
          success: false,
          error: '云端暂无数据'
        }
      }
      
    } else {
      return {
        success: false,
        error: '无效的操作类型'
      }
    }
    
  } catch (error) {
    console.error('云端同步失败:', error)
    return {
      success: false,
      error: error.message || '云端同步失败'
    }
  }
}