import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import request from 'supertest'
import { createApp } from '../src/app.js'
import Component from '../src/models/component.js'
import PCBuild from '../src/models/pcBuild.js'
import Order from '../src/models/order.js'

const activeComponent = { _id: new mongoose.Types.ObjectId(), name: 'Demo CPU', category: 'Processors (CPU)', active: true }

function createModelStub({ rows = [activeComponent], total = rows.length, listError } = {}) {
  const calls = {}
  return {
    calls,
    find(filter) {
      calls.filter = filter
      const query = {
        sort(value) { calls.sort = value; return this },
        skip(value) { calls.skip = value; return this },
        limit(value) { calls.limit = value; return this },
        then(resolve, reject) { return Promise.resolve(listError ? Promise.reject(listError) : rows).then(resolve, reject) },
      }
      return query
    },
    countDocuments(filter) { calls.countFilter = filter; return Promise.resolve(total) },
    findOne(filter) { calls.detailFilter = filter; return Promise.resolve(filter.active ? activeComponent : null) },
  }
}

describe('PCForge API foundation', () => {
  let healthyApp
  before(() => { healthyApp = createApp({ ComponentModel: createModelStub(), isDatabaseConnected: () => true }) })
  after(async () => { await mongoose.disconnect() })

  it('returns connected status from GET /api/health', async () => {
    const response = await request(healthyApp).get('/api/health')
    assert.equal(response.status, 200)
    assert.deepEqual(response.body, { success: true, data: { status: 'ok', database: 'connected' } })
  })

  it('reports database downtime instead of claiming health', async () => {
    const app = createApp({ isDatabaseConnected: () => false })
    const response = await request(app).get('/api/health')
    assert.equal(response.status, 503)
    assert.equal(response.body.data.database, 'disconnected')

    const componentsResponse = await request(app).get('/api/components')
    assert.equal(componentsResponse.status, 503)
    assert.equal(componentsResponse.body.error.code, 'DATABASE_UNAVAILABLE')
  })

  it('lists active components with category and bounded pagination', async () => {
    const model = createModelStub({ total: 31 })
    const response = await request(createApp({ ComponentModel: model, isDatabaseConnected: () => true }))
      .get('/api/components?category=Processors%20(CPU)&page=2&limit=10')
    assert.equal(response.status, 200)
    assert.equal(response.body.pagination.totalPages, 4)
    assert.deepEqual(model.calls.filter, { active: true, category: 'Processors (CPU)' })
    assert.equal(model.calls.skip, 10)
    assert.equal(model.calls.limit, 10)
  })

  it('rejects invalid categories, page values, and excessive page sizes', async () => {
    for (const query of ['?category=unknown', '?page=0', '?page=1.5', '?limit=101']) {
      const response = await request(healthyApp).get(`/api/components${query}`)
      assert.equal(response.status, 400, query)
      assert.equal(response.body.success, false)
    }
  })

  it('validates component IDs and hides inactive or missing records', async () => {
    assert.equal((await request(healthyApp).get('/api/components/not-an-id')).status, 400)
    const missingModel = createModelStub({ rows: [] })
    missingModel.findOne = async () => null
    const response = await request(createApp({ ComponentModel: missingModel, isDatabaseConnected: () => true }))
      .get(`/api/components/${new mongoose.Types.ObjectId()}`)
    assert.equal(response.status, 404)
  })

  it('returns consistent not-found and sanitized database error responses', async () => {
    const notFound = await request(healthyApp).get('/api/missing')
    assert.equal(notFound.status, 404)
    assert.equal(notFound.body.error.code, 'NOT_FOUND')

    const failingModel = createModelStub({ listError: new Error('private connection detail') })
    const failure = await request(createApp({ ComponentModel: failingModel, isDatabaseConnected: () => true }))
      .get('/api/components')
    assert.equal(failure.status, 500)
    assert.doesNotMatch(JSON.stringify(failure.body), /private connection detail/)
    assert.equal(failure.body.error.message, 'An unexpected server error occurred.')
  })

  it('handles malformed JSON and rejects disallowed browser origins', async () => {
    const malformed = await request(healthyApp).post('/api/components').set('content-type', 'application/json').send('{')
    assert.equal(malformed.status, 400)
    assert.equal(malformed.body.error.code, 'INVALID_JSON')

    const forbidden = await request(healthyApp).get('/api/health').set('Origin', 'https://example.invalid')
    assert.equal(forbidden.status, 403)
    assert.equal(forbidden.body.error.code, 'ORIGIN_NOT_ALLOWED')
  })

  it('validates component and build schema constraints', () => {
    const component = new Component({ name: 'CPU', category: 'invalid', brand: 'Example', model: 'X1', priceInr: 1.5, stockStatus: 'unknown' })
    const componentError = component.validateSync()
    assert.ok(componentError.errors.category)
    assert.ok(componentError.errors.priceInr)
    assert.ok(componentError.errors.stockStatus)

    const build = new PCBuild({ intendedUse: 'Gaming', budgetInr: 10.25, calculatedTotalInr: 10, selectedComponents: [] })
    const buildError = build.validateSync()
    assert.ok(buildError.errors.budgetInr)
    assert.ok(buildError.errors.selectedComponents)
  })

  it('requires a build or component snapshot on an order and validates integer INR', async () => {
    const customer = { name: 'Example', email: 'example@example.com', phone: '1234567890', address: { line1: '1 Main Street', city: 'Pune', state: 'Maharashtra', postalCode: '411001' } }
    const invalid = new Order({ customer, totalInr: 100.5 })
    await assert.rejects(invalid.validate(), (error) => Boolean(error.errors.items && error.errors.totalInr))

    const valid = new Order({
      customer,
      items: [{ name: 'Sample component', model: 'DEMO-1', quantity: 1, unitPriceInr: 100 }],
      totalInr: 100,
    })
    await valid.validate()
    assert.equal(valid.paymentStatus, 'pending')
    assert.equal(valid.orderStatus, 'pending')
  })
})
