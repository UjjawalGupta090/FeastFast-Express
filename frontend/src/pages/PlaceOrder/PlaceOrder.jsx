import React, { useContext, useEffect, useState } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const PlaceOrder = () => {
  const { getCartAmount, token, food_list, cartItems, setCartItems, url, storeSettings, fulfillmentType } = useContext(StoreContext);
  const navigate = useNavigate();

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    phone: ""
  });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [saveThisAddress, setSaveThisAddress] = useState(false);
  const [isDefaultChecked, setIsDefaultChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [textareaFocused, setTextareaFocused] = useState(false);

  const [isLocationVerified, setIsLocationVerified] = useState(false);
  const [deliveryDistance, setDeliveryDistance] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Online");

  const getHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    setLocationLoading(true);
    setErrorMessage("");
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Dynamic coordinates and radius configured by admin
        const RESTAURANT_LAT = storeSettings?.restaurantLat ?? 28.071871;
        const RESTAURANT_LON = storeSettings?.restaurantLon ?? 80.096588;
        const RADIUS_LIMIT = storeSettings?.deliveryRadius ?? 5;
        
        const distance = getHaversineDistance(RESTAURANT_LAT, RESTAURANT_LON, latitude, longitude);
        setDeliveryDistance(distance);
        
        if (distance > RADIUS_LIMIT) {
          setIsLocationVerified(false);
          setErrorMessage(`Delivery Unavailable: You are ${distance.toFixed(2)}km away. Home delivery is restricted to a ${RADIUS_LIMIT}km radius.`);
          setLocationLoading(false);
          return;
        }
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          if (data && data.address) {
            const addr = data.address;
            setData((prev) => ({
              ...prev,
              street: addr.road || addr.suburb || addr.neighbourhood || "",
              city: addr.city || addr.town || addr.village || ""
            }));
            setIsLocationVerified(true);
          } else {
            setIsLocationVerified(true);
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          setIsLocationVerified(true);
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setErrorMessage("Please enable browser location services to verify delivery eligibility.");
        setLocationLoading(false);
      }
    );
  };

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  // Fetch saved addresses from user profile and autofill default address
  const fetchAddresses = async () => {
    if (token) {
      try {
        const response = await axios.get(url + "/api/user/addresses", {
          headers: { token }
        });
        if (response.data.success) {
          const list = response.data.data || [];
          setSavedAddresses(list);

          // Find and autofill with the default saved address if available
          const defaultAddress = list.find((addr) => addr.isDefault);
          if (defaultAddress) {
            setData({
              firstName: defaultAddress.firstName || "",
              lastName: defaultAddress.lastName || "",
              email: defaultAddress.email || "",
              street: defaultAddress.street || "",
              city: defaultAddress.city || "",
              phone: defaultAddress.phone || ""
            });
            setIsLocationVerified(true);
          }
        }
      } catch (error) {
        console.error("Error fetching user addresses:", error);
      }
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [token, url]);

  const handleSetDefault = async (addressId) => {
    try {
      const response = await axios.post(
        url + "/api/user/address/set-default",
        { addressId },
        { headers: { token } }
      );
      if (response.data.success) {
        // Reload addresses list to refresh default states
        const res = await axios.get(url + "/api/user/addresses", {
          headers: { token }
        });
        if (res.data.success) {
          setSavedAddresses(res.data.data || []);
        }
      }
    } catch (error) {
      console.error("Error setting default address:", error);
    }
  };

  const placeOrderHandler = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    if (storeSettings?.orderMode === "offline") {
      setErrorMessage("The restaurant is offline currently and not accepting orders.");
      setSubmitting(false);
      return;
    }

    if (fulfillmentType === "delivery" && !isLocationVerified) {
      setErrorMessage(`Please share your current location to verify delivery eligibility within our ${storeSettings?.deliveryRadius ?? 5}km radius.`);
      setSubmitting(false);
      return;
    }

    if (storeSettings?.orderMode === "online" && fulfillmentType === "dine-in") {
      setErrorMessage("The restaurant is currently only accepting home delivery orders.");
      setSubmitting(false);
      return;
    }

    if (storeSettings?.orderMode === "dine-in" && fulfillmentType === "delivery") {
      setErrorMessage("The restaurant is currently only accepting dine-in orders.");
      setSubmitting(false);
      return;
    }

    if (!token) {
      setErrorMessage("You must be signed in to place an order.");
      setSubmitting(false);
      return;
    }

    // Optionally save the address to user profile (only if Home Delivery)
    if (fulfillmentType === "delivery" && saveThisAddress) {
      try {
        await axios.post(
          url + "/api/user/address/add",
          { address: data, isDefault: isDefaultChecked },
          { headers: { token } }
        );
      } catch (error) {
        console.error("Failed to save delivery address:", error);
      }
    }

    let orderItems = [];
    food_list.forEach((item) => {
      if (cartItems[item._id] > 0) {
        let itemInfo = { ...item };
        itemInfo["quantity"] = cartItems[item._id];
        orderItems.push(itemInfo);
      }
    });

    // Construct address object dynamically based on fulfillment type
    let orderAddress = {};
    if (fulfillmentType === "dine-in") {
      orderAddress = {
        type: "dine-in",
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        street: "Dine-In / Offline Order",
        city: "Restaurant Dine-In",
        state: "N/A",
        zipcode: "N/A",
        country: "N/A"
      };
    } else {
      orderAddress = {
        ...data,
        type: "delivery"
      };
    }

    // Calculate delivery fee
    const deliveryFee = (getCartAmount() > 0 && fulfillmentType === "delivery") ? 80 : 0;

    let orderData = {
      address: orderAddress,
      items: orderItems,
      amount: getCartAmount() + deliveryFee,
      notes: notes,
      paymentMethod: fulfillmentType === "dine-in" ? "Online" : paymentMethod
    };

    try {
      const response = await axios.post(url + "/api/order/place", orderData, {
        headers: { token }
      });
      if (response.data.success) {
        setCartItems({});
        navigate("/ordersuccess", { state: { fulfillmentType } });
      } else {
        setErrorMessage(response.data.message || "Failed to process order checkout.");
      }
    } catch (error) {
      console.error("Order processing error:", error);
      setErrorMessage(error.response?.data?.message || "Something went wrong while connecting to the checkout gateway.");
    } finally {
      setSubmitting(false);
    }
  };

  // Redirect to home if cart is empty
  useEffect(() => {
    if (getCartAmount() === 0) {
      navigate("/cart");
    }
  }, [token, getCartAmount, navigate]);

  const cartTotal = getCartAmount();
  const deliveryFee = (cartTotal > 0 && fulfillmentType === "delivery") ? 80 : 0;
  const grandTotal = cartTotal + deliveryFee;

  return (
    <form onSubmit={placeOrderHandler} className="place-order-page">
      <div className="place-order-left">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 className="title" style={{ margin: 0 }}>
            {fulfillmentType === "dine-in" ? "Dine-In Contact Information" : "Delivery Address"}
          </h2>
          
          {fulfillmentType === "delivery" && savedAddresses.length > 0 && (
            <button
              type="button"
              className="m3-btn m3-btn-outlined"
              onClick={() => {
                setData({
                  firstName: "",
                  lastName: "",
                  email: "",
                  street: "",
                  city: "",
                  state: "",
                  zipcode: "",
                  country: "",
                  phone: ""
                });
                setSaveThisAddress(false);
                setIsDefaultChecked(false);
              }}
              style={{ height: "36px", padding: "0 16px", fontSize: "0.75rem" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>clear_all</span>
              Use New Address
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="error-banner m3-card-elevated" style={{ marginBottom: "20px" }}>
            {errorMessage}
          </div>
        )}



        {/* Notice banner if Dine-In is forced */}
        {storeSettings?.orderMode === "dine-in" && (
          <div className="dine-in-notice" style={{
            padding: "12px 16px",
            backgroundColor: "var(--md-sys-color-tertiary-container)",
            color: "var(--md-sys-color-on-tertiary-container)",
            borderRadius: "var(--md-shape-corner-medium)",
            fontSize: "0.85rem",
            fontWeight: "600",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "1.2rem" }}>restaurant</span>
            <span>Dine-In checkout mode active. No physical shipping address required.</span>
          </div>
        )}

        {/* Saved Addresses Quick Selector (Only for Delivery) */}
        {fulfillmentType === "delivery" && savedAddresses.length > 0 && (
          <div className="saved-addresses-section m3-card m3-card-outlined" style={{
            padding: "16px",
            marginBottom: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}>
            <p style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--md-sys-color-on-surface-variant)" }}>
              Choose a Saved Address
            </p>
            <div className="saved-addresses-list" style={{
              display: "flex",
              gap: "12px",
              overflowX: "auto",
              paddingBottom: "8px"
            }}>
              {savedAddresses.map((addr) => (
                <div key={addr.id} style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                  <button
                    type="button"
                    className={`m3-btn ${addr.isDefault ? "m3-btn-filled" : "m3-btn-tonal"}`}
                    onClick={() => {
                      setData({
                        firstName: addr.firstName || "",
                        lastName: addr.lastName || "",
                        email: addr.email || "",
                        street: addr.street || "",
                        city: addr.city || "",
                        state: addr.state || "",
                        zipcode: addr.zipcode || "",
                        country: addr.country || "",
                        phone: addr.phone || ""
                      });
                      setIsLocationVerified(true);
                      setDeliveryDistance(null);
                    }}
                    style={{
                      whiteSpace: "nowrap",
                      padding: "8px 16px",
                      height: "36px",
                      fontSize: "0.75rem"
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "0.95rem" }}>home</span>
                    {addr.firstName} ({addr.city}) {addr.isDefault && "⭐"}
                  </button>
                  
                  {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--md-sys-color-primary)",
                        fontSize: "0.65rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        textDecoration: "underline"
                      }}
                    >
                      Make Default
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact fields (Name & Email are always required) */}
        <div className="multi-fields">
          <div className="m3-text-field">
            <input
              type="text"
              name="firstName"
              onChange={onChangeHandler}
              value={data.firstName}
              placeholder=" "
              required
            />
            <label>First Name</label>
          </div>
          <div className="m3-text-field">
            <input
              type="text"
              name="lastName"
              onChange={onChangeHandler}
              value={data.lastName}
              placeholder=" "
              required
            />
            <label>Last Name</label>
          </div>
        </div>

        <div className="m3-text-field">
          <input
            type="email"
            name="email"
            onChange={onChangeHandler}
            value={data.email}
            placeholder=" "
            required
          />
          <label>Email Address</label>
        </div>

        {/* Delivery Address fields - Conditionally rendered & required based on fulfillment type */}
        {fulfillmentType === "delivery" && (
          <>
            <div className="location-verifier-section" style={{ marginBottom: "20px" }}>
              {isLocationVerified ? (
                <div style={{
                  padding: "10px 14px",
                  backgroundColor: "var(--md-sys-color-primary-container)",
                  color: "var(--md-sys-color-on-primary-container)",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "1.15rem" }}>check_circle</span>
                  <span>
                    Eligible to get delivery {deliveryDistance !== null && `(${deliveryDistance.toFixed(2)} km away)`}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  className="m3-btn m3-btn-filled"
                  onClick={handleShareLocation}
                  disabled={locationLoading}
                  style={{ width: "100%", justifyContent: "center", height: "42px" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "1.15rem" }}>
                    {locationLoading ? "hourglass_empty" : "my_location"}
                  </span>
                  {locationLoading ? "Verifying coordinates..." : "Share My Current Location"}
                </button>
              )}
            </div>

            <div className="m3-text-field">
              <input
                type="text"
                name="street"
                onChange={onChangeHandler}
                value={data.street}
                placeholder=" "
                required={fulfillmentType === "delivery"}
              />
              <label>Street Address</label>
            </div>

            <div className="m3-text-field">
              <input
                type="text"
                name="city"
                onChange={onChangeHandler}
                value={data.city}
                placeholder=" "
                required={fulfillmentType === "delivery"}
              />
              <label>City</label>
            </div>
          </>
        )}

        <div className="m3-text-field">
          <input
            type="text"
            name="phone"
            onChange={onChangeHandler}
            value={data.phone}
            placeholder=" "
            required
          />
          <label>Phone Number</label>
        </div>

        <div className="m3-text-field" style={{ position: "relative", marginTop: "16px" }}>
          <textarea
            name="notes"
            onChange={(e) => setNotes(e.target.value)}
            onFocus={() => setTextareaFocused(true)}
            onBlur={() => setTextareaFocused(false)}
            value={notes}
            placeholder=""
            rows="3"
            style={{
              width: "100%",
              minHeight: "75px",
              padding: "12px",
              border: "1px solid var(--md-sys-color-outline)",
              borderRadius: "8px",
              background: "transparent",
              color: "var(--md-sys-color-on-surface)",
              fontFamily: "inherit",
              fontSize: "0.9rem",
              resize: "vertical"
            }}
          />
          {!notes && !textareaFocused && (
            <label style={{ 
              position: "absolute",
              left: "12px",
              top: "12px",
              color: "var(--md-sys-color-on-surface-variant)",
              pointerEvents: "none",
              fontSize: "0.9rem"
            }}>
              {fulfillmentType === "dine-in" ? "Table Number / Dine-in Requests (e.g. Table 4)" : "Cooking Instructions / Custom Requests (e.g. No onion)"}
            </label>
          )}
        </div>

        {/* Save Address Options (Only for Delivery) */}
        {fulfillmentType === "delivery" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "12px 0" }}>
            <div className="save-address-checkbox" style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer"
            }}>
              <input
                type="checkbox"
                id="save-address"
                checked={saveThisAddress}
                onChange={(e) => setSaveThisAddress(e.target.checked)}
                style={{
                  width: "18px",
                  height: "18px",
                  accentColor: "var(--md-sys-color-primary)",
                  cursor: "pointer"
                }}
              />
              <label htmlFor="save-address" style={{
                fontSize: "0.85rem",
                color: "var(--md-sys-color-on-surface-variant)",
                cursor: "pointer",
                userSelect: "none"
              }}>
                Save this address to my profile for future orders
              </label>
            </div>

            {saveThisAddress && (
              <div className="default-address-checkbox" style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginLeft: "24px",
                cursor: "pointer"
              }}>
                <input
                  type="checkbox"
                  id="default-address"
                  checked={isDefaultChecked}
                  onChange={(e) => setIsDefaultChecked(e.target.checked)}
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "var(--md-sys-color-primary)",
                    cursor: "pointer"
                  }}
                />
                <label htmlFor="default-address" style={{
                  fontSize: "0.8rem",
                  color: "var(--md-sys-color-on-surface-variant)",
                  cursor: "pointer",
                  userSelect: "none"
                }}>
                  Set as my default shipping address
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="place-order-right">
        <div className="cart-total m3-card m3-card-elevated">
          <h3>Cart Totals</h3>
          <div className="total-details">
            <div className="total-row">
              <span>Subtotal</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
            <hr className="detail-divider" />
            <div className="total-row">
              <span>Delivery Fee</span>
              <span>₹{deliveryFee.toFixed(2)}</span>
            </div>
            <hr className="detail-divider" />
            <div className="total-row grand-total">
              <span>Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {fulfillmentType === "delivery" && (
            <div style={{ marginTop: "16px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--md-sys-color-on-surface-variant)" }}>
                Select Payment Method
              </span>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div 
                  onClick={() => setPaymentMethod("Online")}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: paymentMethod === "Online" ? "2px solid var(--md-sys-color-primary)" : "1px solid var(--md-sys-color-outline-variant)",
                    backgroundColor: paymentMethod === "Online" ? "var(--md-sys-color-primary-container)" : "var(--md-sys-color-surface)",
                    color: paymentMethod === "Online" ? "var(--md-sys-color-on-primary-container)" : "var(--md-sys-color-on-surface)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    transition: "all 0.2s ease"
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "1.3rem" }}>credit_card</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>Online Payment</span>
                </div>

                <div 
                  onClick={() => setPaymentMethod("COD")}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: paymentMethod === "COD" ? "2px solid var(--md-sys-color-primary)" : "1px solid var(--md-sys-color-outline-variant)",
                    backgroundColor: paymentMethod === "COD" ? "var(--md-sys-color-primary-container)" : "var(--md-sys-color-surface)",
                    color: paymentMethod === "COD" ? "var(--md-sys-color-on-primary-container)" : "var(--md-sys-color-on-surface)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    transition: "all 0.2s ease"
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "1.3rem" }}>local_shipping</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>Cash On Delivery</span>
                </div>
              </div>
            </div>
          )}

          {storeSettings?.orderMode === "offline" && (
            <div style={{
              padding: "12px",
              backgroundColor: "var(--md-sys-color-error-container)",
              color: "var(--md-sys-color-on-error-container)",
              borderRadius: "var(--md-shape-corner-medium)",
              fontSize: "0.85rem",
              fontWeight: "600",
              lineHeight: "1.4",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: "1.2rem" }}>warning</span>
              <span>The restaurant is currently offline and not accepting orders.</span>
            </div>
          )}
          <button 
            type="submit" 
            className="m3-btn m3-btn-filled payment-btn" 
            disabled={submitting || storeSettings?.orderMode === "offline" || (fulfillmentType === "delivery" && !isLocationVerified)}
            style={
              (storeSettings?.orderMode === "offline" || (fulfillmentType === "delivery" && !isLocationVerified)) 
              ? { opacity: 0.6, cursor: "not-allowed", marginTop: "16px" } 
              : { marginTop: "16px" }
            }
          >
            {storeSettings?.orderMode === "offline" 
              ? "Ordering Offline" 
              : (fulfillmentType === "delivery" && !isLocationVerified)
              ? "Verify Location" 
              : (submitting ? "Redirecting..." : (fulfillmentType === "dine-in" ? "Place Dine-In Order" : (paymentMethod === "COD" ? "Place Order (COD)" : "Proceed To Payment")))}
            <span className="material-symbols-outlined">payments</span>
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
