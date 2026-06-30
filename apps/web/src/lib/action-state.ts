// État renvoyé par les Server Actions de la console exploitant et consommé par
// `useActionState` côté client.

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const IDLE_STATE: ActionState = { status: "idle" };
