import cloud from '@lafjs/cloud'
const db = cloud.mongo.db

export default async function (ctx: FunctionContext) {
  console.log(ctx.request.method)

  if (ctx.request.method === "POST") {
    const ret = await db.collection('report').insertOne(ctx.body)
    return { status: true }
  }

  // 获取分页参数
  const page = parseInt(ctx.query?.page || '1')
  const pageSize = parseInt(ctx.query?.pageSize || '6')
  const search = ctx.query?.search || ''
  const skip = (page - 1) * pageSize

  // 构建查询条件
  const query = search ? {
    $or: [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ]
  } : {}

  // 获取总数
  const total = await db.collection('report').countDocuments(query)
  
  // 获取分页数据
  const data = await db.collection('report')
    .find(query)
    .sort({ createdAt: -1 }) // 按创建时间倒序排列
    .skip(skip)
    .limit(pageSize)
    .toArray()

  // 转换 _id 为 id
  const transformedData = data.map(item => {
    const { _id, ...rest } = item
    return { id: _id.toString(), ...rest }
  })

  return {
    data: transformedData || [],
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}