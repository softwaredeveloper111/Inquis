import {generateChatTitle , generateResponse} from "../services/ai.service.js"


// const title = await generateChatTitle("Explain everything about authentication including JWT cookies refresh tokens Redis blacklisting CSRF protection and rate limiting");


// const finalTitle = title || "New Conversation";

// console.log(finalTitle)





const response = await generateResponse("hi kaise ho tum");
console.log(response)



// node src/test/ai-service.test.js