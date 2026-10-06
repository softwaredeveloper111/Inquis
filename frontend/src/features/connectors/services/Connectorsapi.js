
import axiosInstance from "../../../services/api/axios";

export const fetchConnectors = async () => {
  const res = await axiosInstance.get("/api/connectors/");
  return res.data.data;
};

// Google consent page ka URL return karta hai
export const startGoogleConnect = async (service) => {
  const res = await axiosInstance.post(`/api/connectors/google/${service}/start`);
  return res.data.data.url;
};

export const removeConnector = (service) => axiosInstance.delete(`/api/connectors/${service}`);


export const confirmConnectorAction = async (id) => {
  const res = await axiosInstance.post(`/api/connectors/actions/${id}/confirm`);
  return res.data.data.summary;
};


export const cancelConnectorAction = (id) => axiosInstance.post(`/api/connectors/actions/${id}/cancel`);
 