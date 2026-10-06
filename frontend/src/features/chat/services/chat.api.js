import axiosInstance from "../../../services/api/axios";

const API_URL = import.meta.env.VITE_BACKEND_API;

const chatServices = {

  getChats: async (params) => {
  const response = await axiosInstance.get("/api/chats", { params });
  return response.data;
},


   getChatMessages: async (chatId, params) => {
  const response = await axiosInstance.get(`/api/chats/messages/${chatId}`, { params });
  return response.data;
},


  streamChatMessage:  async ({ message, chatId ,fileIds }, onEvent) => {

  const response = await fetch(`${API_URL}/api/chats/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",

    body: JSON.stringify({
  message,
  ...(chatId && { chatId }),
  ...(fileIds?.length && { fileIds }),
}),

  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Something went wrong");
  }

  if (!response.body) {
    throw new Error("Streaming is not supported");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;

      const event = JSON.parse(line);

      onEvent(event);
    }
  }
    // last line agar newline ke bina aayi ho
  if (buffer.trim()) onEvent(JSON.parse(buffer));
  } ,


     uploadFile: async (file,signal) => {
     const formData = new FormData();
     formData.append("file", file);
     const response = await axiosInstance.post("/api/files", formData , { timeout: 60_000 , signal });
     return response.data;
   },

   getFile: async (fileId) => {
     const response = await axiosInstance.get(`/api/files/${fileId}`);
     return response.data;
   },
   

   deleteChat: async(chatId)=>{
    const response = await axiosInstance.delete(`/api/chats/delete/${chatId}`);
    return response.data
   },

   pinnedChat : async(chatId)=>{
    const response = await axiosInstance.patch(`/api/chats/pinned/${chatId}`);
    return response.data
   },


   renameChat : async(chatId , newTitle)=>{
    const response = await axiosInstance.patch(`/api/chats/rename/${chatId}`,{newTitle});
    return response.data
   }

}


export default chatServices