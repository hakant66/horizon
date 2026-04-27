import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/setup/:path*",
    "/questionnaire/:path*",
    "/materiality/:path*",
    "/data-collection/:path*",
    "/emissions/:path*",
    "/risks/:path*",
    "/targets/:path*",
    "/reports/:path*",
    "/certification/:path*",
    "/audit-trail/:path*",
    "/settings/:path*",
    "/api/:path*",
  ],
};
