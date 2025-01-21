import {createBrowserRouter} from "react-router-dom";
import HomePage from "./pages/HomePage";
import GalleryPage from "./pages/Gallery";
import EditMemesPage from "./pages/edit/Memes";
import EditMessagesPage from "./pages/edit/Messages";
import EditWordsPage from "./pages/edit/Words";
import EditLyricsPage from "./pages/edit/Lyrics";
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
        {
            path: "/edit/memes",
            element: <EditMemesPage />
        },
        {
            path: "/edit/messages",
            element: <EditMessagesPage />
        },
        {
            path: "/edit/words",
            element: <EditWordsPage />
        },
        {
            path: "/edit/lyrics",
            element: <EditLyricsPage />
        },
        ]
    },
], { basename: "/memefactory" });

export default router;