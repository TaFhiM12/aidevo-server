const sendResponse = (
  res,
  {
    statusCode = 200,
    success = true,
    message = "Success",
    data = null,
  } = {}
) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
  });
};

export default sendResponse;