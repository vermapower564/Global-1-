const axios = require("axios");

async function testHttpLogin() {
  console.log("Sending POST http://localhost:3000/api/auth/login...");
  try {
    const res = await axios.post("http://localhost:3000/api/auth/login", {
      identity: "roushan.verma@gmail.com",
      password: "Roushan@123",
    });
    console.log("Status:", res.status);
    console.log("Response:", res.data);
  } catch (err) {
    if (err.response) {
      console.log("HTTP Error:", err.response.status, err.response.data);
    } else {
      console.log("Error:", err.message);
    }
  }
}

testHttpLogin();
