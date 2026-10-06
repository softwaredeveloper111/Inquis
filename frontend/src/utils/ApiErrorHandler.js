import ApiError from "./ApiError";


const ApiErrorHandler = (error) => {
  if (error.code === "ECONNABORTED") {
    throw new ApiError("Request timed out. Please try again.", 408);
  }
  if (error.response) {
    const { status, data } = error.response;
    const message = data?.message || "Server error occurred";
    const errors = data?.errors || [];

  
      if (status === 401) {
    throw new ApiError(
       data?.message || "Unauthorized. Please login again.",
      401,
      errors
    );
  }

    throw new ApiError(message, status, errors);
  }
  if (error.request) {
    throw new ApiError("Network error: Server not reachable", 503);
  }
  throw new ApiError("Something went wrong", 500);
}


export default ApiErrorHandler