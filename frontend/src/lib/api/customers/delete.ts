import apiClient from "../client";

export async function deleteCustomer(id: string) {
  try {
    const response = await apiClient.delete(`/customers/${id}`);
    return { data: response.data as { success: boolean; message: string }, status: response.status };
  } catch (error) {
    return { error };
  }
}
