import mongoose from 'mongoose'

const appSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      required: true,
      default: 'global',
    },
    allowRegistration: {
      type: Boolean,
      default: true,
    },
    supportEmail: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true },
)

const AppSetting = mongoose.model('AppSetting', appSettingSchema)

export const getAppSettings = () => AppSetting.findOneAndUpdate(
  { key: 'global' },
  { $setOnInsert: { key: 'global' } },
  { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
)

export default AppSetting
