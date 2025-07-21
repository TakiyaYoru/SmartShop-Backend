// scan-resolvers.js - Scan tất cả resolvers để tạo schema đúng

import _ from "lodash";

console.log('🔍 Scanning all resolvers...');

// Import all resolvers
const helloModule = await import('./graphql/hello.js');
const categoriesModule = await import('./graphql/categories.js');
const productsModule = await import('./graphql/products.js');
const brandsModule = await import('./graphql/brands.js');
const authModule = await import('./graphql/authentication.js');
const uploadModule = await import('./graphql/upload.js');
const cartsModule = await import('./graphql/carts.js');
const ordersModule = await import('./graphql/orders.js');
const reviewsModule = await import('./graphql/reviews.js');
const reviewUploadModule = await import('./graphql/reviewUpload.js');
const chatModule = await import('./graphql/chat.js');
const googleAuthModule = await import('./graphql/googleAuth.js');

// Merge all resolvers
const allResolvers = _.merge(
  {},
  helloModule.resolvers,
  categoriesModule.resolvers,
  productsModule.resolvers,
  brandsModule.resolvers,
  authModule.resolvers,
  uploadModule.resolvers,
  cartsModule.resolvers,
  ordersModule.resolvers,
  reviewsModule.resolvers,
  reviewUploadModule.resolvers,
  chatModule.resolvers,
  googleAuthModule.resolvers
);

console.log('📊 All resolvers merged!');
console.log('\n🔍 QUERY RESOLVERS:');
if (allResolvers.Query) {
  Object.keys(allResolvers.Query).forEach(key => {
    console.log(`   ${key}`);
  });
} else {
  console.log('   No Query resolvers found');
}

console.log('\n🔍 MUTATION RESOLVERS:');
if (allResolvers.Mutation) {
  Object.keys(allResolvers.Mutation).forEach(key => {
    console.log(`   ${key}`);
  });
} else {
  console.log('   No Mutation resolvers found');
}

console.log('\n🔍 OTHER RESOLVERS:');
Object.keys(allResolvers).forEach(key => {
  if (key !== 'Query' && key !== 'Mutation') {
    console.log(`   ${key}: [${Object.keys(allResolvers[key]).join(', ')}]`);
  }
});

console.log('\n✅ Scan complete! Use this info to create complete schema.');