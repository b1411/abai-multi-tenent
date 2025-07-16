import { Api } from './Api';

// Создаем экземпляр API клиента с правильной конфигурацией
const apiClient = new Api({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    securityWorker: (token: string | null) => {
        if (token) {
            return {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
        }
        return {};
    },
});

export default apiClient;
