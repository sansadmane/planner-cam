import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          // Request access to read and write to their calendar
          scope: "openid email profile https://www.googleapis.com/auth/calendar.events",
          prompt: "consent", // Forces the consent screen so you get a refresh token
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],
  callbacks: {
    // Pass the Google Access Token to the session so your app can use it
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    }
  }
});