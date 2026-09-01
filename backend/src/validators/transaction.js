import { z } from 'zod'

export const expenseSchema = z.object({
  title: z.string().trim().min(2, 'Title is required'),
  amount: z.number({ invalid_type_error: 'Amount must be a number' }).positive('Amount must be positive'),
  category: z.enum(['Food', 'Transportation', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Travel', 'Other']),
  description: z.string().trim().max(500, 'Description is too long').optional().or(z.literal('')),
  date: z.coerce.date({ invalid_type_error: 'Valid date is required' }),
  paymentMethod: z.enum(['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'E-Wallet', 'Other']),
})

export const incomeSchema = z.object({
  title: z.string().trim().min(2, 'Title is required'),
  amount: z.number({ invalid_type_error: 'Amount must be a number' }).positive('Amount must be positive'),
  source: z.enum(['Salary', 'Freelance', 'Business', 'Allowance', 'Investment', 'Gift', 'Other']),
  description: z.string().trim().max(500, 'Description is too long').optional().or(z.literal('')),
  date: z.coerce.date({ invalid_type_error: 'Valid date is required' }),
})
