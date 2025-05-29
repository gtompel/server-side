import axios from 'axios';
import { DataItem } from '../types';

const API_URL = 'http://localhost:3001/api';

export const fetchData = async (page: number, limit: number = 20): Promise<{
  data: DataItem[];
  total: number;
  hasMore: boolean;
}> => {
  const response = await axios.get(`${API_URL}/data`, { 
    params: { page, limit } 
  });
  return response.data;
};

export const searchData = async (query: string, page: number, limit: number = 20): Promise<{
  data: DataItem[];
  total: number;
  hasMore: boolean;
}> => {
  const response = await axios.get(`${API_URL}/search`, { 
    params: { query, page, limit } 
  });
  return response.data;
};

export const saveSelectedItems = async (selected: number[]): Promise<{ success: boolean; count: number }> => {
  const response = await axios.post(`${API_URL}/selected`, { selected });
  return response.data;
};

export const getSelectedItems = async (): Promise<{ selected: number[] }> => {
  const response = await axios.get(`${API_URL}/selected`);
  return response.data;
};

export const saveSortOrder = async (order: number[]): Promise<{ success: boolean }> => {
  const response = await axios.post(`${API_URL}/sortorder`, { order });
  return response.data;
};

export const getSortOrder = async (): Promise<{ order: number[] }> => {
  const response = await axios.get(`${API_URL}/sortorder`);
  return response.data;
};