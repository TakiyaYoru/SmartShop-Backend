import mongoose from "mongoose";
import { describe, expect, test, beforeEach } from "@jest/globals";
import { db } from "../mongoRepo.js";
import { Category, Product } from "../models/index.js";

let testCategory;

beforeEach(async () => {
  await Category.deleteMany({});
  await Product.deleteMany({});
  
  // Tạo category để test
  testCategory = await Category.create({
    name: "Test Category",
    description: "Category for testing products",
  });
});

describe("SmartShop Products", () => {
  describe("creating product", () => {
    test("with all required parameters should succeed", async () => {
      const newProduct = {
        name: "Test Phone",
        description: "A test smartphone",
        price: 599.99,
        sku: "TESTPHONE001",
        category: testCategory._id,
        brand: "TestBrand",
        stock: 10,
      };
      
      const createdProduct = await db.products.create(newProduct);
      
      expect(createdProduct._id).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(createdProduct.name).toBe(newProduct.name);
      expect(createdProduct.price).toBe(newProduct.price);
      expect(createdProduct.category.name).toBe(testCategory.name);
    });
  });

  describe("listing products", () => {
    test("should return all active products", async () => {
      // Tạo vài products để test
      await db.products.create({
        name: "Product 1",
        price: 100,
        sku: "PROD001",
        category: testCategory._id,
        stock: 5,
      });
      
      await db.products.create({
        name: "Product 2", 
        price: 200,
        sku: "PROD002",
        category: testCategory._id,
        stock: 10,
      });
      
      const products = await db.products.getAll();
      expect(products.length).toBe(2);
    });
  });
});