import {Navigate,Outlet}  from "react-router-dom";
import SpinnerLoader from "./SpinnerLoader";
import useAuth from "../features/auth/hooks/useAuth";



const PublicRoute = () => {

  const {status} = useAuth();
 
  
  if (status === "loading") {
    return <SpinnerLoader fullscreen/>
  }

  if(status === 'authenticated'){
    return <Navigate to="/" replace />
  }

  return (
    <Outlet/>
  )
}

export default PublicRoute