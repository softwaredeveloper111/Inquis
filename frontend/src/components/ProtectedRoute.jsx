import {Navigate,Outlet,useLocation} from "react-router-dom";
import SpinnerLoader from "./SpinnerLoader";
import useAuth from "../features/auth/hooks/useAuth";




const ProtectedRoute = () => {

  const {status} = useAuth();
  const location = useLocation();

  if(status === "loading"){
    return <SpinnerLoader fullscreen/>
  }

  if(status !== "authenticated"){
    return <Navigate to="/login" replace state={{from:location}}/>
  }

  return (
    <Outlet/>
  )
}

export default ProtectedRoute