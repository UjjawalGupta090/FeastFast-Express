import categoryModel from "../models/categoryModel.js";
import fs from "fs";

// Seed default categories helper if DB is blank
const seedDefaultCategories = async () => {
  const defaults = [
    {
      name: "Salad",
      image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=150&h=150&q=80"
    },
    {
      name: "Rolls",
      image: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?auto=format&fit=crop&w=150&h=150&q=80"
    },
    {
      name: "Desserts",
      image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=150&h=150&q=80"
    },
    {
      name: "Sandwich",
      image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=150&h=150&q=80"
    },
    {
      name: "Cake",
      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=150&h=150&q=80"
    },
    {
      name: "Pasta",
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=150&h=150&q=80"
    },
    {
      name: "Noodles",
      image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=150&h=150&q=80"
    }
  ];

  try {
    for (const item of defaults) {
      const exists = await categoryModel.findOne({ name: item.name });
      if (!exists) {
        const cat = new categoryModel(item);
        await cat.save();
      }
    }
  } catch (error) {
    console.error("Error auto-seeding categories:", error);
  }
};

// Add category (Admin only)
const addCategory = async (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.json({ success: false, message: "Category name is required" });
  }

  try {
    const exists = await categoryModel.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
    if (exists) {
      return res.json({ success: false, message: "Category already exists" });
    }

    let imageFilename = "";
    if (req.file) {
      imageFilename = req.file.filename;
    }

    const category = new categoryModel({
      name,
      image: imageFilename
    });

    await category.save();
    res.json({ success: true, message: "Category created successfully!", data: category });
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ success: false, message: "Server error creating category" });
  }
};

// List all categories (Public)
const listCategories = async (req, res) => {
  try {
    let list = await categoryModel.find({});
    if (list.length === 0) {
      await seedDefaultCategories();
      list = await categoryModel.find({});
    }
    res.json({ success: true, data: list });
  } catch (error) {
    console.error("Error fetching categories list:", error);
    res.status(500).json({ success: false, message: "Error loading categories" });
  }
};

// Remove category (Admin only)
const removeCategory = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.json({ success: false, message: "Category ID is required" });
  }

  try {
    const category = await categoryModel.findById(id);
    if (!category) {
      return res.json({ success: false, message: "Category not found" });
    }

    if (category.image && !category.image.startsWith("http")) {
      fs.unlink(`uploads/${category.image}`, (err) => {
        if (err) console.error("Error deleting category image file:", err);
      });
    }

    await categoryModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Category deleted successfully!" });
  } catch (error) {
    console.error("Error removing category:", error);
    res.status(500).json({ success: false, message: "Server error deleting category" });
  }
};

export { addCategory, listCategories, removeCategory };
