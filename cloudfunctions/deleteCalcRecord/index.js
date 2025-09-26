const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const { recordId } = event
    
    // 删除指定记录（只能删除自己的记录）
    const result = await db.collection('calc_records')
      .where({
        _id: recordId,
        openid: wxContext.OPENID
      })
      .remove()

    if (result.stats.removed > 0) {
      return {
        success: true,
        message: '删除成功'
      }
    } else {
      return {
        success: false,
        error: '记录不存在或无权限删除'
      }
    }
  } catch (error) {
    console.error('删除记录失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}