import mongoose from 'mongoose'

const expenseSchema = new mongoose.Schema(
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
    category: {
      type: String,
      required: true,
      enum: ['Food', 'Transportation', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Travel', 'Other'],
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
    paymentMethod: {
      type: String,
      required: true,
      enum: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'E-Wallet', 'Other'],
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

expenseSchema.index({ userId: 1, date: -1 })

const Expense = mongoose.model('Expense', expenseSchema)

export default Expense
