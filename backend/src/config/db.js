import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI?.trim()

    if (!mongoUri) {
      throw new Error('MONGODB_URI is required. Add it to backend/.env before starting the server.')
    }

    await mongoose.connect(mongoUri)
    console.info(`MongoDB connected successfully (${mongoose.connection.name})`)
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    throw error
  }
}

export default connectDB
