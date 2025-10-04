"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFinancialInsight = void 0;
const generative_ai_1 = require("@google/generative-ai");
// Initialize the Gemini AI client
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const getFinancialInsight = async (query, financialData) => {
    const { accounts, netWorthHistory } = financialData;
    // This is the crucial part: The Prompt.
    // We give the AI a role, provide it with the user's financial data as context,
    // and then give it the user's specific question.
    const prompt = `
    You are an expert financial advisor named 'Monolith'. Your tone is helpful, insightful, and slightly formal.
    You are analyzing the personal financial data for a user. Do not mention that this is mock data.
    Use the provided data to answer the user's question accurately.
    When providing numbers, format them as Indian Rupees (e.g., ₹1,50,000).

    Here is the user's financial data:
    - Accounts: ${JSON.stringify(accounts, null, 2)}
    - Net Worth History: ${JSON.stringify(netWorthHistory, null, 2)}

    User's Question: "${query}"

    Your Answer:
  `;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }
    catch (error) {
        console.error('Error calling Gemini API:', error);
        throw new Error('Failed to get insights from AI model.');
    }
};
exports.getFinancialInsight = getFinancialInsight;
