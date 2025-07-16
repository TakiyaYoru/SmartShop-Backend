import { GraphQLError } from "graphql";
import _ from "lodash";

export const typeDef = `
  extend type Query {
    hello: String
  }
`;

export const resolvers = {
  Query: {
    hello: (parent, args, context, info) => {
      if (!_.has(context, "secret")) {
        throw new GraphQLError("A secret is required to access SmartShop.");
      }
      return `Hello SmartShop! Your secret: ${context.secret}`;
    },
  },
};