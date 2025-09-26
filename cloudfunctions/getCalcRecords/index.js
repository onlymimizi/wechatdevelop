const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const { skip = 0, limit = 10 } = event
    
    // 查询用户的计算记录
    const result = await db.collection('calc_records')
      .where({
        openid: wxContext.OPENID
      })
      .orderBy('timestamp', 'desc')
      .skip(skip)
      .limit(limit)
      .get()

    return {
      success: true,
      records: result.data,
      total: result.data.length
    }
  } catch (error) {
    console.error('获取记录失败:', error)
    return {
      success: false,
      error: error.message,
      records: []
    }
  }
}