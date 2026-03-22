const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')
const listingRoutes = require('./routes/listings')
const p2pRoutes = require('./routes/p2p')

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] }
})

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/listings', listingRoutes)
app.use('/api/p2p', p2pRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// Socket.io — real-time P2P notifications
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('join', (address) => {
    socket.join(address)
    console.log(`${address} joined their room`)
  })

  socket.on('p2p:offer', ({ toAddress, offer }) => {
    io.to(toAddress).emit('p2p:incoming', offer)
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

// DB + start
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected')
    server.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    })
  })
  .catch((err) => console.error('DB connection error:', err))
