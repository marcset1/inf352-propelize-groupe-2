import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import { logout, setCredentials } from "./auth/authSlice";
import { API_BASE_URL } from "../routes/serverRoutes";
const baseQuery = fetchBaseQuery({
    //baseUrl: API_BASE_URL,
    baseUrl: 'http://localhost:5000',
    credentials: 'include',
    prepareHeaders: (headers, {getState}) => {
        const token = getState().auth.token;
        console.log("Heyyy token: ", token);
        if(token) {
            headers.set("authorization", `Bearer ${token}`);
            headers.set("Content-Type", "application/json");
        }
        return headers;
    },

});

const baseQueryWithReauth = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);
    //console.log("RECCCXX: ", result);
    if(result?.error?.originalStatus === 401) {
        console.log('sending refresh token');
        const refreshResult = await baseQuery('/refresh', api, extraOptions);
        console.log(refreshResult);
        if(refreshResult?.data) {
            const userInfo = api.getState().auth.userInfo;
            // store the new token
            api.dispatch(setCredentials({...refreshResult.data, userInfo}));
            // retry original query with new access token
            result = await baseQuery(args, api, extraOptions)
        }else {
            //console.log('Haha logged out');
           api.dispatch(logout());
           ///return;
        }
    }
    return result;
}

export const apiSlice = createApi({
    baseQuery: baseQueryWithReauth,
    tagTypes: ["User"],
    endpoints: (builder) => ({

    })
})