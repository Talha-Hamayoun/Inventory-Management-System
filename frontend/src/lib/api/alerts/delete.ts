import apiClient from "../client";

export async function deleteAlert(id: string) {
  try {
    const response = await apiClient.delete(`/alerts/${id}`);
    return { data: response.data as { success: boolean; message: string }, status: response.status };
  } catch (error) {
    return { error };
  }
}
