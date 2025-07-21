// direct-test.js - Test schema directly without imports

import { createSchema } from "graphql-yoga";
import _ from "lodash";

console.log('🔥 Direct Schema Test - Bypassing cache...');

try {
  // Import each module individually to check
  console.log('1. Loading individual modules...');
  
  const helloModule = await import('./graphql/hello.js?' + Date.now());
  const authModule = await import('./graphql/authentication.js?' + Date.now());
  const googleAuthModule = await import('./graphql/googleAuth.js?' + Date.now());
  
  console.log('✅ All modules loaded');
  
  // Test Google Auth module content
  console.log('2. Google Auth module content:');
  console.log('   typeDef length:', googleAuthModule.typeDef?.length || 0);
  console.log('   Has GoogleAuthInput:', googleAuthModule.typeDef?.includes('GoogleAuthInput') || false);
  console.log('   Has googleAuth mutation:', googleAuthModule.typeDef?.includes('googleAuth') || false);
  
  // Create schema manually
  console.log('3. Creating schema manually...');
  
  const baseSchema = `
    type Query {
      _empty: String
    }
    
    type Mutation {
      _empty: String
    }
  `;
  
  const typeDefs = [
    baseSchema,
    helloModule.typeDef,
    authModule.typeDef,
    googleAuthModule.typeDef  // Ensure this is included
  ];
  
  const resolvers = _.merge(
    {},
    helloModule.resolvers,
    authModule.resolvers,
    googleAuthModule.resolvers
  );
  
  console.log('4. TypeDefs array length:', typeDefs.length);
  console.log('5. Resolvers keys:', Object.keys(resolvers));
  
  // Create the schema
  const schema = createSchema({
    typeDefs,
    resolvers,
  });
  
  console.log('✅ Schema created successfully');
  
  // Test schema content
  const schemaString = schema.toString();
  console.log('6. Testing schema content:');
  console.log('   GoogleAuthInput found:', schemaString.includes('GoogleAuthInput'));
  console.log('   googleAuth mutation found:', schemaString.includes('googleAuth'));
  console.log('   completeProfile found:', schemaString.includes('completeProfile'));
  
  if (schemaString.includes('GoogleAuthInput')) {
    console.log('🎉 SUCCESS: Google Auth is properly included in schema!');
  } else {
    console.log('❌ FAILED: Google Auth still missing from schema');
    
    // Debug: Print the Google Auth typeDef
    console.log('\n📄 Debug - Google Auth typeDef content:');
    console.log(googleAuthModule.typeDef);
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}