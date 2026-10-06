import { evaluate } from "mathjs";


export async function EvalMathExp({expression}){
    try {
      const result = evaluate(expression);

      return JSON.stringify(result);
    } catch (error) {
      return `Could not calculate: ${error.message}`;
    }
}