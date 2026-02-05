import axios from 'axios';

const API_URL = '/issues';

const getIssues = async (params = {}) => {
    const response = await axios.get(API_URL, { params });
    return response.data;
};

const createIssue = async (issueData) => {
    const response = await axios.post(API_URL, issueData);
    return response.data;
};

const getIssue = async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
};

const updateIssue = async (id, issueData) => {
    const response = await axios.put(`${API_URL}/${id}`, issueData);
    return response.data;
};

const deleteIssue = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
};

export default {
    getIssues,
    createIssue,
    getIssue,
    updateIssue,
    deleteIssue
};
