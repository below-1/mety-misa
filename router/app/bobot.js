const multer = require('fastify-multer')
const upload = multer()

module.exports = async (fastify) => {
  const collection = fastify.mongo.db.collection('bobot')

  function populateWeightsFromForm(form) {
    const data = []
    for (let i = 1; i <= 5; i++) {
      const key = `w${i}`
      let v = parseFloat(form[key])
      data.push(v)
    }
    return data
  }

  fastify.get('/', async (request, reply) => {
    const doc = await collection.findOne({})
    const item = doc ? doc : {
      data: [0.2, 0.3, 0.3, 0.15, 0.15]
    }
    console.log(item)
    reply.view('app/bobot', {
      item: JSON.stringify(item.data)
    })
  })

  fastify.post('/',{
    preHandler: upload.none(),
    handler: async (request, reply) => {
      const now = new Date()
      const payload = {
        data: populateWeightsFromForm(request.body),
        created_at: now
      }
      await collection.deleteMany({})
      const insertResult = await collection.insertOne(payload)
      reply.redirect('/app/bobot')
    }
  })
}