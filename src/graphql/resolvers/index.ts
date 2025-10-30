import { adminUserResolvers } from './adminUserResolvers';
import { adminCategoryResolvers } from './adminCategoryResolvers';
import { adminProductResolvers } from './adminProductResolvers';
import { adminWalletResolvers } from './adminWalletResolvers';
import { adminOrderResolvers } from './adminOrderResolvers';
import { adminOrderItemResolvers } from './adminOrderItemResolvers';
import { adminCartResolvers } from './adminCartResolvers';
import { productResolvers } from './productResolvers';

export const resolvers = {
  Query: {
    ...adminUserResolvers.Query,
    ...adminCategoryResolvers.Query,
    ...adminProductResolvers.Query,
    ...adminWalletResolvers.Query,
    ...adminOrderResolvers.Query,
    ...adminOrderItemResolvers.Query,
    ...adminCartResolvers.Query,
    ...productResolvers.Query
  },
  Mutation: {
    ...adminCategoryResolvers.Mutation,
    ...adminProductResolvers.Mutation,
    ...adminWalletResolvers.Mutation,
    ...adminOrderResolvers.Mutation,
    ...adminOrderItemResolvers.Mutation,
    ...adminCartResolvers.Mutation
  }
};