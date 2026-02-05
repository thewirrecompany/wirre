import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";

export default function Signup() {
  return (
    <Layout>
      <section className="min-h-[calc(100vh-14rem)] flex items-center justify-center">
        <div className="container max-w-md py-12 text-center">
          <h1 className="text-3xl font-bold font-mono mb-8 uppercase tracking-tighter">Sign Up</h1>

          <div className="border border-foreground p-8 space-y-4">
            <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
              Registration is currently closed.
            </p>
            <p className="font-mono text-xs uppercase text-muted-foreground">
              We are only accepting authorized users and waitlisted candidates at this time.
            </p>
            <div className="pt-4">
              <Link to="/login" className="font-mono text-xs uppercase underline hover:text-muted-foreground">
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}