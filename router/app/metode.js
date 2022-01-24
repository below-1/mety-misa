const multer = require('fastify-multer')
const upload = multer()
const ObjectID = require('mongodb').ObjectID
const _ = require('lodash')
const log_if = (s, cond) => {
  if (cond) {
    console.log(s)
  }
}

function wp({ xs, weights }) {
  const totalWeights = weights.reduce((a, b) => a + b, 0)
  const normedWeights = weights.map(w => w / totalWeights)
  console.log(normedWeights)
  console.log(xs)

  const result = xs
    .map((row, rowIndex) => {
      // console.log(row.data.map((x, j) => Math.pow(x, weights[j])))
      const powers = row.data
        .map((x, j) => {
          const res = Math.pow(x, normedWeights[j])
          return res
        })
      console.log(`${xs[rowIndex].nama} -> ${powers}`)
      // console.log(powers)
      const mults = powers.reduce((a, b) => a * b, 1)
      return mults
        
    })
  result.forEach((row, rowIndex) => {
    console.log(`${xs[rowIndex].nama} -> ${row}`)
  })
  const packedResult = result.map((r, i) => {
    return {
      nama: xs[i].nama,
      value: r
    }
  })
  const totalV = packedResult.map(r => r.value).reduce((a, b) => a + b, 0)
  const withV = result.map((r, i) => {
    return {
      _id: xs[i]._id,
      nama: xs[i].nama,
      v: r / totalV
    }
  })

  const rank = _.sortBy(withV, (r) => r.v).reverse()
  return rank
}

function compareResult(xs1, xs2) {
  return xs1.map((xi, i) => {
    const xj = xs2[i]
    if (xi._id != xj._id) {
      return 1
    }
    return 0
  }).reduce((a, b) => a + b, 0)
}

function singleSensitivitas({ xs, weights, icriteria, weightChange }) {
  const oriResult = wp({ xs, weights })
  let updatedWeights = [ ...weights ]
  updatedWeights[icriteria] += weightChange
  const n = oriResult.length
  const modResult = wp({ xs, weights: updatedWeights })
  const result = oriResult.map((xi, i) => {
    const xj = modResult[i]
    const newPos = modResult.findIndex(_x => _x._id == xi._id)
    let item = { ...xi }
    if (xi._id != xj._id) {
      item = {
        ...item,
        change: true,
        newPos
      }
    }
    return item
  })
  return result
}

function sensitivitas({ xs, weights, weightChanges }) {
  const oriResult = wp({ xs, weights })
  const n = oriResult.length
  const results_05 = []
  const results_1 = []
  for (let i = 0; i < 5; i++) {
    let updatedWeights = [ ...weights ]
    updatedWeights[i] += weightChanges.w1
    const modResult = wp({ xs, weights: updatedWeights })
    // console.log(modResult)
    // throw new Error('stop');
    const diffs = compareResult(oriResult, modResult)
    results_05.push(diffs / n * 100)
  }
  for (let i = 0; i < 5; i++) {
    let updatedWeights = [ ...weights ]
    updatedWeights[i] += weightChanges.w2
    const modResult = wp({ xs, weights: updatedWeights })
    const diffs = compareResult(oriResult, modResult)
    results_1.push(diffs / n * 100)
  }
  console.log(results_05)
  return [
    results_05,
    results_1
 ]
}

module.exports = async (fastify) => {
  

  fastify.get('/rank', async (request, reply) => {
    let query = {}
    let currentPeriode = null

    if (!request.query.periode) {
      const periode = await fastify.mongo.db.collection('periode').findOne({ })
      if (periode) {
        currentPeriode = ObjectID(periode._id)
      }
    } else {
      currentPeriode = ObjectID(request.query.periode)
    }

    if (currentPeriode) {
      query.periode = currentPeriode
    }

    const periodeList = await fastify.mongo.db.collection('periode').find({}).toArray()

    const weights = await fastify.mongo.db.collection('bobot').findOne({})
    const xs = await fastify.mongo.db.collection('dosen').find(query).toArray()
    const result = wp({ xs, weights: weights.data })
    reply.view('app/rank', {
      items: result,
      periodeList,
      currentPeriode: currentPeriode ? currentPeriode.toString() : ''
    })
  })

  fastify.get('/sensitivitas', async (request, reply) => {
    const item = {
      w1: 0,
      w2: 0
    }
    reply.view('app/sensitivitas-form', {
      item
    })
  })

  fastify.post('/sensitivitas', {
    preHandler: upload.none(),
    handler: async (request, reply) => {
      const weightChanges = request.body;
      weightChanges.w1 = parseFloat(weightChanges.w1)
      weightChanges.w2 = parseFloat(weightChanges.w2)
      request.session.weightChanges = weightChanges;
      const weights = await fastify.mongo.db.collection('bobot').findOne({})
      const xs = await fastify.mongo.db.collection('dosen').find({}).toArray()
      const results = sensitivitas({ weights: weights.data, xs, weightChanges })
      const criteria = [
        'pendidikan dan pengajaran',
        'penelititan',
        'pengabdian pada masyrakat',
        'penilaian mahasiswa',
        'penilaian atasan'
      ]
      const diffs = results.map((result, ci) => {
        return result.map((x, i) => ({
          c: criteria[i],
          v: x
        }))
        // const totalData = changes.length
        // const ratioChange = totalChanges / totalData
        // return {
        //   changes,
        //   totalChanges,
        //   totalData,
        //   ratioChange
        // }
      })

      const criteriaChanges = weights.data.map((w, i) => {
        return {
          w,
          c: criteria[i],
          diff_05: diffs[0][i].v,
          diff_1: diffs[1][i].v
        }
      })

        
      reply.view('app/sensitivitas', {
        diffs,
        criteriaChanges,
        weightChanges
      })
    }
  })

  fastify.get('/sensitivitas/:icriteria/:weightChange', async (request, reply) => {
    const weightChange = parseFloat(request.params.weightChange);
    const weights = await fastify.mongo.db.collection('bobot').findOne({})
    const xs = await fastify.mongo.db.collection('dosen').find({}).toArray()
    const icriteria = parseInt(request.params.icriteria)
    const result = singleSensitivitas({ xs, weights: weights.data, icriteria, weightChange })
    reply.view('app/sensitivitas-detail',{ result })
  })
}
