import axios from "axios";
import apiErrorHandler from "../../utils/ApiErrorHandler";


const MAX_RETRIES = 2;
const RETRY_STATUS_CODES = [503];



const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API,
  timeout: 12000,
  withCredentials: true,

});



axiosInstance.interceptors.request.use(
  (config) => {
    config._retryCount = config._retryCount ?? 0;
    return config;
  },
  (error) => Promise.reject(error)
);



axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config ?? {};
    const status = error.response?.status;
    if ( RETRY_STATUS_CODES.includes(status) && config._retryCount < MAX_RETRIES) {
      config._retryCount += 1;
      const delay = 1000 * Math.pow(2, config._retryCount - 1);
      await new Promise((res) => setTimeout(res, delay));
      return axiosInstance(config);
    }
    return Promise.reject(apiErrorHandler(error));
  }
);





export default axiosInstance;