import mongoose from "mongoose";
import dotenv from "dotenv";
import foodModel from "./models/foodModel.js";
import userModel from "./models/userModel.js";
import bcrypt from "bcryptjs";

// Configure dotenv
dotenv.config();

const defaultFoods = [
  {
    name: "Greek Salad",
    price: 150.00,
    description: "Fresh vegetables mixed with crisp lettuce, feta cheese, and olives.",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80",
    category: "Salad",
    dietType: "Veg"
  },
  {
    name: "Veg Salad",
    price: 120.00,
    description: "Healthy garden salad packed with nutrients and light vinaigrette dressing.",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80",
    category: "Salad",
    dietType: "Veg"
  },
  {
    name: "Chicken Salad",
    price: 220.00,
    description: "Grilled chicken breast slides served over crisp organic greens.",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
    category: "Salad",
    dietType: "Non-Veg"
  },
  {
    name: "Spring Rolls",
    price: 90.00,
    description: "Crispy rolls filled with sautéed fresh vegetables, served with sweet chili sauce.",
    image: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?auto=format&fit=crop&w=500&q=80",
    category: "Rolls",
    dietType: "Veg"
  },
  {
    name: "Strawberry Cake",
    price: 180.00,
    description: "Light chiffon sponge cake layers decorated with fresh strawberries.",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=80",
    category: "Cake",
    dietType: "Veg"
  },
  {
    name: "Chocolate Fudge Cake",
    price: 200.00,
    description: "Rich, dense chocolate cake layered with dark chocolate ganache icing.",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=500&q=80",
    category: "Cake",
    dietType: "Veg"
  },
  {
    name: "Club Sandwich",
    price: 130.00,
    description: "Toasted bread with layers of grilled chicken, bacon, lettuce, tomato, and mayo.",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=500&q=80",
    category: "Sandwich",
    dietType: "Non-Veg"
  },
  {
    name: "Lasagna Classico",
    price: 250.00,
    description: "Layers of pasta sheets, rich bolognese sauce, creamy bechamel, and cheese.",
    image: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=500&q=80",
    category: "Pasta",
    dietType: "Non-Veg"
  },
  {
    name: "Garlic Butter Pasta",
    price: 180.00,
    description: "Tossed pasta in smooth melted butter garlic emulsion with fresh parsley.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80",
    category: "Pasta",
    dietType: "Veg"
  },
  {
    name: "Stir Fry Noodles",
    price: 140.00,
    description: "Classic wok-tossed noodles with colorful julienne vegetables and soy sauce.",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=500&q=80",
    category: "Noodles",
    dietType: "Veg"
  }
];

const seedDB = async () => {
  try {
    const connString = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/tomato";
    console.log(`Connecting to database: ${connString}`);
    await mongoose.connect(connString);
    
    // 1. Seed Foods
    console.log("Connected. Clearing food collection...");
    await foodModel.deleteMany({});
    
    console.log(`Inserting ${defaultFoods.length} default food catalog items...`);
    await foodModel.insertMany(defaultFoods);

    // 2. Seed Default Admin User
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@tomato.com";
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "AdminPass@2026!";
    console.log(`Clearing and seeding admin account (${adminEmail})...`);
    await userModel.deleteMany({ email: adminEmail });

    const salt = await bcrypt.genSalt(10);
    const adminPasswordHashed = await bcrypt.hash(adminPassword, salt);

    const defaultAdmin = new userModel({
      name: "Super Admin",
      email: adminEmail,
      password: adminPasswordHashed,
      role: "admin"
    });
    await defaultAdmin.save();
    console.log(`Default admin account created: ${adminEmail} / [HIDDEN FROM LOGS]`);

    // 3. Seed Default Customer User
    const customerEmail = "customer@tomato.com";
    console.log(`Clearing and seeding customer account (${customerEmail})...`);
    await userModel.deleteMany({ email: customerEmail });

    const customerPasswordHashed = await bcrypt.hash("1234", salt);

    const defaultCustomer = new userModel({
      name: "Test Customer",
      email: customerEmail,
      password: customerPasswordHashed,
      role: "customer"
    });
    await defaultCustomer.save();
    console.log("Default customer account created: customer@tomato.com / 1234");
    
    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error.message);
    process.exit(1);
  }
};

seedDB();
