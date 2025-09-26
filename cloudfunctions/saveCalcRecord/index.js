const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 保存计算记录
    const result = await db.collection('calc_records').add({
      data: {
        openid: wxContext.OPENID,
        material: event.material,
        area: event.area,
        unit: event.unit,
        result: event.result,
        resultUnit: event.resultUnit,
        wasteRate: event.wasteRate,
        layout: event.layout,
        isAdvanced: event.isAdvanced || false,
        rooms: event.rooms || [],
        timestamp: event.timestamp || Date.now(),
        createTime: event.createTime || new Date().toISOString()
      }
    })

    // 同时更新用户信息（如果不存在则创建）
    try {
      await db.collection('users').doc(wxContext.OPENID).update({
        data: {
          lastActiveTime: new Date(),
          calcCount: db.command.inc(1)
        }
      })
    } catch (updateError) {
      // 用户不存在，创建新用户
      if (updateError.errCode === -502003) {
        await db.collection('users').add({
          data: {
            _id: wxContext.OPENID,
            openid: wxContext.OPENID,
            createTime: new Date(),
            lastActiveTime: new Date(),
            calcCount: 1
          }
        })
      }
    }

    return {
      success: true,
      recordId: result._id
    }
  } catch (error) {
    console.error('保存记录失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}