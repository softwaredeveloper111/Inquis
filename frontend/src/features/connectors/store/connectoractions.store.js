// Chhota external store: Redux/chat slice ko touch nahi karta
let actions = [];
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

export const addConnectorAction = (a) => {
  if (!a?.id || actions.some((x) => x.id === a.id)) return;
  actions = [...actions, a];
  emit();
};
export const removeConnectorAction = (id) => {
  actions = actions.filter((x) => x.id !== id);
  emit();
};
export const subscribeActions = (l) => (listeners.add(l), () => listeners.delete(l));
export const getActions = () => actions;