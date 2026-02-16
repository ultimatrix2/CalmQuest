import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type Theme = 'dark' | 'light' | 'system'

interface ThemeState {
    theme: Theme
}

const getInitialTheme = (): Theme => {
    const storedTheme = localStorage.getItem('calmquest-theme') as Theme
    if (storedTheme) {
        return storedTheme
    }
    return 'system'
}

const initialState: ThemeState = {
    theme: getInitialTheme(),
}

const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        setTheme: (state, action: PayloadAction<Theme>) => {
            state.theme = action.payload
            localStorage.setItem('calmquest-theme', action.payload)
        },
    },
})

export const { setTheme } = themeSlice.actions
export default themeSlice.reducer
