import { AppRouter } from "./router/AppRouter";
import  AppErrorBoundary from "../utils/ErrorBoundary"
import useAuth from "../features/auth/hooks/useAuth";
import { useEffect } from "react";


const App = () => {

  const {initializeAuth} = useAuth();

  useEffect(()=>{
    initializeAuth();
  },[initializeAuth])

  return (
    <AppErrorBoundary>
      <AppRouter/>
  
    </AppErrorBoundary>
  )
}

export default App