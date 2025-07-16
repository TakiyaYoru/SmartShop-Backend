import { createSchema } from "graphql-yoga";
import _ from "lodash";
import { typeDef as hello, resolvers as helloResolvers } from "./hello.js";
import { typeDef as categories, resolvers as categoriesResolvers } from "./categories.js";
import { typeDef as products, resolvers as productsResolvers } from "./products.js";
import { typeDef as brands, resolvers as brandsResolvers } from "./brands.js";
import { typeDef as authentication, resolvers as authenticationResolvers } from "./authentication.js";
import { typeDef as upload, resolvers as uploadResolvers } from "./upload.js";
import { typeDef as carts, resolvers as cartsResolvers } from "./carts.js";
import { typeDef as orders, resolvers as ordersResolvers } from "./orders.js";
import { typeDef as reviews, resolvers as reviewsResolvers } from "./reviews.js";
import { typeDef as reviewUpload, resolvers as reviewUploadResolvers } from "./reviewUpload.js";
import { typeDef as chat, resolvers as chatResolvers } from "./chat.js";

// Base schema với Query và Mutation rỗng
const baseSchema = `
  type Query {
    _empty: String
  }
  
  type Mutation {
    _empty: String
  }
`;

// Tập hợp tất cả typeDefs
const typeDefs = [
  baseSchema,
  hello,
  categories,
  products,
  brands,
  authentication,
  upload,
  carts,
  orders,
  reviews,
  reviewUpload,
  chat
];

// Merge tất cả resolvers bằng lodash
const resolvers = _.merge(
  {},
  helloResolvers,
  categoriesResolvers,
  productsResolvers,
  brandsResolvers,
  authenticationResolvers,
  uploadResolvers,
  cartsResolvers,
  ordersResolvers,
  reviewsResolvers,
  reviewUploadResolvers,
  chatResolvers
);

// Export schema
export const schema = createSchema({
  typeDefs,
  resolvers,
});

// Alternative: Nếu bạn muốn validate schema
export const createGraphQLSchema = () => {
  try {
    const schema = createSchema({
      typeDefs,
      resolvers,
    });
    console.log('GraphQL schema created successfully');
    return schema;
  } catch (error) {
    console.error('Error creating GraphQL schema:', error);
    throw error;
  }
};