import mongoose from "mongoose";
import { describe, expect, test, beforeEach } from "@jest/globals";
import { db } from "../mongoRepo.js";
import { Category } from "../models/index.js";

const sampleCategories = [
  { name: "Electronics", description: "Electronic devices" },
  { name: "Books", description: "Books and literature" },
  { name: "Clothing", description: "Fashion and apparel" },
];

let createdSampleCategories = [];

beforeEach(async () => {
  await Category.deleteMany({});
  createdSampleCategories = [];
  
  for (const category of sampleCategories) {
    const createdCategory = new Category(category);
    createdSampleCategories.push(await createdCategory.save());
  }
});

describe("SmartShop Categories", () => {
  describe("creating category", () => {
    test("with all parameters should succeed", async () => {
      const newItem = {
        name: "Gaming",
        description: "Gaming accessories and devices",
      };
      
      const createdItem = await db.categories.create(newItem);
      
      expect(createdItem._id).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(createdItem.name).toBe(newItem.name);
      expect(createdItem.description).toBe(newItem.description);
      
      const foundItem = await db.categories.findById(createdItem._id);
      expect(foundItem).toEqual(expect.objectContaining(newItem));
    });
  });

  describe("listing categories", () => {
    test("should return all active categories", async () => {
      const items = await db.categories.getAll();
      expect(items.length).toEqual(createdSampleCategories.length);
    });
  });

  describe("finding category by id", () => {
    test("should return correct category", async () => {
      const targetCategory = createdSampleCategories[0];
      const foundCategory = await db.categories.findById(targetCategory._id);
      
      expect(foundCategory.name).toBe(targetCategory.name);
      expect(foundCategory.description).toBe(targetCategory.description);
    });
  });

  describe("updating category", () => {
    test("should update category successfully", async () => {
      const targetCategory = createdSampleCategories[0];
      const updateData = {
        name: "Updated Electronics",
        description: "Updated description for electronics",
      };
      
      const updatedCategory = await db.categories.updateById(targetCategory._id, updateData);
      
      expect(updatedCategory.name).toBe(updateData.name);
      expect(updatedCategory.description).toBe(updateData.description);
    });
  });

  describe("deleting category", () => {
    test("should delete category successfully", async () => {
      const targetCategory = createdSampleCategories[0];
      const deletedId = await db.categories.deleteById(targetCategory._id);
      
      expect(deletedId).toBe(targetCategory._id.toString());
      
      const foundCategory = await db.categories.findById(targetCategory._id);
      expect(foundCategory).toBeNull();
    });
  });
});