// const BASE_URL = "http://localhost:8080";

// export async function registerUser(userData) {
//   const response = await fetch(`${BASE_URL}/users/register`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(userData),
//   });

//   if (!response.ok) {
//     const errorBody = await response.json();
//     throw new Error(errorBody.errorMessage || "Registration failed");
//   }

//   return response.json();
// }

// export async function loginUser(credentials) {
//   const response = await fetch(`${BASE_URL}/auth/login`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(credentials),
//   });

//   if (!response.ok) {
//     const errorBody = await response.json();
//     throw new Error(errorBody.errorMessage || "Login failed");
//   }

//   return response.json();
// }