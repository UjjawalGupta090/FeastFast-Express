import React, { useState } from "react";
import "./Add.css";
import axios from "axios";

const Add = ({ url, token }) => {
  const [image, setImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [categoriesList, setCategoriesList] = useState([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [data, setData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Salad",
    dietType: "Veg"
  });
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateCategoryInline = async () => {
    if (!newCategoryName.trim()) {
      setStatusMessage({ type: "error", text: "Please enter a category name." });
      return;
    }

    try {
      const response = await axios.post(`${url}/api/category/add`, {
        name: newCategoryName.trim()
      }, {
        headers: { token }
      });

      if (response.data.success) {
        setNewCategoryName("");
        setIsCreatingCategory(false);
        setStatusMessage({ type: "success", text: response.data.message });
        await fetchCategories();
        setData((prev) => ({ ...prev, category: response.data.data.name }));
      } else {
        setStatusMessage({ type: "error", text: response.data.message });
      }
    } catch (error) {
      console.error("Error creating category inline:", error);
      setStatusMessage({ type: "error", text: "Error creating category. Please try again." });
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${url}/api/category/list`);
      if (response.data.success) {
        setCategoriesList(response.data.data || []);
        if (response.data.data.length > 0) {
          setData((prev) => ({ ...prev, category: response.data.data[0].name }));
        }
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  React.useEffect(() => {
    fetchCategories();
  }, [url]);

  React.useEffect(() => {
    if (statusMessage.text) {
      const timer = setTimeout(() => {
        setStatusMessage({ type: "", text: "" });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (web-standard images only, block HEIC/other formats)
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setStatusMessage({
          type: "error",
          text: "Unsupported format. Please select a JPG, PNG, or WEBP image. HEIC/other raw formats are not supported natively by web browsers."
        });
        setImage(false);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl("");
        e.target.value = ""; // clear input selection
        return;
      }

      setImage(file);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setStatusMessage({ type: "", text: "" });
    setSubmitting(true);

    if (!image) {
      setStatusMessage({ type: "error", text: "Please upload an image" });
      setSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("price", Number(data.price));
    formData.append("category", data.category);
    formData.append("dietType", data.dietType);
    formData.append("image", image);

    try {
      const response = await axios.post(`${url}/api/food/add`, formData, {
        headers: { token }
      });
      if (response.data.success) {
        setData({
          name: "",
          description: "",
          price: "",
          category: "Salad",
          dietType: "Veg"
        });
        setImage(false);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl("");
        }
        setStatusMessage({ type: "success", text: response.data.message });
      } else {
        setStatusMessage({ type: "error", text: response.data.message });
      }
    } catch (error) {
      console.error("Error adding food:", error);
      setStatusMessage({ type: "error", text: error.response?.data?.message || "Server Error. Failed to add food." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-page dashboard-page-container">
      <h2 className="page-title">Add Food Item</h2>

      <form className="add-form" onSubmit={onSubmitHandler}>
        {statusMessage.text && (
          <div className={`status-banner m3-card-elevated ${statusMessage.type}`}>
            {statusMessage.text}
          </div>
        )}

        <div className="form-group upload-section">
          <p className="label-heading">Upload Image</p>
          <p className="input-helper-text">Supported formats: JPG, PNG, WEBP. Recommended: 500x500px square ratio.</p>
          <label htmlFor="image-input" className="image-upload-card m3-card m3-card-outlined">
            {image && previewUrl ? (
              <img src={previewUrl} alt="Preview" className="image-preview" />
            ) : (
              <div className="upload-placeholder">
                <span className="material-symbols-outlined upload-icon">upload</span>
                <span>Select Food Image</span>
              </div>
            )}
          </label>
          <input
            type="file"
            id="image-input"
            onChange={handleImageChange}
            hidden
            accept="image/*"
          />
        </div>

        <div className="m3-text-field">
          <input
            type="text"
            name="name"
            onChange={onChangeHandler}
            value={data.name}
            placeholder=" "
            required
          />
          <label>Product Name</label>
        </div>

        <div className="m3-text-field">
          <textarea
            name="description"
            onChange={onChangeHandler}
            value={data.description}
            placeholder=" "
            required
          />
          <label>Product Description</label>
        </div>

        <div className="form-row-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <div className="m3-select-wrapper category-select">
            <select 
              name="category" 
              onChange={(e) => {
                if (e.target.value === "__add_new__") {
                  setIsCreatingCategory(true);
                } else {
                  onChangeHandler(e);
                }
              }} 
              value={isCreatingCategory ? "__add_new__" : data.category}
            >
              {categoriesList.map((cat) => (
                <option key={cat._id} value={cat.name}>{cat.name}</option>
              ))}
              <option value="__add_new__" style={{ fontWeight: "bold", color: "var(--md-sys-color-primary)" }}>+ Add New Category</option>
            </select>
            <label>Category</label>
            <span className="material-symbols-outlined m3-select-arrow">arrow_drop_down</span>
          </div>

          {/* Diet Type Selector */}
          <div className="m3-select-wrapper category-select">
            <select name="dietType" onChange={onChangeHandler} value={data.dietType}>
              <option value="Veg">Veg</option>
              <option value="Non-Veg">Non-Veg</option>
            </select>
            <label>Diet Type</label>
            <span className="material-symbols-outlined m3-select-arrow">arrow_drop_down</span>
          </div>

          <div className="m3-text-field price-input">
            <input
              type="number"
              name="price"
              onChange={onChangeHandler}
              value={data.price}
              placeholder=" "
              step="0.01"
              required
            />
            <label>Price (₹)</label>
          </div>
        </div>

        {isCreatingCategory && (
          <div className="inline-add-category-wrapper" style={{ 
            display: "flex", 
            gap: "12px", 
            alignItems: "center", 
            backgroundColor: "var(--md-sys-color-surface-container)", 
            padding: "16px", 
            borderRadius: "var(--md-shape-corner-medium)",
            marginBottom: "16px",
            border: "1px solid var(--md-sys-color-outline-variant)",
            animation: "slide-down 0.2s ease"
          }}>
            <div className="m3-text-field" style={{ flex: 1, marginBottom: 0 }}>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder=" "
                required
              />
              <label>New Category Name</label>
            </div>
            <button
              type="button"
              className="m3-btn m3-btn-filled"
              onClick={handleCreateCategoryInline}
              style={{ height: "48px", minWidth: "90px" }}
            >
              Add
            </button>
            <button
              type="button"
              className="m3-btn m3-btn-text"
              onClick={() => {
                setIsCreatingCategory(false);
                setNewCategoryName("");
                if (categoriesList.length > 0) {
                  setData(prev => ({ ...prev, category: categoriesList[0].name }));
                }
              }}
              style={{ height: "48px" }}
            >
              Cancel
            </button>
          </div>
        )}

        <button type="submit" className="m3-btn m3-btn-filled submit-btn" disabled={submitting}>
          <span className="material-symbols-outlined">add</span>
          {submitting ? "Adding..." : "Add Food Item"}
        </button>
      </form>
    </div>
  );
};

export default Add;
