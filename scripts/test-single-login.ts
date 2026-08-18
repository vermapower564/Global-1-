import axios from "axios";

async function test() {
  try {
    const res = await axios.post("http://127.0.0.1:3000/api/auth/login", {
      email: "roushan.verma@gmail.com",
      password: "Roushan@123",
    });
    console.log("Status:", res.status);
    console.log("Data:", res.data);
    console.log("Cookies:", res.headers["set-cookie"]);
  } catch (err: any) {
    console.log("Error status:", err.response?.status);
    console.log("Error data:", err.response?.data);
    console.log("Error message:", err.message);
  }
}

test();
