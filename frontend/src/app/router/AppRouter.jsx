import { createBrowserRouter, RouterProvider } from "react-router-dom";

import AuthLayout from "../../layouts/AuthLayout";
import AppLayout from "../../layouts/AppLayout";

import LoginPage from "../../features/auth/pages/LoginPage";
import SignupPage from "../../features/auth/pages/SignupPage";

import NotFound from "../../components/NotFound";
import ResetPasswordPage from "../../features/auth/pages/ResetPasswordPage";

import ProtectedRoute from "../../components/ProtectedRoute";
import PublicRoute from "../../components/PublicRoute";

import {Navigate} from "react-router-dom"

import Dashboard from "../../features/chat/pages/Dashboard";
import Connectors from "../../features/connectors/pages/Connectors";

import PrivacyPage from "../../features/legal/pages/PrivacyPage";
import TermsPage from "../../features/legal/pages/TermsPage";


const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/login", element: <LoginPage /> },
          { path: "/signup", element: <SignupPage /> },
          { path: "/reset-password", element: <ResetPasswordPage /> },
        ],
      },
    ],
  },

  {
    element: <AuthLayout />,
    children: [
      { path: "/privacy", element: <PrivacyPage /> },
      { path: "/terms", element: <TermsPage /> },
    ],
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <Dashboard/> },
          { path:"/dashboard" , element:<Navigate to="/" replace/>},
          { path:"/connectors" , element:<Connectors />}
        ],
      },

    ],
  },

  {
    path: "*",
    element: <NotFound />,
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};
