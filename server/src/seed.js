/**
 * Seed script — creates dummy P2P users + ads for testing
 * Run: node src/seed.js
 */
require('dotenv').config()
const mongoose = require('mongoose')
const User     = require('./models/User')
const Ad       = require('./models/Ad')

const DUMMY_USERS = [
  { username: 'CryptoKing',  email: 'cryptoking@test.com',  password: 'Test1234!', suiAddress: '0x1111111111111111111111111111111111111111111111111111111111111111' },
  { username: 'SuiWhale',    email: 'suiwhale@test.com',    password: 'Test1234!', suiAddress: '0x2222222222222222222222222222222222222222222222222222222222222222' },
  { username: 'MoonTrader',  email: 'moontrader@test.com',  password: 'Test1234!', suiAddress: '0x3333333333333333333333333333333333333333333333333333333333333333' },
  { username: 'BlockQueen',  email: 'blockqueen@test.com',  password: 'Test1234!', suiAddress: '0x4444444444444444444444444444444444444444444444444444444444444444' },
  { username: 'SatoshiJr',   email: 'satoshijr@test.com',   password: 'Test1234!', suiAddress: '0x5555555555555555555555555555555555555555555555555555555555555555' },
]

const DUMMY_ADS = (users) => [
  // ── SELL ads (people selling SUI — show on Buy tab) ──────────────────────
  {
    maker: users[0]._id, makerAddress: users[0].suiAddress,
    type: 'sell', asset: 'SUI',
    price: 3.48, totalAmount: 500, minOrder: 5, maxOrder: 100,
    paymentMethod: 'Bank Transfer',
    terms: 'Payment within 15 minutes. Verified accounts only.',
    completedTrades: 142,
    status: 'active',
  },
  {
    maker: users[1]._id, makerAddress: users[1].suiAddress,
    type: 'sell', asset: 'SUI',
    price: 3.52, totalAmount: 200, minOrder: 10, maxOrder: 50,
    paymentMethod: 'PayPal',
    terms: 'Friends & Family only, no notes please.',
    completedTrades: 89,
    status: 'active',
  },
  {
    maker: users[2]._id, makerAddress: users[2].suiAddress,
    type: 'sell', asset: 'SUI',
    price: 3.45, totalAmount: 1000, minOrder: 20, maxOrder: 200,
    paymentMethod: 'Wise',
    terms: 'Fast release. Trade with confidence.',
    completedTrades: 310,
    status: 'active',
  },
  {
    maker: users[3]._id, makerAddress: users[3].suiAddress,
    type: 'sell', asset: 'SUI',
    price: 3.55, totalAmount: 80, minOrder: 1, maxOrder: 20,
    paymentMethod: 'Sui Transfer',
    terms: 'Instant release after confirmation.',
    completedTrades: 27,
    status: 'active',
  },
  {
    maker: users[4]._id, makerAddress: users[4].suiAddress,
    type: 'sell', asset: 'SUI',
    price: 3.50, totalAmount: 300, minOrder: 5, maxOrder: 150,
    paymentMethod: 'Bank Transfer',
    terms: 'Active 24/7. Best rates guaranteed.',
    completedTrades: 205,
    status: 'active',
  },

  // ── BUY ads (people wanting to buy SUI — show on Sell tab) ───────────────
  {
    maker: users[1]._id, makerAddress: users[1].suiAddress,
    type: 'buy', asset: 'SUI',
    price: 3.40, totalAmount: 400, minOrder: 10, maxOrder: 100,
    paymentMethod: 'Bank Transfer',
    terms: 'Will pay instantly. Trusted buyer with high volume.',
    completedTrades: 89,
    status: 'active',
  },
  {
    maker: users[2]._id, makerAddress: users[2].suiAddress,
    type: 'buy', asset: 'SUI',
    price: 3.38, totalAmount: 250, minOrder: 5, maxOrder: 50,
    paymentMethod: 'PayPal',
    terms: 'Fast payment. Message before trading.',
    completedTrades: 310,
    status: 'active',
  },
  {
    maker: users[0]._id, makerAddress: users[0].suiAddress,
    type: 'buy', asset: 'SUI',
    price: 3.42, totalAmount: 600, minOrder: 20, maxOrder: 200,
    paymentMethod: 'Wise',
    terms: 'Premium buyer. 5 star experience guaranteed.',
    completedTrades: 142,
    status: 'active',
  },
]

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  // Remove old dummy data
  await User.deleteMany({ email: { $in: DUMMY_USERS.map(u => u.email) } })
  await Ad.deleteMany({})
  console.log('Cleared old seed data')

  // Create users (password hashing handled by pre-save hook)
  const created = []
  for (const u of DUMMY_USERS) {
    const user = new User(u)
    await user.save()
    created.push(user)
    console.log(`Created user: ${u.username}`)
  }

  // Create ads
  const ads = DUMMY_ADS(created)
  await Ad.insertMany(ads)
  console.log(`Created ${ads.length} ads (${ads.filter(a=>a.type==='sell').length} sell, ${ads.filter(a=>a.type==='buy').length} buy)`)

  console.log('\n✅ Seed complete!')
  console.log('   Buy tab  → 5 sell ads')
  console.log('   Sell tab → 3 buy ads')
  await mongoose.disconnect()
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
