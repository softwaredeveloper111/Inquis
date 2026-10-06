export const user = { email: "demo.user@gmail.com", plan: "Free plan" };

export const models = ["GPT-4o", "Claude Sonnet", "Gemini 1.5 Pro", "Llama 3.1 70B", "Mistral Large"];

export const demoAnswer = {
  intro: "This is a demo answer. Real responses will show up here once the backend is connected.",
  introCites: [1, 2],
  points: [
    { text: "Start with the fundamentals and build small projects.", cite: 1 },
    { text: "Read the official docs alongside your practice.", cite: 2 },
    { text: "Compare a few trusted sources before deciding.", cite: 3 },
  ],
  outro: "I can go deeper on any of these points if you want.",
};

const mk = (id, title, question) => ({
  id,
  title,
  pinned: false,
  messages: [
    { id: id + "u", role: "user", text: question },
    { id: id + "a", role: "assistant", ...demoAnswer },
  ],
});

export const demoChats = [
  mk("c1", "hello kaise ho", "hello kaise ho"),
  mk("c2", "Best way to learn React in 2026", "What is the best way to learn React in 2026?"),
  mk("c3", "Should I join a startup as a fresher", "Should I join a startup as a fresher developer?"),
  mk("c4", "Where is the actual face of the moon", "Where is the actual face of the moon?"),
  mk("c5", "I want to make a web application", "I want to make a web application, where should I start?"),
  mk("c6", "Current situation of the IT job market", "What is the current situation of the IT job market?"),
  mk("c7", "Idea for an app where users find salons", "Idea for an app where users can find nearby salons"),
  mk("c8", "Which broking app is better for beginners", "Which broking app is better for beginners?"),
  mk("c9", "Difference between REST and GraphQL", "Explain the difference between REST and GraphQL"),
  mk("c10", "How to write a good README", "How do I write a good README file?"),
];
