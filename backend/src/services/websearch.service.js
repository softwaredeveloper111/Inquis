import {config} from  "../config/config.js";
import { tavily } from "@tavily/core";

const tvly = tavily({ apiKey: config.TVLY_API_KEY });

export async function webSearch({question}){

  const response = await tvly.search(question , { maxResults: 3 ,searchDepth:"basic"  });
  return JSON.stringify(
    response.results.map(({ title, url, content }) => ({ title, url, content }))
  );

}