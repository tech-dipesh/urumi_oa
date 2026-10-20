import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router"
import App from "@/App"
import Audit from "@/pages/Audit"
import Chat from "@/pages/Chat"
import Keys from "@/pages/Keys"
import Login from "@/pages/Login"
import Members from "@/pages/Members"
import Servers from "@/pages/Servers"
import "@/index.css"
const router = createBrowserRouter([
  {
    path: "/", element: <App />,
    children: [ { index: true, element: <Chat /> },
      { path: "servers", element: <Servers /> },
      { path: "members", element: <Members /> },
      { path: "keys", element: <Keys /> },
      { path: "audit", element: <Audit /> },
    ],
  },
  { path: "login", element: <Login /> },
])
createRoot(document.getElementById("root")!).render(
  <StrictMode> <RouterProvider router={router} /> </StrictMode>, )
