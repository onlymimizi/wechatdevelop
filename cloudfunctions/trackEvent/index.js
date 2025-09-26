const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 插入埋点事件
    const result = await db.collection('events').add({
      data: {
        openid: wxContext.OPENID,
        event: event.event,
        data: event.data || {},
        page: event.page || '',
        timestamp: event.timestamp || Date.now(),
        createTime: new Date(),
        // 用户信息
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
        // 环境信息
        env: wxContext.ENV
      }
    })

    return {
      success: true,
      eventId: result._id
    }
  } catch (error) {
    console.error('埋点失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}