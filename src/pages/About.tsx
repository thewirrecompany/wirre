import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function About() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/");
  }, [navigate]);

  return (
    <Layout>
      <article className="py-24">
        <div className="container max-w-3xl">
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mb-4">
            Redirecting...
          </p>
          <h1 className="text-4xl md:text-5xl font-bold font-mono tracking-tight mb-12">
            Redirecting to Home
          </h1>
        </div>
      </article>
    </Layout>
  );
}
