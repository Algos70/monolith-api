import { adminUserResolvers } from './adminUserResolvers';
import { adminCategoryResolvers } from './adminCategoryResolvers';
import { adminProductResolvers } from './adminProductResolvers';
import { adminWalletResolvers } from './adminWalletResolvers';
import { adminOrderResolvers } from './adminOrderResolvers';
import { adminOrderItemResolvers } from './adminOrderItemResolvers';
import { adminCartResolvers } from './adminCartResolvers';
import { cartResolvers } from './cartResolvers';
import { productResolvers } from './productResolvers';
import { categoryResolvers } from './categoryResolvers';
import { walletResolvers } from './walletResolvers';

export const resolvers = {
  Query: {
    ...adminUserResolvers.Query,
    ...adminCategoryResolvers.Query,
    ...adminProductResolvers.Query,
    ...adminWalletResolvers.Query,
    ...adminOrderResolvers.Query,
    ...adminOrderItemResolvers.Query,
    ...adminCartResolvers.Query,
    ...cartResolvers.Query,
    ...productResolvers.Query,
    ...categoryResolvers.Query,
    ...walletResolvers.Query
  },
  Mutation: {
    ...adminCategoryResolvers.Mutation,
    ...adminProductResolvers.Mutation,
    ...adminWalletResolvers.Mutation,
    ...adminOrderResolvers.Mutation,
    ...adminOrderItemResolvers.Mutation,
    ...adminCartResolvers.Mutation,
    ...cartResolvers.Mutation,
    ...walletResolvers.Mutation
  }
};