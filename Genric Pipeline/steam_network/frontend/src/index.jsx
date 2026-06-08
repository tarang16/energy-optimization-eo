import { Provider } from 'jotai'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import APP_ROUTES from 'routes/HomeRoutes'
import './index.scss'

const router = createHashRouter(APP_ROUTES)

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider>
    <Toaster position='top-center' reverseOrder={false} />
    <RouterProvider router={router} />
  </Provider>,
)
