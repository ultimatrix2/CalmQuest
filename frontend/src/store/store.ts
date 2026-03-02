import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import sidebarReducer from './sidebarSlice'
import themeReducer from './themeSlice'
import chatReducer from './chatSlice'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        sidebar: sidebarReducer,
        theme: themeReducer,
        chat: chatReducer,
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
