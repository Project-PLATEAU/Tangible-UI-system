export const authorizeWithApiKey = (req: any) => {
  // 認証情報なし
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer ")
  ) {
    return {
      access: false,
      message: "Bearer realm=\"token_required\"",
    };
  }

  const idToken = req.headers.authorization.split("Bearer ")[1];
  if (idToken === process.env.TANGIBLE_API_KEY) {
    return {
      access: true,
      message: "",
    };
  }
  return {
    access: false,
    message: "token wrong",
  };
};

export const authorizeError = (res: any, authCheck: any) => {
  return res
    .status(401)
    .json({ error: "Unauthorized", message: authCheck.message });
};
