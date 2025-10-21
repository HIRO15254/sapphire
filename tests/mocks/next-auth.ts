// Mock for next-auth (not used in todo app)
export default () => ({
  auth: async () => null,
  handlers: {
    GET: async () => new Response(),
    POST: async () => new Response(),
  },
  signIn: async () => {},
  signOut: async () => {},
});
