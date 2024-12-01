import {createBrowserRouter} from "react-router-dom";
import HomePage from "./pages/HomePage";
import GalleryPage from "./pages/Gallery";
import App from "./App";

const router = createBrowserRouter([
    {
        element: <App />,
        children: [
        {
            path: "/",
            element: <HomePage />,
        },
        {
            path: "/gallery",
            element: <GalleryPage />
        },
        ]
    },
], { basename: "/" });

export default router;