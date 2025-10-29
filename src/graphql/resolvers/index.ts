import { adminUserResolvers } from './adminUserResolvers';

export const resolvers = {
  Query: {
    ...adminUserResolvers.Query
  },
  Mutation: {
    ...adminUserResolvers.Mutation
  }
};