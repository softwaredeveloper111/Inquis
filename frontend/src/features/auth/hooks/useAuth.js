import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

import {
  login,
  signup,
  getMe,
  logout,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
} from "../redux/auth.thunk";




const useAuth = () => {

 const dispatch = useDispatch();
 const {
    user,
    isLoading,
    error,
    isAuthenticated,
    status,

     resendVerificationLoading,
     resendVerificationError,

     forgotPasswordLoading,
      forgotPasswordError,

    resetPasswordLoading,
    resetPasswordError,

 } = useSelector((state)=>state.auth)
 

 const loginUserHandler = useCallback(
  async(email,password)=>{
    try {
      const result = await dispatch(login({email,password})).unwrap()

      toast.success(result?.message);
      return result;
    } catch (error) {

       toast.error(error || "Login failed, please try again");
        return null;
    }
 },[dispatch]);


 const registerHandler = useCallback(
  async(username,email,password)=>{
    try {
      const result = await dispatch(signup({username,email,password})).unwrap();

         toast.success(result?.message);
        return result;
    } catch (error) {
      toast.error(error || "Registration failed, please try again");
        return null;
    }
 },[dispatch]);



 const initializeAuth  = useCallback(
  async()=>{
  try {
          await dispatch(getMe()).unwrap();

  } catch {
    // Redux already handles unauthenticated state
  }
 },[dispatch]);



 const resendVerificationHandler = useCallback(
  async(email)=>{ 
   try {
    const result = await dispatch(
          resendVerificationEmail(email)
        ).unwrap();
    toast.success(result?.message);
    return result;
   } catch (error) {
        toast.error(error || "Failed to resend verification email");
        return null;

   }
 },[dispatch]);



 const forgotPasswordHandler = useCallback(
    async (email) => {
      try {
        const result = await dispatch(forgotPassword(email)).unwrap();

        toast.success(result?.message);
        return result;
      } catch (error) {
        toast.error(error || "Failed to send reset email");
        return null;
      }
    },
    [dispatch]
  );


  const resetPasswordHandler = useCallback(
    async (token, password) => {
      try {
        const result = await dispatch(
          resetPassword({ token, password })
        ).unwrap();

        toast.success(result?.message);
        return result;
      } catch (error) {
        toast.error(error || "Failed to reset password");
        return null;
      }
    },
    [dispatch]
  );


  const logoutHandler = useCallback(async () => {
    try {
      const result = await dispatch(logout()).unwrap();

      toast.success(result?.message);
      return true;
    } catch (error) {
      toast.error(error || "Logout failed, please try again");
      return false;
    }
  }, [dispatch]);


  return (
    {
      user,
    isLoading,
    error,
    isAuthenticated,
    status,

     resendVerificationLoading,
     resendVerificationError,

     forgotPasswordLoading,
      forgotPasswordError,

    resetPasswordLoading,
    resetPasswordError,

      loginUserHandler,
     registerHandler,

     initializeAuth,
     
     resendVerificationHandler,
     forgotPasswordHandler,
     resetPasswordHandler,
     logoutHandler,

    }
  )
}

export default useAuth