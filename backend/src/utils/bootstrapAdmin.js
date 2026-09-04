import User from '../models/User.js'

const bootstrapAdmin = async () => {
  await Promise.all([
    User.updateMany({ role: { $exists: false } }, { $set: { role: 'user' } }),
    User.updateMany({ status: { $exists: false } }, { $set: { status: 'active' } }),
  ])

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME?.trim() || 'System Administrator'

  if (!email || !password) {
    console.info('Admin bootstrap skipped: set ADMIN_EMAIL and ADMIN_PASSWORD to create an admin account')
    return
  }

  if (password.length < 6) {
    throw new Error('ADMIN_PASSWORD must be at least 6 characters')
  }

  const existingUser = await User.findOne({ email })

  if (existingUser) {
    if (existingUser.role !== 'admin' || existingUser.status !== 'active') {
      existingUser.role = 'admin'
      existingUser.status = 'active'
      await existingUser.save()
      console.info(`Admin access granted to ${email}`)
    }
    return
  }

  await User.create({ name, email, password, role: 'admin', status: 'active' })
  console.info(`Admin account created for ${email}`)
}

export default bootstrapAdmin
