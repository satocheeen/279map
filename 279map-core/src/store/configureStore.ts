import { configureStore } from '@reduxjs/toolkit'
// import { dataReducer } from './data/dataSlice';
import { operationReducer } from './operation/operationSlice';
// import { sessionReducer } from './session/sessionSlice';
import { useDispatch } from 'react-redux'

export const store = configureStore({
    reducer: {
        // session: sessionReducer,
        // data: dataReducer,
        operation: operationReducer,
    }
});
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;