import { Provider } from 'jotai'
import 'react-datepicker/dist/react-datepicker.css'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { RouterProvider, createHashRouter } from 'react-router-dom'
import ResizeObserver from 'resize-observer-polyfill'
import APP_ROUTES from 'routes/HomeRoutes'
import { interceptor } from 'utills/interceptor'
import './index.scss'
window.ResizeObserver = ResizeObserver
export const routes = createHashRouter(APP_ROUTES, {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
})
interceptor()
const root = ReactDOM?.createRoot(document.getElementById('root'))
root.render(
  <Provider>
    <Toaster position='top-center' reverseOrder={false} />
    <RouterProvider
      router={routes}
      future={{
        v7_startTransition: true,
      }}
    />
  </Provider>,
)
