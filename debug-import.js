// debug-import.js - Test Google Auth import

console.log('🔍 Testing Google Auth import...');

try {
  console.log('1. Testing googleAuth.js import...');
  const googleAuthModule = await import('./graphql/googleAuth.js');
  console.log('✅ googleAuth.js imported successfully');
  console.log('📝 Exported keys:', Object.keys(googleAuthModule));
  
  if (googleAuthModule.typeDef) {
    console.log('✅ typeDef exported');
    console.log('📄 typeDef preview:', googleAuthModule.typeDef.substring(0, 200) + '...');
  } else {
    console.log('❌ typeDef missing');
  }
  
  if (googleAuthModule.resolvers) {
    console.log('✅ resolvers exported');
    console.log('🔧 Resolver keys:', Object.keys(googleAuthModule.resolvers));
  } else {
    console.log('❌ resolvers missing');
  }

  console.log('\n2. Testing schema.js import...');
  const schemaModule = await import('./graphql/schema.js');
  console.log('✅ schema.js imported successfully');
  
  console.log('\n3. Testing schema string for Google Auth...');
  const schema = schemaModule.schema;
  const schemaString = schema.toString();
  
  if (schemaString.includes('GoogleAuthInput')) {
    console.log('✅ GoogleAuthInput found in schema');
  } else {
    console.log('❌ GoogleAuthInput NOT found in schema');
  }
  
  if (schemaString.includes('googleAuth')) {
    console.log('✅ googleAuth mutation found in schema');
  } else {
    console.log('❌ googleAuth mutation NOT found in schema');
  }
  
  if (schemaString.includes('completeProfile')) {
    console.log('✅ completeProfile mutation found in schema');
  } else {
    console.log('❌ completeProfile mutation NOT found in schema');
  }

} catch (error) {
  console.error('❌ Import failed:', error.message);
  console.error('Stack:', error.stack);
}