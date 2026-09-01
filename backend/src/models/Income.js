import mongoose from 'mongoose'

const incomeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    source: {
      type: String,
      required: true,
      enum: ['Salary', 'Freelance', 'Business', 'Allowance', 'Investment', 'Gift', 'Other'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

incomeSchema.index({ userId: 1, date: -1 })

const Income = mongoose.model('Income', incomeSchema)

export default Income
