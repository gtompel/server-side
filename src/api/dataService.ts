import axios from "axios"

// Определяем базовый URL API в зависимости от окружения
const API_URL = "/api"

export const fetchData = async (page: number, limit: number, search = "") => {
  try {
    const response = await axios.get(`${API_URL}/data`, {
      params: { page, limit, search },
    })
    return response.data
  } catch (error) {
    console.error("Error fetching data:", error)
    throw error
  }
}

export const saveSelections = async (selections: number[]) => {
  try {
    await axios.post(`${API_URL}/selections`, { selections })
  } catch (error) {
    console.error("Error saving selections:", error)
    throw error
  }
}

export const getSelections = async (): Promise<number[]> => {
  try {
    const response = await axios.get(`${API_URL}/selections`)
    return response.data.selections
  } catch (error) {
    console.error("Error getting selections:", error)
    return []
  }
}

export const saveSortOrder = async (order: number[]) => {
  try {
    await axios.post(`${API_URL}/sort-order`, { order })
  } catch (error) {
    console.error("Error saving sort order:", error)
    throw error
  }
}

export const getSortOrder = async (): Promise<number[]> => {
  try {
    const response = await axios.get(`${API_URL}/sort-order`)
    return response.data.order
  } catch (error) {
    console.error("Error getting sort order:", error)
    return []
  }
}
