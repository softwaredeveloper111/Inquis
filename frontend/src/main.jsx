import { createRoot } from 'react-dom/client'
import './styles/globals.scss'
import App from './app/App'
import {Toaster} from "sonner"

import store from './store/store'
import {Provider} from "react-redux"

createRoot(document.getElementById('root')).render(
 
<Provider store={store}>
    <App />
    <Toaster position='top-right'/>
</Provider>

)
