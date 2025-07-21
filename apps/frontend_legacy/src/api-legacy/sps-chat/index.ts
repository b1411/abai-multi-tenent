import api from '..';

export const spsChatApi = {
    initSession: async () => {
        const response = await api.get('/sps-chat/init-session');
        return response.data;
    }
}