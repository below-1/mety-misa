const multer = require('fastify-multer')
const upload = multer()
const ObjectID = require('mongodb').ObjectID

module.exports = async (fastify) => {

  const collection = fastify.mongo.db.collection('dosen')

  function populateDosenDataFromForm(form) {
    const data = []
    for (let i = 1; i <= 5; i++) {
      const key = `c${i}`
      let v = ((i == 1) || (i >= 4)) ? parseFloat(form[key]) : parseInt(form[key])
      data.push(v)
    }
    return data
  }

  fastify.get('/', async (request, reply) => {
    const result = collection.find({})
    const items = await result.toArray()
    console.log(items)
    reply.view('app/dosen/list', {
      items
    })
  })

  fastify.get('/create', async (request, reply) => {
    reply.view('app/dosen/create')
  })

  fastify.post('/create', {
    preHandler: upload.none(),
    handler: async (request, reply) => {
      const data = request.body
      const {
        nama,
        ...rest
      } = data
      let payload = { 
        nama, 
        data: populateDosenDataFromForm(rest) 
      }
      const result = await collection.insertOne(payload)
      reply.redirect('/app/dosen')
    }
  })

  fastify.get('/:id/delete', async (request, reply) => {
    const { id } = request.params
    const delResult = await collection.deleteOne({ _id: ObjectID(id) })
    reply.redirect('/app/dosen')
  })

  fastify.get('/:id/edit', async (request, reply) => {
    const { id } = request.params
    const doc = await collection.findOne({ _id: ObjectID(id) })
    reply.view('app/dosen/edit', {
      item: doc
    })
  })

  fastify.post('/:id/edit', {
    preHandler: upload.none(),
    handler: async (request, reply) => {
      const { id } = request.params
      const {
        nama,
        ...rest
      } = request.body
      const payload = {
        nama, 
        data: populateDosenDataFromForm(rest) 
      }
      console.log('payload')
      console.log(payload)
      const filter = { _id: ObjectID(id) }
      const updateResult = await collection.updateOne(filter, {
        $set: payload
      })
      reply.redirect('/app/dosen')
    }
  })
}