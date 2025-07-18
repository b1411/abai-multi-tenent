import api from '.';

export const openaiResponsesApi = {
  sendMessage: async (data: { message: string; scenario: string; files?: File[] }) => {
    const formData = new FormData();
    formData.append('message', data.message);
    formData.append('scenario', data.scenario);
    if (data.files) {
      data.files.forEach((file) => {
        formData.append('files', file);
      });
    }
    const response = await api.post('/sps-chat/openai-responses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
}; 