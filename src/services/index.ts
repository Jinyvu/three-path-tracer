import user from './user'
import userMock from './user/mock'
import assert from './asset'
import assetMock from './asset/mock'

const environment = process.env.DEVELOPMENT_ENV

export const userApis = userMock
export const assetApis = assetMock