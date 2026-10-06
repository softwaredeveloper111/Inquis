import axiosInstance from "../../../services/api/axios";



const authService = {

   
   loginApi: async(email,password)=>{
  const res = await axiosInstance.post(`/api/auth/login` ,  {email,password});
  return res.data
  },

   registerApi: async(username, email,password,)=>{
    const res = await axiosInstance.post (`/api/auth/register`,{username,email,password});
    return res.data
   },

   getMeApi:async()=>{
      const res = await axiosInstance.get("/api/auth/me");
      return res.data
   },

   logoutApi:async()=>{
      const res = await axiosInstance.post("/api/auth/logout");
      return res.data
   },


   resendVerificationEmailApi:async(email)=>{
      const res = await axiosInstance.post("/api/auth/resend-verify-email",{email});
      return res.data
   },


   forgotPasswordApi:async(email)=>{
      const res = await axiosInstance.post("/api/auth/forgot-password",{email});
      return res.data;
   },

   resetPasswordApi:async(token,password)=>{
     
      const res = await axiosInstance.post("/api/auth/reset-password",{token,password});
      return res.data;
   },

   googleLoginUrl: `${import.meta.env.VITE_BACKEND_API}/api/auth/google?mode=login`,
   googleSignupUrl: `${import.meta.env.VITE_BACKEND_API}/api/auth/google?mode=signup`,
   
}


export default authService