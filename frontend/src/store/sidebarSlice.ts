import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface SidebarState {
    isOpen: boolean
    isCollapsed: boolean
    activeNavItem: string | null
    isMobile: boolean
}

const initialState: SidebarState = {
    isOpen: true,
    isCollapsed: false,
    activeNavItem: null,
    isMobile: false,
}

const sidebarSlice = createSlice({
    name: 'sidebar',
    initialState,
    reducers: {
        toggleSidebar: (state) => {
            state.isOpen = !state.isOpen
        },
        setSidebarOpen: (state, action: PayloadAction<boolean>) => {
            state.isOpen = action.payload
        },
        toggleCollapse: (state) => {
            state.isCollapsed = !state.isCollapsed
        },
        setCollapsed: (state, action: PayloadAction<boolean>) => {
            state.isCollapsed = action.payload
        },
        setActiveNavItem: (state, action: PayloadAction<string | null>) => {
            state.activeNavItem = action.payload
        },
        setIsMobile: (state, action: PayloadAction<boolean>) => {
            state.isMobile = action.payload
        },
    },
})

export const {
    toggleSidebar,
    setSidebarOpen,
    toggleCollapse,
    setCollapsed,
    setActiveNavItem,
    setIsMobile
} = sidebarSlice.actions
export default sidebarSlice.reducer
