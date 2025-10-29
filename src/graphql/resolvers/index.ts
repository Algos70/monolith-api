import { adminUserResolvers } from './adminUserResolvers';
import { adminCategoryResolvers } from './adminCategoryResolvers';
import { adminProductResolvers } from './adminProductResolvers';
import { adminWalletResolvers } from './adminWalletResolvers';
import { adminOrderResolvers } from './adminOrderResolvers';
import { adminOrderItemResolvers } from './adminOrderItemResolvers';

export const resolvers = {
  Query: {
    ...adminUserResolvers.Query,
    ...adminCategoryResolvers.Query,
    ...adminProductResolvers.Query,
    ...adminWalletResolvers.Query,
    ...adminOrderResolvers.Query,
    ...adminOrderItemResolvers.Query
  },
  Mutation: {
    ...adminCategoryResolvers.Mutation,
    ...adminProductResolvers.Mutation,
    ...adminWalletResolvers.Mutation,
    ...adminOrderResolvers.Mutation,
    ...adminOrderItemResolvers.Mutation
  }
};