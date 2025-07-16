import bcrypt from "bcrypt";

export const up = async (db, client) => {
  // Tạo users
  await db.collection("users").insertMany([
    {
      username: "admin",
      email: "admin@smartshop.com",
      password: bcrypt.hashSync("admin123", 10),
      firstName: "Admin",
      lastName: "SmartShop",
      role: "admin",
      isActive: true,
    },
    {
      username: "manager1",
      email: "manager@smartshop.com", 
      password: bcrypt.hashSync("manager123", 10),
      firstName: "John",
      lastName: "Manager",
      role: "manager",
      isActive: true,
    },
    {
      username: "customer1",
      email: "customer1@gmail.com",
      password: bcrypt.hashSync("customer123", 10),
      firstName: "Alice",
      lastName: "Johnson",
      role: "customer",
      phone: "+1234567890",
      isActive: true,
    },
    {
      username: "customer2",
      email: "customer2@gmail.com",
      password: bcrypt.hashSync("customer123", 10),
      firstName: "Bob",
      lastName: "Smith",
      role: "customer",
      phone: "+0987654321",
      isActive: true,
    },
  ]);

  // Tạo categories
  const categoriesResult = await db.collection("categories").insertMany([
    {
      name: "Smart Phones",
      description: "Latest smartphones and mobile devices",
      isActive: true,
    },
    {
      name: "Laptops",
      description: "High-performance laptops and notebooks",
      isActive: true,
    },
    {
      name: "Smart Home",
      description: "IoT devices and smart home automation",
      isActive: true,
    },
    {
      name: "Wearables",
      description: "Smartwatches and fitness trackers",
      isActive: true,
    },
    {
      name: "Audio",
      description: "Headphones, speakers, and audio devices",
      isActive: true,
    },
  ]);

  // Lấy category IDs
  const categories = await db.collection("categories").find({}).toArray();
  const smartPhonesId = categories.find(c => c.name === "Smart Phones")._id;
  const laptopsId = categories.find(c => c.name === "Laptops")._id;
  const smartHomeId = categories.find(c => c.name === "Smart Home")._id;
  const wearablesId = categories.find(c => c.name === "Wearables")._id;
  const audioId = categories.find(c => c.name === "Audio")._id;

  // Tạo products
  await db.collection("products").insertMany([
    {
      name: "iPhone 15 Pro",
      description: "Latest iPhone with Pro camera system and A17 Pro chip",
      price: 999.99,
      originalPrice: 1099.99,
      sku: "IPH15PRO001",
      category: smartPhonesId,
      brand: "Apple",
      images: ["/images/iphone15pro.jpg"],
      stock: 50,
      isActive: true,
      isFeatured: true,
    },
    {
      name: "Samsung Galaxy S24 Ultra",
      description: "Samsung's flagship with S Pen and advanced AI features",
      price: 1199.99,
      sku: "SAM24ULTRA001",
      category: smartPhonesId,
      brand: "Samsung",
      images: ["/images/galaxys24.jpg"],
      stock: 30,
      isActive: true,
      isFeatured: true,
    },
    {
      name: "MacBook Pro M3",
      description: "Apple MacBook Pro with M3 chip for professional work",
      price: 1999.99,
      sku: "MBP14M3001",
      category: laptopsId,
      brand: "Apple",
      images: ["/images/macbookpro.jpg"],
      stock: 25,
      isActive: true,
      isFeatured: true,
    },
    {
      name: "Dell XPS 13",
      description: "Ultra-portable laptop with InfinityEdge display",
      price: 1299.99,
      sku: "DELLXPS13001",
      category: laptopsId,
      brand: "Dell",
      images: ["/images/dellxps13.jpg"],
      stock: 40,
      isActive: true,
      isFeatured: false,
    },
    {
      name: "Amazon Echo Dot 5th Gen",
      description: "Smart speaker with Alexa voice control",
      price: 49.99,
      sku: "ECHO5GEN001",
      category: smartHomeId,
      brand: "Amazon",
      images: ["/images/echodot.jpg"],
      stock: 100,
      isActive: true,
      isFeatured: false,
    },
    {
      name: "Apple Watch Series 9",
      description: "Advanced health monitoring and fitness tracking",
      price: 399.99,
      sku: "AW9GPS001",
      category: wearablesId,
      brand: "Apple",
      images: ["/images/applewatch9.jpg"],
      stock: 35,
      isActive: true,
      isFeatured: true,
    },
    {
      name: "Sony WH-1000XM5",
      description: "Industry-leading noise canceling headphones",
      price: 399.99,
      sku: "SONYWH1000XM5",
      category: audioId,
      brand: "Sony",
      images: ["/images/sonywh1000.jpg"],
      stock: 60,
      isActive: true,
      isFeatured: false,
    },
  ]);
};

export const down = async (db, client) => {
  await db.collection("users").deleteMany({});
  await db.collection("categories").deleteMany({});
  await db.collection("products").deleteMany({});
};