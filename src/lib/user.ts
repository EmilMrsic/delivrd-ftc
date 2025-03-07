export const getUserData = () => {
  const userData = localStorage.getItem("user");
  if (!userData) {
    console.error("No user data found in localStorage");
    return;
  }

  const parseUserData = JSON.parse(userData);
  return parseUserData;
};
