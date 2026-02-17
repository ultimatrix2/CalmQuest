import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';

export const useAuth = () => {
    const { user, isAuthenticated, loading, error, token } = useSelector((state: RootState) => state.auth);
    return { user, isAuthenticated, loading, error, token };
};
