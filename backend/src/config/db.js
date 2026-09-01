import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

const getMongoUri = async () => {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI
  }

  const memoryServer = await MongoMemoryServer.create()
  const uri = memoryServer.getUri()
  process.env.MONGODB_URI = uri
  return uri
}

const connectDB = async () => {
  try {
    const mongoUri = await getMongoUri()
    await mongoose.connect(mongoUri)
    console.info('MongoDB connected successfully')
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    throw error
  }
}

export default connectDB
