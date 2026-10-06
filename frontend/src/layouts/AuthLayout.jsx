import {Outlet} from "react-router-dom";

 const AuthLayout = ()=>{
   return(
    <main className="auth-layout">
      <Outlet/>
    </main>
   )
}

export default  AuthLayout