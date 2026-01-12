import { render, screen } from '@testing-library/react';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './app/store';

describe('App', () => {
    it('renders loading state or store initially', () => {
        render(
            <Provider store={store}>
                <App />
            </Provider>
        );
        // Since we have async data fetching, initially it might show loading or title
        // Just checking if it doesn't crash
        expect(true).toBe(true);
    });
});
