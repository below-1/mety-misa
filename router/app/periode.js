const multer = require('fastify-multer')
const upload = multer()
const ObjectID = require('mongodb').ObjectID

module.exports = async (fastify) => {

  const collection = fastify.mongo.db.collection('periode')

  fastify.get('/', {
    handler: async (request, reply) => {
      const result = collection.find({})
      const items = await result.toArray()
      console.log(items)
      reply.view('app/periode/list', {
        items
      })
    }
  })

  fastify.get('/create', {
    handler: async (request, reply) => {
      return reply.view('app/periode/create')
    }
  })

  fastify.post('/create', {
    preHandler: upload.none(),
    handler: async (request, reply) => {
      const data = request.body
      const result = await collection.insertOne(data)
      reply.redirect('/app/periode')
    }
  })

  fastify.get('/:id/edit', {
    handler: async (request, reply) => {
      const _id = ObjectID(request.params.id)
      const doc = await collection.findOne({ _id })
      reply.view('app/periode/edit', {
        item: doc
      })
    }
  })

  fastify.post('/:id/edit', {
    preHandler: upload.none(),
    handler: async (request, reply) => {
      const _id = ObjectID(request.params.id)
      const data = request.body
      const filter = { _id }
      const updateResult = await collection.updateOne(filter, {
        $set: data
      })
      reply.redirect('/app/periode')
    }
  })

  fastify.get('/:id/delete', async (request, reply) => {
    const { id } = request.params
    const delResult = await collection.deleteOne({ _id: ObjectID(id) })
    reply.redirect('/app/periode')
  })
}