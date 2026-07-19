import React, { useEffect, useState } from "react";
import "./Categories.css";
import axios from "axios";

const Categories = ({ url, token }) => {
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });
  
  // Form states
  const [name, setName] = useState("");
  const [image, setImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${url}/api/category/list`);
      if (response.data.success) {
        setCategoriesList(response.data.data || []);
      } else {
        setStatusMessage({ type: "error", text: response.data.message || "Failed to load categories." });
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      setStatusMessage({ type: "error", text: "Offline or unable to connect to category services." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [url]);

  // Auto-hide status banner after 2.5 seconds
  useEffect(() => {
    if (statusMessage.text) {
      const timer = setTimeout(() => {
        setStatusMessage({ type: "", text: "" });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [statusMessage.text]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (web-standard images only)
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setStatusMessage({
          type: "error",
          text: "Unsupported format. Please select a JPG, PNG, or WEBP image."
        });
        setImage(false);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl("");
        e.target.value = "";
        return;
      }

      setImage(file);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatusMessage({ type: "error", text: "Please enter a category name." });
      return;
    }

    setStatusMessage({ type: "", text: "" });
    setSubmitting(true);

    const formData = new FormData();
    formData.append("name", name.trim());
    if (image) {
      formData.append("image", image);
    }

    try {
      const response = await axios.post(`${url}/api/category/add`, formData, {
        headers: { token }
      });

      if (response.data.success) {
        setName("");
        setImage(false);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl("");
        }
        setStatusMessage({ type: "success", text: response.data.message });
        await fetchCategories();
      } else {
        setStatusMessage({ type: "error", text: response.data.message });
      }
    } catch (error) {
      console.error("Error adding category:", error);
      setStatusMessage({ type: "error", text: error.response?.data?.message || "Failed to create category." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category? Any products in this category will remain, but the category listing will be removed.")) {
      return;
    }

    setStatusMessage({ type: "", text: "" });
    try {
      const response = await axios.post(`${url}/api/category/remove`, { id }, {
        headers: { token }
      });
      if (response.data.success) {
        setStatusMessage({ type: "success", text: response.data.message });
        await fetchCategories();
      } else {
        setStatusMessage({ type: "error", text: response.data.message });
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      setStatusMessage({ type: "error", text: "Failed to delete category. Please try again." });
    }
  };

  return (
    <div className="categories-page dashboard-page-container">
      <div className="categories-page-header">
        <h2 className="page-title">Manage Categories</h2>
        <button className="m3-btn m3-btn-tonal refresh-btn" onClick={fetchCategories} disabled={loading}>
          <span className="material-symbols-outlined">sync</span>
          Refresh
        </button>
      </div>

      {statusMessage.text && (
        <div className={`status-banner m3-card-elevated ${statusMessage.type} fade-1s`} style={{ marginBottom: "20px" }}>
          {statusMessage.text}
        </div>
      )}

      <div className="categories-layout-grid">
        {/* Add Category Form Card */}
        <div className="categories-form-card m3-card m3-card-outlined">
          <h3 className="section-title">Create New Category</h3>
          <p className="section-description">Add a custom category to group your menu offerings.</p>
          
          <form className="add-category-form" onSubmit={handleAddCategory}>
            <div className="m3-text-field">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder=" "
                required
              />
              <label>Category Name</label>
            </div>

            <div className="form-group upload-section">
              <p className="label-heading">Category Icon/Image</p>
              <p className="input-helper-text">Supported: JPG, PNG, WEBP. Max size: 5MB.</p>
              
              <label htmlFor="cat-image-input" className="category-upload-card m3-card m3-card-outlined">
                {image && previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="image-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <span className="material-symbols-outlined upload-icon">image</span>
                    <span>Select Icon</span>
                  </div>
                )}
              </label>
              <input
                type="file"
                id="cat-image-input"
                onChange={handleImageChange}
                hidden
                accept="image/*"
              />
            </div>

            <button type="submit" className="m3-btn m3-btn-filled submit-btn" disabled={submitting}>
              <span className="material-symbols-outlined">add</span>
              {submitting ? "Creating..." : "Create Category"}
            </button>
          </form>
        </div>

        {/* Categories List View */}
        <div className="categories-list-card m3-card m3-card-outlined">
          <h3 className="section-title">Active Menu Categories</h3>
          <p className="section-description">Total categories: {categoriesList.length}</p>

          {loading ? (
            <div className="categories-loading">
              <div className="m3-spinner"></div>
              <p>Loading categories...</p>
            </div>
          ) : categoriesList.length === 0 ? (
            <div className="categories-empty">
              <span className="material-symbols-outlined empty-icon">category</span>
              <h3>No categories found</h3>
              <p>Categories will appear here once seeded or added.</p>
            </div>
          ) : (
            <div className="categories-table">
              <div className="categories-table-format header-row">
                <b>Icon</b>
                <b>Name</b>
                <b>Type</b>
                <b>Action</b>
              </div>
              <hr />
              <div className="categories-table-rows">
                {categoriesList.map((cat, index) => {
                  const isSeeded = cat.image?.startsWith("http");
                  const imageUrl = isSeeded ? cat.image : `${url}/images/${cat.image}`;
                  
                  return (
                    <div key={cat._id || index}>
                      <div className="categories-table-format category-item-row">
                        {cat.image ? (
                          <img src={imageUrl} alt={cat.name} className="category-img" />
                        ) : (
                          <div className="category-img-placeholder">
                            <span className="material-symbols-outlined">restaurant</span>
                          </div>
                        )}
                        <p className="category-name">{cat.name}</p>
                        <div>
                          <span className={`status-badge ${isSeeded ? "active" : "system"}`} style={{ fontSize: "0.65rem" }}>
                            {isSeeded ? "Seeded" : "Custom"}
                          </span>
                        </div>
                        <button 
                          type="button"
                          className="delete-btn" 
                          onClick={() => handleDeleteCategory(cat._id)}
                          aria-label={`Delete category ${cat.name}`}
                          disabled={isSeeded} /* Optional: protect standard categories from deletion */
                          style={{ opacity: isSeeded ? 0.3 : 1, cursor: isSeeded ? "not-allowed" : "pointer" }}
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                      {index < categoriesList.length - 1 && <hr />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Categories;
