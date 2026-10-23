import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Image from "next/image";


const GITHUB_URL = "https://github.com/YOUR-USERNAME/upgradelens"; 

export default function Home() {
  return (
    <>
    <Header githubUrl={GITHUB_URL} />
    <main className="flex-1">
      <Hero/>
    </main>
    </>
  );
}
