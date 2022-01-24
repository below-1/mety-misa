const multer = require('fastify-multer')
const upload = multer()
const ObjectID = require('mongodb').ObjectID

module.exports = async (fastify) => {

  const collection = fastify.mongo.db.collection('dosen')
  const periodeCollection = fastify.mongo.db.collection('periode')

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
    let query = {}
    let currentPeriode = null

    if (!request.query.periode) {
      const periode = await periodeCollection.findOne({ })
      if (periode) {
        currentPeriode = ObjectID(periode._id)
      }
    } else {
      currentPeriode = ObjectID(request.query.periode)
    }

    if (currentPeriode) {
      query.periode = currentPeriode
    }
    // const tahun = periode.substr(0, 4)
    // const semester = periode.substr(4, 1)

    const result = collection.find(query)
    const periodeList = await periodeCollection.find({}).toArray()
    const items = await result.toArray()
    reply.view('app/dosen/list', {
      items,
      periodeList,
      currentPeriode: currentPeriode ? currentPeriode.toString() : ''
    })
  })

  fastify.get('/create', async (request, reply) => {
    const periodeList = await periodeCollection.find({}).toArray()
    reply.view('app/dosen/create', {
      periodeList
    })
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
        periode: ObjectID(data.periode),
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
    const periode = doc.periode;
    let tahun = null;
    let semester = null;
    console.log(doc)
    if (periode) {
      tahun = periode.substr(0, 4)
      semester = periode.substr(4, 1)
    }
    reply.view('app/dosen/edit', {
      item: {
        ...doc,
        tahun,
        semester
      }
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
      const { tahun, semester } = rest;
      const periode = `${tahun}${semester}`;
      const payload = {
        nama, 
        periode: ObjectID(rest.periode),
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