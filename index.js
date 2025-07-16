// File: server/index.js - ORIGINAL STRUCTURE WITH DEBUG

import { createYoga } from "graphql-yoga";
import { schema } from "./graphql/schema.js";
import { useGraphQLMiddleware } from "@envelop/graphql-middleware";
import { permissions } from "./permissions.js";
import { db } from "./config.js";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

import { initDatabase } from "./data/init.js";

// Initialize database connection
await initDatabase();

// ✅ DEBUG: Log db object structure
console.log('🔍 DEBUG: Checking db object structure...');
console.log('🔍 Available db keys:', Object.keys(db));

if (db.orders) {
  console.log('✅ db.orders exists');
  console.log('🔍 db.orders methods:', Object.keys(db.orders));
} else {
  console.error('❌ db.orders is missing!');
}

if (db.orderItems) {
  console.log('✅ db.orderItems exists');
  console.log('🔍 db.orderItems methods:', Object.keys(db.orderItems));
} else {
  console.error('❌ db.orderItems is missing!');
}

const signingKey = process.env.JWT_SECRET;

const yoga = createYoga({ 
  schema,
  graphqlEndpoint: "/",
  plugins: [useGraphQLMiddleware([permissions])],
  context: async ({ request }) => {
    const authorization = request.headers.get("authorization") || "";
    let user = null;

    if (authorization.startsWith("Bearer ")) {
      const token = authorization.substring(7, authorization.length);
      
      try {
        const decoded = jwt.verify(token, signingKey);
        user = decoded;
      } catch (error) {
        console.log("JWT verification failed:", error.message);
      }
    }

    // ✅ DEBUG: Log context creation for order queries
    const body = await request.text();
    if (body && body.includes('getMyOrder')) {
      console.log('🔍 Creating context for getMyOrder query');
      console.log('🔍 User:', user ? `${user.username} (${user.id})` : 'Not authenticated');
      console.log('🔍 DB object keys:', Object.keys(db));
      console.log('🔍 db.orders available:', !!db.orders);
      console.log('🔍 db.orderItems available:', !!db.orderItems);
      console.log('🔍 db.orderItems.getByOrderId available:', !!db.orderItems?.getByOrderId);
    }

    return {
      db: db,
      user: user,
      secret: request.headers.get("secret"),
    };
  },
  formatError: (error) => {
    console.error('❌ GraphQL Error Details:');
    console.error('Message:', error.message);
    console.error('Path:', error.path);
    console.error('Locations:', error.locations);
    console.error('Extensions:', error.extensions);
    console.error('Original Error:', error.originalError);
    console.error('Stack:', error.stack);
    
    // ✅ DEBUG: Return more detailed error info in development
    if (process.env.NODE_ENV !== 'production') {
      return {
        message: error.message,
        locations: error.locations,
        path: error.path,
        extensions: {
          code: error.extensions?.code,
          exception: {
            stacktrace: error.stack?.split('\n') || []
          }
        }
      };
    }
    
    return {
      message: error.message,
      locations: error.locations,
      path: error.path
    };
  }
});

// Tạo Express app
const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Serving static images - theo document
app.get("/img/:filename", (req, res) => {
  const filename = req.params.filename;
  const pathDir = path.join(__dirname, "/img/" + filename);
  
  // Kiểm tra file có tồn tại không
  if (!fs.existsSync(pathDir)) {
    return res.status(404).send("File not found");
  }
  
  res.sendFile(pathDir);
});

// GraphQL endpoint
app.use(yoga.graphqlEndpoint, yoga);

const PORT = process.env.PORT || 4000;

// Tạo thư mục img nếu chưa có
const imgDir = path.join(__dirname, "img");
if (!fs.existsSync(imgDir)) {
  console.log('Creating img directory...');
  fs.mkdirSync(imgDir, { recursive: true });
}

app.listen(PORT, () => {
  console.info(`🚀 SmartShop GraphQL Server ready at http://localhost:${PORT}/`);
  console.info(`📊 Health check available at http://localhost:${PORT}/health`);
  console.info(`🖼️  Static images served at http://localhost:${PORT}/img`);
  
  // ✅ DEBUG: Final check
  console.log('🔍 Final db object check:');
  console.log('  - db.orders:', !!db.orders);
  console.log('  - db.orderItems:', !!db.orderItems);
  console.log('  - db.orderItems.getByOrderId:', !!db.orderItems?.getByOrderId);
});

app.get('/health', (req, res) => {
  res.send('✅ MongoDB is connected & SmartShop is healthy');
});