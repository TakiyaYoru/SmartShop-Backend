export const up = async (db, client) => {
  // Tạo brands trước
  const brandsResult = await db.collection("brands").insertMany([
    {
      name: "Apple",
      description: "Apple Inc. - American multinational technology company",
      logo: "/images/brands/apple-logo.png",
      banner: "/images/brands/apple-banner.jpg",
      website: "https://www.apple.com",
      country: "United States",
      foundedYear: 1976,
      isActive: true,
      isFeatured: true,
    },
    {
      name: "Samsung",
      description: "Samsung Electronics - South Korean multinational electronics company",
      logo: "/images/brands/samsung-logo.png",
      banner: "/images/brands/samsung-banner.jpg",
      website: "https://www.samsung.com",
      country: "South Korea",
      foundedYear: 1969,
      isActive: true,
      isFeatured: true,
    },
    {
      name: "Dell",
      description: "Dell Technologies - American multinational technology company",
      logo: "/images/brands/dell-logo.png",
      banner: "/images/brands/dell-banner.jpg",
      website: "https://www.dell.com",
      country: "United States",
      foundedYear: 1984,
      isActive: true,
      isFeatured: false,
    },
    {
      name: "Amazon",
      description: "Amazon.com - American multinational technology company",
      logo: "/images/brands/amazon-logo.png",
      banner: "/images/brands/amazon-banner.jpg",
      website: "https://www.amazon.com",
      country: "United States",
      foundedYear: 1994,
      isActive: true,
      isFeatured: false,
    },
    {
      name: "Sony",
      description: "Sony Group Corporation - Japanese multinational conglomerate",
      logo: "/images/brands/sony-logo.png",
      banner: "/images/brands/sony-banner.jpg",
      website: "https://www.sony.com",
      country: "Japan",
      foundedYear: 1946,
      isActive: true,
      isFeatured: true,
    },
  ]);

  // Lấy brand IDs
  const brands = await db.collection("brands").find({}).toArray();
  const appleBrandId = brands.find(b => b.name === "Apple")._id;
  const samsungBrandId = brands.find(b => b.name === "Samsung")._id;
  const dellBrandId = brands.find(b => b.name === "Dell")._id;
  const amazonBrandId = brands.find(b => b.name === "Amazon")._id;
  const sonyBrandId = brands.find(b => b.name === "Sony")._id;

  // Cập nhật products để sử dụng brand ObjectId
  await db.collection("products").updateMany(
    { brand: "Apple" },
    { $set: { brand: appleBrandId } }
  );
  
  await db.collection("products").updateMany(
    { brand: "Samsung" },
    { $set: { brand: samsungBrandId } }
  );
  
  await db.collection("products").updateMany(
    { brand: "Dell" },
    { $set: { brand: dellBrandId } }
  );
  
  await db.collection("products").updateMany(
    { brand: "Amazon" },
    { $set: { brand: amazonBrandId } }
  );
  
  await db.collection("products").updateMany(
    { brand: "Sony" },
    { $set: { brand: sonyBrandId } }
  );

  // Thêm sample images cho products
  await db.collection("products").updateMany(
    { name: "iPhone 15 Pro" },
    { 
      $set: { 
        images: [
          "product_6842d5705254a983d044306e_1749210480495_0_3eb10645-c756-4f85-814f-363f1d8f6593.webp",
          "product_6842d5705254a983d044306e_1749210480496_1_3752672e-fa72-429a-a39a-590861ce76b6.webp",
          "product_6842d5705254a983d044306e_1749210480497_2_ec2b7e49-349f-4272-aec3-6601976cd8a3.webp",
          "product_6842d5705254a983d044306e_1749210480502_3_21e53907-7666-4112-81ca-b1c0ae85f926.webp"
        ]
      }
    }
  );

  await db.collection("products").updateMany(
    { name: "Samsung Galaxy S24 Ultra" },
    { 
      $set: { 
        images: [
          "product_6842d6825254a983d0443089_1749210754833_0_8f90df09-33cb-412a-a1d7-b1658178b767.webp",
          "product_6842d6825254a983d0443089_1749210754836_1_94c70ed2-347d-4090-bd8c-94bf9b55a4c2.webp",
          "product_6842d6825254a983d0443089_1749210754837_2_5e8b2a1b-a8c3-4184-940d-9be733f4d14c.webp",
          "product_6842d6825254a983d0443089_1749210754838_3_4a6ed98a-5acd-4f0f-9735-a5db8e1f4c4d.webp"
        ]
      }
    }
  );

  await db.collection("products").updateMany(
    { name: "MacBook Pro M3" },
    { 
      $set: { 
        images: [
          "product_6842d6d85254a983d04430a4_1749210840354_0_781f462b-d658-4729-8ce3-eaa87e3deb49.webp",
          "product_6842d6d85254a983d04430a4_1749210840355_1_43823f71-afb5-4597-9af2-93c17bc1c6a9.webp",
          "product_6842d6d85254a983d04430a4_1749210840355_2_a2bba48f-ba56-48b4-bb42-a1fcc48c088d.webp",
          "product_6842d6d85254a983d04430a4_1749210840356_3_aa104dee-65d1-407a-ba41-cab42a678f59.webp"
        ]
      }
    }
  );

  await db.collection("products").updateMany(
    { name: "Dell XPS 13" },
    { 
      $set: { 
        images: [
          "product_6842d7605254a983d04430bf_1749210976107_0_b98c127f-cf6b-4e65-b1da-e37988fc30b6.webp",
          "product_6842d7605254a983d04430bf_1749210976109_1_5568555e-ab2c-4c32-b8b2-9f9de37eab69.webp",
          "product_6842d7605254a983d04430bf_1749210976111_2_ed757199-216e-4e42-ac6a-48abc6f237c9.webp",
          "product_6842d7605254a983d04430bf_1749210976112_3_b20939ba-9d89-4785-b18d-ddfa0d1e1ffb.webp"
        ]
      }
    }
  );

  await db.collection("products").updateMany(
    { name: "Amazon Echo Dot 5th Gen" },
    { 
      $set: { 
        images: [
          "product_6842d7b45254a983d04430da_1749211060661_0_ae74a66c-b88f-47c6-9360-3335a19ad0ed.webp",
          "product_6842d7b45254a983d04430da_1749211060662_1_a06228dc-73d5-4cbe-b22f-c3c6e8fd3a14.webp",
          "product_6842d7b45254a983d04430da_1749211060663_2_1894d787-2b2f-41d9-b5d1-d8e9e75e38b2.webp",
          "product_6842d7b45254a983d04430da_1749211060663_3_6d1a2e24-b7be-4fe3-ad13-0fcc531daca4.webp"
        ]
      }
    }
  );

  await db.collection("products").updateMany(
    { name: "Apple Watch Series 9" },
    { 
      $set: { 
        images: [
          "product_6842d8195254a983d04430f5_1749211161716_0_2ca9ac2f-7364-48ea-ac2d-25e74d898f54.webp",
          "product_6842d8195254a983d04430f5_1749211161717_1_10d236d9-d201-4037-bf5b-a913fda128d7.webp",
          "product_6842d8195254a983d04430f5_1749211161717_2_dca90f51-30a6-404e-b471-90ec69fd89f1.webp",
          "product_6842d8195254a983d04430f5_1749211161718_3_3b3fe38a-6913-4b66-86bb-d841754c3a6f.webp"
        ]
      }
    }
  );

  await db.collection("products").updateMany(
    { name: "Sony WH-1000XM5" },
    {
      $set: {
        images: [
          "product_6842d89e5254a983d0443110_1749211294064_0_5c2671ea-1f0f-45d3-8390-7134ed77940f.webp",
          "product_6842d89e5254a983d0443110_1749211294065_1_ddff20d8-3bbf-499f-a1ba-9211f0ee2f3f.webp",
          "product_6842d89e5254a983d0443110_1749211294066_2_680a4e63-934f-4c82-a1a4-4f8e7448ab2d.webp",
          "product_6842d89e5254a983d0443110_1749211294067_3_40577f68-1adc-4960-a65a-4c4e86bfa0ff.webp"
        ]
      }
    }
  );
};

export const down = async (db, client) => {
  // Xóa brands
  await db.collection("brands").deleteMany({});
  
  // Reset products brand về string
  await db.collection("products").updateMany(
    { brand: { $type: "objectId" } },
    { $set: { brand: "Unknown" } }
  );
  
  // Xóa images
  await db.collection("products").updateMany(
    {},
    { $set: { images: [] } }
  );
};