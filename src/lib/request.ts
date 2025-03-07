export const backendRequest = async (path: string) => {
  const response = await fetch(`/api/${path}`, {
    method: "GET",
  });
  const data = await response.json();
  return data;
};
