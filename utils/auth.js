export const getUserFromAuthHeader = () => {
  const authorization = req.headers.authorization || null;
  if (!authorization) {
    return null;
  }

  console.log(authorization);
};
