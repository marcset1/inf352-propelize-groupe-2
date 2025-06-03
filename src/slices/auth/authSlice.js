import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    userInfo: localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null,
    token: localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).accessToken : null
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            const {userInfo, token} = action.payload;
            console.log(action.payload)
            state.userInfo = userInfo;
            state.token = token
            //console.log('token: ', state.token);
            //console.log('userInfo: ', state.userInfo);
            localStorage.setItem('userInfo', JSON.stringify(action.payload))
        },
        logout: (state) => {      
            state.userInfo = null;
            state.token = null;
            localStorage.removeItem('userInfo')
        }
    }
})

export const {setCredentials, logout} = authSlice.actions; 
export const selectCurrentToken = (state) => state.auth.token;
export const selectCurrentUser = (state) => state.auth.userInfo
export default authSlice.reducer;
