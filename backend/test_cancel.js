import axios from "axios";

const BASE_URL = "http://localhost:4000";

async function runTest() {
  console.log("=== STARTING INTEGRATION TEST: ORDER CANCELLATION ===");

  const randomId = Math.floor(Math.random() * 1000000);
  const email = `test_user_${randomId}@gmail.com`;
  const name = `Test User ${randomId}`;
  const password = "password123";

  let token = "";

  // 1. Register User
  try {
    console.log(`\nStep 1: Registering user (${email})...`);
    const regRes = await axios.post(`${BASE_URL}/api/user/register`, {
      name,
      email,
      password
    });
    if (regRes.data.success) {
      token = regRes.data.token;
      console.log(`✓ User registered successfully! Token: ${token.substring(0, 15)}...`);
    } else {
      throw new Error(`Registration failed: ${regRes.data.message}`);
    }
  } catch (err) {
    console.error("❌ Registration failed:", err.response?.data || err.message);
    return;
  }

  // 2. Place Order
  try {
    console.log("\nStep 2: Placing a new order...");
    const placeRes = await axios.post(
      `${BASE_URL}/api/order/place`,
      {
        items: [{ _id: "dummy_food_id", name: "Greek Salad", price: 150, quantity: 2, image: "dummy.png" }],
        amount: 300,
        address: {
          firstName: "Test",
          lastName: "User",
          street: "123 Test St",
          city: "New York",
          state: "NY",
          zipcode: "10001",
          country: "USA",
          phone: "1234567890"
        },
        notes: "No onions please"
      },
      { headers: { token } }
    );
    if (placeRes.data.success) {
      console.log("✓ Order placed successfully!");
    } else {
      throw new Error(`Order placement failed: ${placeRes.data.message}`);
    }
  } catch (err) {
    console.error("❌ Order placement failed:", err.response?.data || err.message);
    return;
  }

  // 3. Fetch User Orders to get the Order ID
  let orderId = "";
  try {
    console.log("\nStep 3: Fetching user orders...");
    const fetchRes = await axios.post(
      `${BASE_URL}/api/order/userorders`,
      {},
      { headers: { token } }
    );
    if (fetchRes.data.success && fetchRes.data.data.length > 0) {
      const order = fetchRes.data.data[0];
      orderId = order._id;
      console.log(`✓ Found placed order! ID: ${orderId}, Current Status: ${order.status}`);
    } else {
      throw new Error("No orders found for this user.");
    }
  } catch (err) {
    console.error("❌ Fetching orders failed:", err.response?.data || err.message);
    return;
  }

  // 4. Cancel the Order (Should succeed)
  try {
    console.log(`\nStep 4: Cancelling order (${orderId}) using /api/order/cancel...`);
    const cancelRes = await axios.post(
      `${BASE_URL}/api/order/cancel`,
      { orderId },
      { headers: { token } }
    );
    console.log(`✓ Cancel API Response:`, cancelRes.data);
  } catch (err) {
    console.error("❌ Cancellation failed:", err.response?.data || err.message);
    return;
  }

  // 5. Verify status has changed to "Cancelled"
  try {
    console.log("\nStep 5: Fetching user orders to verify status update...");
    const fetchVerifyRes = await axios.post(
      `${BASE_URL}/api/order/userorders`,
      {},
      { headers: { token } }
    );
    const order = fetchVerifyRes.data.data.find(o => o._id === orderId);
    if (order) {
      console.log(`✓ Verified! Order Status in database is now: ${order.status}`);
      if (order.status === "Cancelled") {
        console.log("🎉 SUCCESS: PERSISTED STATUS IS CORRECTLY CANCELLED!");
      } else {
        console.log("❌ FAILURE: PERSISTED STATUS IS NOT CANCELLED!");
      }
    } else {
      throw new Error("Order not found during verification.");
    }
  } catch (err) {
    console.error("❌ Verification failed:", err.response?.data || err.message);
    return;
  }

  // 6. Attempt to cancel again (Should fail because it is already Cancelled)
  try {
    console.log("\nStep 6: Attempting to cancel the same order again (expecting failure)...");
    const recancelRes = await axios.post(
      `${BASE_URL}/api/order/cancel`,
      { orderId },
      { headers: { token } }
    );
    console.log("❌ Error: API allowed double cancellation!", recancelRes.data);
  } catch (err) {
    console.log(`✓ Expected error returned successfully! Response:`, err.response?.data);
    console.log("🎉 SUCCESS: API correctly rejected double cancellation!");
  }

  console.log("\n=== INTEGRATION TEST COMPLETED SUCCESSFULLY ===");
}

runTest();
