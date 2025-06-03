import {configureStore} from "@reduxjs/toolkit";
import { apiSlice } from "./slices/apiSlice";
import authReducer from "./slices/auth/authSlice";

import {disableReactDevTools} from "@fvilers/disable-react-devtools";

if (process.env.NODE_ENV === 'production') disableReactDevTools;

const store = configureStore({
  reducer: {
    auth: authReducer,
   [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: getDefaultMiddleware => getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: false,
});

export default store;