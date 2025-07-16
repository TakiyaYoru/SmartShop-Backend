import mongoose from "mongoose";
import { CategorySchema } from "./category.js";
import { ProductSchema } from "./product.js";
import { UserSchema } from "./user.js";
import { BrandSchema } from "./brand.js";
import { CartSchema } from "./cart.js"; 
import { OrderSchema } from "./order.js";
import { OrderItemSchema } from "./orderItem.js"; 
import { Review } from "./review.js";

export const Category = mongoose.model("Category", CategorySchema);
export const Product = mongoose.model("Product", ProductSchema);
export const User = mongoose.model("User", UserSchema);
export const Brand = mongoose.model("Brand", BrandSchema);
export const Cart = mongoose.model("Cart", CartSchema); 
export const Order = mongoose.model("Order", OrderSchema);
export const OrderItem = mongoose.model("OrderItem", OrderItemSchema);
export { Review };